#!/usr/bin/env python3
"""Usuarios ficticios sobre GROWS real. Nunca escribe resultados de negocio por SQL."""
import argparse, concurrent.futures, datetime, fcntl, json, pathlib, urllib.error, urllib.request, uuid
BASE='https://growsapp2.vercel.app'
OBRA='0deb686c-d97b-68a1-dbeb-ad413a6d394d'
ORG='948f6c0e-8f19-49db-b371-78f44ea17943'
ROOT=pathlib.Path(__file__).resolve().parents[2]
WORK=ROOT/'work'/'ensayo-usuarios';WORK.mkdir(parents=True,exist_ok=True)
def write(path,data):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2));tmp.replace(path)
def api(actor,operation,args=None,key=None,expected=200):
 args=dict(args or {})
 if args.get('obra_id',OBRA)!=OBRA:raise ValueError('El ejecutor solo puede operar su obra ficticia permitida.')
 if operation=='crear_obra':raise ValueError('Esta prueba completa una obra existente.')
 if key:args['request_id']=str(uuid.uuid5(uuid.NAMESPACE_URL,'grows:ensayo-usuarios:v1:'+key))
 request=urllib.request.Request(BASE+'/api/v1/operaciones/'+operation,data=json.dumps(args).encode(),headers={'Authorization':'Bearer '+CREDS[actor]['token'],'Content-Type':'application/json'},method='POST')
 started=datetime.datetime.now(datetime.timezone.utc).isoformat()
 try:
  with urllib.request.urlopen(request,timeout=130) as response:status=response.status;body=json.load(response)
 except urllib.error.HTTPError as e:status=e.code;body=json.loads(e.read())
 except Exception as e:status=0;body={'error':type(e).__name__,'detail':str(e)[:180]}
 data=body.get('data',body)
 record={'at':started,'actor':actor,'operation':operation,'request_id':args.get('request_id'),'http':status,'body':body}
 # Transport success alone is insufficient, including bulk responses with per-item errors.
 record['result']='aprobado' if 200<=status<300 and not (isinstance(data,dict) and (data.get('ok') is False or data.get('success') is False or data.get('errors') or data.get('omitidos'))) else 'fallido' if status else 'infraestructura'
 record['expected_http']=expected
 if status==expected and expected>=400:record['result']='aprobado_rechazo'
 with (WORK/'acciones.jsonl').open('a') as f:f.write(json.dumps(record,ensure_ascii=False)+'\n')
 print(json.dumps({'actor':actor,'operation':operation,'http':status,'result':record['result'],'request_id':args.get('request_id'),'replayed':body.get('replayed'),**({'error':data} if record['result']!='aprobado' else {})},ensure_ascii=False),flush=True)
 return record

def data(r):return r['body'].get('data',r['body'])
def pass_run():
 state_path=WORK/'continuidad.json'
 checkpoint=ROOT/'docs'/'ensayos'/'2026-11-27-continuidad.json'
 state=json.loads(state_path.read_text()) if state_path.exists() else json.loads(checkpoint.read_text()) if checkpoint.exists() else {'obra_id':OBRA,'seed':20261127,'code_version':'132f134193be70d6acfdd96ba03c9fb6898782ed','pasadas':0,'acciones':{},'paused':False}
 if state['obra_id']!=OBRA:raise SystemExit('El estado pertenece a otra obra.')
 if state['paused']:print('Pausada');return
 state['pasadas']+=1
 state['real_at']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 read=api('arquitecto','leer_estado_obra',{'obra_id':OBRA})
 if read['result']!='aprobado':state['next']='bloqueado: lectura';write(state_path,state);return
 view=data(read);write(WORK/'leer_estado_obra.json',read)
 if not view.get('tasks'):
  state['next']='bloqueado: publicar tareas desde el plan existente';write(state_path,state);return
 candidate=next((t for t in view['tasks'] if t['title']=='Hormigonado de fundaciones'),None)
 if not candidate:state['next']='bloqueado: tarea esperada ausente';write(state_path,state);return
 state['task_id']=candidate['id']
 for actor,amount,days in [('contratista1',8280000,3),('contratista2',8694000,2),('contratista3',9108000,4)]:
  step=actor+':oferta-v1'
  if step in state['acciones']:continue
  payload={'obra_id':OBRA,'datos':{'presupuestos':[{'tarea_id':candidate['id'],'monto':amount,'dias_reales':days,'estado':'ENVIADO','incluye_materiales':True,'observacion':'Oferta ficticia en ARS para alcance existente revision 1. Incluye materiales, remitos y probetas. No es una conversion del presupuesto USD. Sin dinero real.'}]}}
  result=api(actor,'cotizar_tareas',payload,step)
  state['acciones'][step]={'http':result['http'],'result':result['result'],'request_id':result['request_id']}
  write(state_path,state)
 if all(state['acciones'].get(a+':oferta-v1',{}).get('result')=='aprobado' for a in ['contratista1','contratista2','contratista3']):
  after=api('arquitecto','leer_estado_obra',{'obra_id':OBRA});write(WORK/'comparacion.json',after)
  offers=[q for q in data(after).get('quotes',[]) if q['tarea_id']==candidate['id'] and q['moneda']=='ARS']
  if len(offers)!=3:state['next']='bloqueado: el auditor no encontro las tres ofertas';write(state_path,state);return
  best=min(offers,key=lambda q:float(q['monto']));state['best_quote']=best['id']
  if any(str(q.get('estado','')).upper()=='APROBADO' for q in offers):
   state['next']='generar bloques: adjudicacion persistida verificada';write(state_path,state);return
  if 'adjudicar-v1' not in state['acciones']:
   result=api('arquitecto','aprobar_presupuestos',{'presupuesto_ids':[best['id']]},'adjudicar-v1')
   state['acciones']['adjudicar-v1']={'http':result['http'],'result':result['result'],'request_id':result['request_id']}
  state['next']='generar bloques' if state['acciones']['adjudicar-v1']['result']=='aprobado' else 'bloqueado: adjudicacion requiere revisar permiso del titular'
 else:state['next']='bloqueado: revisar errores de cotizacion'
 write(state_path,state)
 print(json.dumps({'pasada':state['pasadas'],'next':state['next']},ensure_ascii=False))

def main():
 if MODE=='pasada':return pass_run()
 if MODE in ['pausar','reanudar']:
  path=WORK/'continuidad.json';state=json.loads(path.read_text()) if path.exists() else {'obra_id':OBRA,'seed':20261127,'pasadas':0,'acciones':{}}
  state['paused']=MODE=='pausar';write(path,state);print(MODE);return
 if MODE=='leer':
  ops=[('arquitecto','leer_estudio'),('arquitecto','leer_canvas'),('arquitecto','leer_estado_obra'),('inversor1','ver_obra_publica')]
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
   reads=list(pool.map(lambda op:api(*op,{'obra_id':OBRA}),ops))
  for r in reads:write(WORK/(r['operation']+'.json'),r)
  public=data(reads[-1]); serialized=json.dumps(public)
  if reads[-1]['result']!='aprobado' or OBRA not in serialized:raise SystemExit('No se verificó la obra pública de ensayo.')
  write(WORK/'estado.json',{'obra_id':OBRA,'org_id':ORG,'seed':20261127,'code_version':'4695d5ffc1fe5108f43a9b7596deb04b39a85e2c','next':'publicar','last_run':datetime.datetime.now(datetime.timezone.utc).isoformat()})
 elif MODE=='publicar':
  api('arquitecto','publicar_tareas',{'obra_id':OBRA,'datos':{}},'publicar-plan-v2-fix-autenticacion')
 elif MODE=='inversores':
  for i in range(1,4):
   actor='inversor'+str(i);api(actor,'ver_obra_publica',{'obra_id':OBRA})
   api(actor,'participar_feed',{'obra_id':OBRA,'datos':{'action':'follow'}},actor+':seguir-v1')
  api('inversor1','leer_estudio',{'obra_id':OBRA},expected=403)
  api('contratista1','guardar_perfil_proyecto',{'obra_id':OBRA,'datos':{}},'permiso-plan-contratista',expected=403)
 elif MODE=='concurrencia':
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
   results=list(pool.map(lambda _:api('inversor1','participar_feed',{'obra_id':OBRA,'datos':{'action':'support'}},'inversor1:apoyo-concurrente-v1'),range(2)))
  if not any(r['http']==200 for r in results) or any(r['http'] not in [200,409] for r in results):raise SystemExit('Concurrencia no aprobada: revisar evidencia.')
 elif MODE=='estado':
  r=api('arquitecto','leer_estado_obra',{'obra_id':OBRA});write(WORK/'leer_estado_obra.json',r)
 elif MODE=='operacion':
  payload=json.loads(pathlib.Path(CLI.payload).read_text());r=api(CLI.actor,CLI.operation,payload,CLI.key,CLI.expected);write(WORK/'ultima.json',r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['leer','publicar','inversores','estado','operacion','pasada','pausar','reanudar','concurrencia']);p.add_argument('--credentials',required=True);p.add_argument('--actor');p.add_argument('--operation');p.add_argument('--payload');p.add_argument('--key');p.add_argument('--expected',type=int,default=200);CLI=p.parse_args();MODE=CLI.mode
 CREDS=json.loads(pathlib.Path(CLI.credentials).read_text())
 lock=(WORK/'ejecutor.lock').open('a')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:raise SystemExit('Ya hay una pasada en curso.')
 main()
