'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {CheckCircle2,ChevronDown,Loader2,Plug,Send,X} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';

type Props={obraId:string;breadcrumbItems:{id:string|null;title:string}[];selectedIds:string[];onClearSelection:()=>void;onCanvasMaybeChanged:()=>void;defaultOpen?:boolean};
type ModelOption={id:string;label:string;description:string};
type Capability={id:'local'|'openai'|'claude'|'cursor';label:string;models:ModelOption[];limitDescription:string};
type Usage={provider?:string;model?:string;inputTokens?:number;outputTokens?:number;cachedInputTokens?:number;durationMs?:number;local?:boolean;limitDescription?:string};
type Job={id:string;prompt:string;status:string;result?:{reply:string;operations:Record<string,unknown>[]};error?:string;created_at:string;context?:{provider?:string;model?:string};usage?:Usage;activity?:string};
type Device={id:string;last_seen_at:string|null;capabilities?:Capability[];usage?:Usage;activity?:string};

const LOCAL:Capability={id:'local',label:'Automático local',models:[{id:'automatico',label:'Sin IA cuando sea posible',description:'Usa reglas locales primero y Codex solo si hace falta.'}],limitDescription:'Las operaciones locales no consumen suscripción.'};
const PROVIDERS:Capability[]=[LOCAL,{id:'openai',label:'OpenAI · Codex',models:[],limitDescription:'Usa el límite de tu suscripción de ChatGPT.'},{id:'claude',label:'Anthropic · Claude',models:[],limitDescription:'Requiere Claude Code conectado en esta PC.'},{id:'cursor',label:'Cursor',models:[],limitDescription:'Requiere Cursor Agent conectado en esta PC.'}];
const statusLabel:Record<string,string>={queued:'Pendiente · esperando a tu PC',running:'Tu agente está trabajando',completed:'Propuesta lista para revisar',failed:'No se pudo completar',cancelled:'Cancelado',applied:'Cambios aceptados'};
const CLI_HINT:Record<string,string>={openai:'En terminal: codex login',claude:'En terminal: claude auth login',cursor:'Instalá Cursor CLI: irm \'https://cursor.com/install?win32=true\' | iex  →  agent login'};

function isOnline(d:Device){return !!(d.last_seen_at&&Date.now()-Date.parse(d.last_seen_at)<30000);}

export function GrowsCommandBar({obraId,breadcrumbItems,selectedIds,onClearSelection,onCanvasMaybeChanged,defaultOpen}:Props){
 const [open,setOpen]=useState(!!defaultOpen),[draft,setDraft]=useState(''),[jobs,setJobs]=useState<Job[]>([]),[devices,setDevices]=useState<Device[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[pairToken,setPairToken]=useState<string|null>(null),[settings,setSettings]=useState(false);
 const [provider,setProvider]=useState('local'),[model,setModel]=useState('automatico');
 const [legacy,setLegacy]=useState<{id:string;role:string;text:string}[]>([]);
 // per-provider connect flow
 const [cPid,setCPid]=useState<string|null>(null),[cStep,setCStep]=useState(0),[cElapsed,setCElapsed]=useState(0),[cError,setCError]=useState<string|null>(null);
 const end=useRef<HTMLDivElement>(null);
 const endpoint=`/api/obras/${encodeURIComponent(obraId)}/bridge`;

 const load=useCallback(async()=>{try{const res=await fetch(endpoint,{cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.message);setJobs(data.jobs??[]);setDevices(data.devices??[]);}catch(e){setError(e instanceof Error?e.message:'No se pudo leer el puente.');}},[endpoint]);

 useEffect(()=>{setJobs([]);setDevices([]);setLegacy([]);setDraft('');setPairToken(null);setError(null);void fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`,{cache:'no-store'}).then(r=>r.json()).then(j=>setLegacy(j.data?.obra?.canvas_ui?.hilo??[])).catch(()=>{});},[obraId]);
 useEffect(()=>{if(!open)return;void load();const t=setInterval(()=>void load(),4000);return()=>clearInterval(t);},[open,load]);
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();setOpen(o=>!o);}if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[]);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[jobs.length]);

 const send=async(action:string,extra:Record<string,unknown>={})=>{setBusy(true);setError(null);try{const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const data=await res.json();if(!res.ok)throw new Error(data.message);if(data.token)setPairToken(data.token);if(action==='enqueue')setDraft('');if(action==='apply')onCanvasMaybeChanged();await load();return data;}catch(e){setError(e instanceof Error?e.message:'No se pudo completar.');}finally{setBusy(false);}};

 const connected=devices.some(isOnline);
 const onlineDevices=devices.filter(isOnline);
 const detectedCapabilities=useMemo(()=>{const cur=devices.filter(isOnline).flatMap(d=>d.capabilities??[]);const u=new Map<string,Capability>();for(const c of cur)u.set(c.id,c);return [LOCAL,...u.values()];},[devices]);
 const capabilities=PROVIDERS.map(item=>detectedCapabilities.find(a=>a.id===item.id)??item);
 const selectedCapability=capabilities.find(c=>c.id===provider)??capabilities[0];
 const models=selectedCapability?.models??[];
 const selectedModel=models.find(item=>item.id===model)??models[0];
 useEffect(()=>{if(!models.some(item=>item.id===model))setModel(models[0]?.id??'automatico');},[provider,model,models]);

 // ── per-provider connect ─────────────────────────────────────────────────
 const closeConnect=useCallback(()=>{setCPid(null);setCStep(0);setCElapsed(0);setCError(null);},[]);

 const startConnect=useCallback(async(pid:string)=>{
  setCPid(pid);setCStep(1);setCElapsed(0);setCError(null);
  if(connected){setCStep(3);return;}
  try{
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pair'})});
   const data=await res.json();
   if(!res.ok)throw new Error(data.message as string);
   const token=data.token as string;
   setPairToken(token);
   setCStep(2);
   window.location.href=`grows://pair?url=${encodeURIComponent(window.location.origin)}&token=${encodeURIComponent(token)}`;
  }catch(e){setCError(e instanceof Error?e.message:'No se pudo conectar.');setCStep(0);}
 },[connected,endpoint]);

 const cLabel=PROVIDERS.find(p=>p.id===cPid)?.label??'';

 // poll during steps 2 (wait bridge) and 3 (detect provider), con timeout que reporta el fallo en la app
 useEffect(()=>{
  if(!cPid||cStep<2||cStep>=4)return;
  const startedAt=Date.now();
  const poll=async()=>{
   try{
    const res=await fetch(endpoint,{cache:'no-store'});
    const data=await res.json();
    const online=(data.devices??[]).filter(isOnline) as Device[];
    setDevices(data.devices??[]);
    const secs=Math.round((Date.now()-startedAt)/1000);
    if(cStep===2){
     if(online.length>0){setCStep(3);setCElapsed(0);return;}
     if(secs>=35){setCError('No se pudo abrir Grows Bridge. Revisá que aceptaste la ventana de Windows y que Node.js esté instalado, después reintentá.');setCStep(9);}
     return;
    }
    setCElapsed(secs);
    const caps=online.flatMap(d=>d.capabilities??[]);
    if(caps.some(c=>c.id===cPid)){setCStep(4);setTimeout(closeConnect,2500);return;}
    if(online.length===0){setCError('El puente se desconectó. Reintentá la conexión.');setCStep(9);return;}
    if(secs>=30){setCError(`El puente está conectado pero ${cLabel} no inició sesión en esta PC. Abrí una terminal, ${cPid&&CLI_HINT[cPid]?CLI_HINT[cPid]:'iniciá sesión en el CLI'}, y reintentá.`);setCStep(9);}
   }catch{/* silent */}
  };
  const t=setInterval(poll,2000);
  return()=>clearInterval(t);
 },[cPid,cStep,endpoint,closeConnect,cLabel]);

 return <div className="absolute bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-112px))] -translate-x-1/2">

 {/* ── per-provider connect flow modal ── */}
 <Dialog open={!!cPid} onOpenChange={o=>{if(!o)closeConnect();}}>
  <DialogContent className="max-w-sm rounded-2xl p-6">
   <button onClick={closeConnect} className="absolute right-4 top-4 rounded p-1 text-stone-400 hover:text-stone-700 transition-colors"><X size={15}/></button>
   <DialogHeader className="mb-5">
    <DialogTitle className="text-base">Conectar {cLabel}</DialogTitle>
   </DialogHeader>
   <div className="space-y-4">
    {([
     {n:1,label:'Preparando credenciales'},
     {n:2,label:'Abrí Grows Bridge cuando Windows te lo solicite'},
     {n:3,label:`Detectando ${cLabel} en tu PC`},
     {n:4,label:`${cLabel} conectado`},
    ] as const).map(({n,label})=>{
     const failed=cStep===9,done=cStep>n&&!failed,active=cStep===n&&!failed;
     return <div key={n} className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${done?'bg-green-500 text-white':active?'bg-slate-900 text-white':'bg-stone-100 text-stone-400'}`}>
       {done?'✓':n}
      </div>
      <div className="flex-1 min-w-0">
       <p className={`text-sm leading-snug transition-colors ${active?'font-semibold text-stone-900':done?'text-stone-500':'text-stone-300'}`}>{label}</p>
       {active&&n===2&&<p className="mt-1 text-xs text-stone-400">Windows abrirá una ventana de PowerShell. Dejala correr un momento.</p>}
       {active&&n===3&&cElapsed>=10&&cPid&&CLI_HINT[cPid]&&<div className="mt-2 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2"><p className="text-xs text-stone-500 mb-0.5">No lo encontró aún. Intentá:</p><code className="text-xs font-mono text-stone-700">{CLI_HINT[cPid]}</code></div>}
       {active&&n===4&&<CheckCircle2 size={16} className="mt-1 text-green-500"/>}
      </div>
      {active&&n<4&&<Loader2 size={14} className="mt-0.5 flex-shrink-0 animate-spin text-stone-300"/>}
     </div>;
    })}
   </div>
   {cError&&<div className="mt-4 space-y-3">
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{cError}</p>
    {cStep===9&&<div className="flex gap-2"><button onClick={()=>{if(cPid)void startConnect(cPid);}} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors">Reintentar</button><button onClick={closeConnect} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">Cerrar</button></div>}
   </div>}
  </DialogContent>
 </Dialog>

 {/* ── main chat panel ── */}
 {open&&<section aria-label="Conversación de la obra" className="mb-2 flex max-h-[65dvh] flex-col overflow-hidden rounded-xl border border-stone-300 bg-white shadow-xl">
  <header className="flex items-center justify-between border-b px-4 py-3">
   <div>
    <strong className="text-sm">Grows · tu espacio de trabajo</strong>
    <p className="text-xs text-stone-500">{connected?'PC conectada · elegí proveedor y modelo':'PC desconectada · tus pedidos quedan pendientes'}</p>
    {devices.find(d=>d.activity)?.activity&&<p className="mt-1 text-xs text-blue-700">{devices.find(d=>d.activity)?.activity}</p>}
   </div>
   <div className="flex gap-3">
    <button aria-label="Conectar PC" onClick={()=>setSettings(s=>!s)}><Plug size={17}/></button>
    <button aria-label="Colapsar chat" onClick={()=>setOpen(false)}><ChevronDown size={17}/></button>
   </div>
  </header>

  {/* ── settings dialog ── */}
  <Dialog open={settings} onOpenChange={setSettings}>
   <DialogContent className="max-w-md rounded-2xl">
    <DialogHeader>
     <DialogTitle>Agentes de IA</DialogTitle>
     <DialogDescription>Grows usa las suscripciones que ya tenés iniciadas en esta PC.</DialogDescription>
    </DialogHeader>
    <div className="space-y-3">
     <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm font-medium mb-1">¿Es tu primera vez?</p>
      <p className="text-xs text-blue-800 mb-3">Necesitás instalar el conector de Grows en esta PC. Es una app liviana (~10 MB).</p>
      <a href="/api/bridge/download" download className="inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700">
        Descargar conector local
      </a>
      <p className="mt-2 text-[11px] text-amber-900 bg-amber-50 rounded-lg px-2 py-1.5">Si se abren ventanas de PowerShell al conectar: el instalador de GitHub (v0.1.0) está viejo. Usá el build local actualizado, no reinstales desde ese botón.</p>
      <details className="mt-2"><summary className="text-xs text-blue-800 cursor-pointer">Vas a ver una advertencia de Windows/Mac — es normal</summary>
        <p className="text-xs text-blue-800 mt-1">Windows: click en &quot;Más información&quot; → &quot;Ejecutar de todas formas&quot;.<br/>Mac: click derecho en el .dmg → &quot;Abrir&quot; → &quot;Abrir de todas formas&quot;.</p>
      </details>
     </div>
     {PROVIDERS.filter(p=>p.id!=='local').map(item=>{
      const available=detectedCapabilities.find(c=>c.id===item.id);
      return <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
       <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.label}</p>
        <p className="text-xs text-stone-500 leading-snug mt-0.5">{available?'Conectado y listo':item.limitDescription}</p>
       </div>
       {available
        ? <span className="flex-shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">Conectado</span>
        : <button
           disabled={busy}
           onClick={()=>{setSettings(false);void startConnect(item.id);}}
           className="flex-shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >Conectar</button>}
      </div>;
     })}
     {connected&&<button disabled={busy} className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 disabled:opacity-50 hover:bg-red-100 transition-colors" onClick={()=>void Promise.all(onlineDevices.map(device=>send('revoke',{deviceId:device.id}))).then(()=>load())}>{busy?'Desconectando…':'Desconectar esta PC'}</button>}
     <p className="text-xs text-stone-400">{connected?'Esto desconecta el puente de esta obra; tus sesiones de OpenAI y Claude siguen abiertas.':'Hacé clic en Conectar junto al agente que querés usar.'}</p>
     {pairToken&&!connected&&<p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">Solicitud enviada al conector local. Esperando respuesta…</p>}
    </div>
   </DialogContent>
  </Dialog>

  <div className="min-h-20 flex-1 space-y-4 overflow-auto p-4 text-sm">
   {legacy.map(m=><div key={m.id}><span className="text-xs text-stone-400">{m.role==='user'?'Vos':'Grows · conversación anterior'}</span><p className="whitespace-pre-wrap">{m.text}</p></div>)}
   {!jobs.length&&!legacy.length&&<p className="text-stone-500">Pedile a Grows que organice los cuadros, revise dependencias o proponga un trabajo. Seleccioná cuadros para indicar dónde trabajar.</p>}
   {[...jobs].reverse().map(job=>{const measured=!!(job.usage?.inputTokens||job.usage?.outputTokens);return <article key={job.id} className="space-y-2 border-b pb-4"><p className="font-medium">{job.prompt}</p><p className="text-xs text-stone-500">{statusLabel[job.status]??job.status} · {job.context?.provider==='local'?'Automático local':job.context?.provider??'OpenAI'} · {job.context?.model??'automático'}</p>{job.activity&&job.status==='running'&&<p className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">{job.activity}</p>}{job.usage&&<p className="text-xs text-stone-500">{job.usage.local?'Sin consumo de IA':measured?`${(job.usage.inputTokens??0).toLocaleString()} entrada · ${(job.usage.outputTokens??0).toLocaleString()} salida`:'El proveedor no informó tokens'}{job.usage.durationMs?` · ${Math.round(job.usage.durationMs/1000)} s`:''}</p>}{job.result&&<><p className="whitespace-pre-wrap">{job.result.reply}</p>{job.result.operations.length>0&&<details><summary className="cursor-pointer text-xs">Revisar {job.result.operations.length} cambios</summary><ol className="mt-2 space-y-1 text-xs">{job.result.operations.map((op,i)=><li key={i}>{i+1}. {String(op.type)} · {String(op.title??op.id??op.sourceId??'Relación')}<pre className="whitespace-pre-wrap break-words text-stone-500">{JSON.stringify(op,null,2)}</pre></li>)}</ol></details>}</>}{job.error&&<p className="text-red-700">{job.error}</p>}{job.status==='completed'&&!!job.result?.operations.length&&<button disabled={busy} onClick={()=>void send('apply',{jobId:job.id})} className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Aceptar cambios</button>}{['queued','running','completed'].includes(job.status)&&<button disabled={busy} onClick={()=>void send('cancel',{jobId:job.id})} className="ml-3 text-xs text-stone-600">{job.status==='completed'?'Descartar':'Cancelar'}</button>}</article>;})}
   <div ref={end}/>
  </div>
 </section>}

 {/* ── input form ── */}
 <form onSubmit={e=>{e.preventDefault();if(!draft.trim()||busy)return;setOpen(true);void send('enqueue',{prompt:draft.trim(),provider,model,scopePathIds:breadcrumbItems.map(b=>b.id).filter(Boolean),selectionIds:selectedIds});}} className="rounded-xl border border-stone-300 bg-white p-3 shadow-lg">
  <div className="mb-1 flex justify-between text-[11px] text-stone-500"><button type="button" onClick={()=>setOpen(o=>!o)}>{breadcrumbItems.map(b=>b.title).join(' › ')} · {open?'Cerrar conversación':'Abrir conversación'}</button>{selectedIds.length>0&&<button type="button" onClick={onClearSelection}>{selectedIds.length} seleccionados ×</button>}</div>
  <div className="mb-2 flex gap-2"><select aria-label="Proveedor" value={provider} onChange={e=>setProvider(e.target.value)} className="rounded border bg-stone-50 px-2 py-1 text-xs">{capabilities.map(item=>{const available=item.id==='local'||detectedCapabilities.some(cap=>cap.id===item.id);return <option key={item.id} value={item.id} disabled={!available}>{item.label}{available?'':' · desconectado'}</option>;})}</select><select aria-label="Modelo" disabled={!models.length} value={selectedModel?.id??model} onChange={e=>setModel(e.target.value)} className="min-w-40 flex-1 rounded border bg-stone-50 px-2 py-1 text-xs disabled:opacity-50">{models.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
  <p className="mb-2 text-[10px] text-stone-500">{selectedModel?.description} {selectedCapability?.limitDescription}</p>
  <div className="flex items-end gap-3"><textarea aria-label="Pedido a Grows" value={draft} onFocus={()=>setOpen(true)} onChange={e=>setDraft(e.target.value)} placeholder="Preguntale o pedile algo a Grows…" maxLength={8000} rows={1} className="min-h-9 flex-1 resize-none bg-transparent text-sm outline-none" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/><button disabled={busy||!draft.trim()} aria-label="Enviar pedido" className="rounded-lg bg-slate-900 p-2 text-white disabled:opacity-40">{busy?<Loader2 className="animate-spin" size={17}/>:<Send size={17}/>}</button></div>
  {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
 </form></div>;
}
