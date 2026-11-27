import importlib.util,json,pathlib,tempfile,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('runner',pathlib.Path(__file__).with_name('ejecutor.py'));runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
class ContinuidadTest(unittest.TestCase):
 def test_second_pass_does_not_resubmit_quotes_or_award(self):
  with tempfile.TemporaryDirectory() as directory:
   runner.WORK=pathlib.Path(directory)
   runner.write(runner.WORK/'continuidad.json',{'obra_id':runner.OBRA,'pasadas':0,'acciones':{},'paused':False})
   def call(actor,op,args,key=None,expected=200):
    if op=='leer_estado_obra':return {'result':'aprobado','body':{'data':{'tasks':[{'id':'task','title':'Hormigonado de fundaciones'}],'quotes':[{'id':str(i),'tarea_id':'task','moneda':'ARS','monto':100+i} for i in range(3)]}}}
    return {'http':403 if op=='aprobar_presupuestos' else 200,'result':'fallido' if op=='aprobar_presupuestos' else 'aprobado','request_id':key}
   with patch.object(runner,'api',side_effect=call) as api:
    runner.pass_run();first=api.call_count;runner.pass_run();second=api.call_args_list[first:]
   self.assertTrue(all(call.args[1]=='leer_estado_obra' for call in second))
   self.assertEqual(json.loads((runner.WORK/'continuidad.json').read_text())['pasadas'],2)
 def test_missing_tasks_blocks_without_inventing_quotes(self):
  with tempfile.TemporaryDirectory() as directory:
   runner.WORK=pathlib.Path(directory)
   runner.write(runner.WORK/'continuidad.json',{'obra_id':runner.OBRA,'pasadas':0,'acciones':{},'paused':False})
   with patch.object(runner,'api',return_value={'result':'aprobado','body':{'data':{'tasks':[]}}}) as api:runner.pass_run()
   self.assertEqual(api.call_count,1)
   self.assertIn('bloqueado',json.loads((runner.WORK/'continuidad.json').read_text())['next'])
if __name__=='__main__':unittest.main()
