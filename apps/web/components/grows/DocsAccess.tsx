'use client';
import Link from 'next/link';
import type {Route} from 'next';
import {useEffect,useState} from 'react';
type Org={id:string;name:string;planner:boolean};
type Props={token:string;onToken:(token:string)=>void;open:boolean;onOpen:(open:boolean)=>void};
export default function DocsAccess({token,onToken,open,onOpen}:Props){
 const [organizations,setOrganizations]=useState<Org[]>([]),[org,setOrg]=useState(''),[signedIn,setSignedIn]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[manual,setManual]=useState(''),[grant,setGrant]=useState<string|null>(null);
 useEffect(()=>{let active=true;void fetch('/api/conectores?view=session',{cache:'no-store'}).then(async r=>{if(r.status===401)return null;if(!r.ok)throw Error('No se pudo comprobar tu sesión.');return r.json();}).then(data=>{if(!active)return;if(data&&Array.isArray(data.organizations)){setSignedIn(true);setOrganizations(data.organizations);if(data.organizations.length===1)setOrg(data.organizations[0].id);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function connect(){setBusy(true);setError('');try{const r=await fetch('/api/conectores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session',org_id:org||null})});const data=await r.json();if(!r.ok){if(r.status===401)setSignedIn(false);throw Error(data.error_description??'No se pudo conectar tu cuenta.');}setGrant(data.id);onToken(data.token);onOpen(false);}catch(e){setError((e as Error).message);onOpen(true);}finally{setBusy(false);}}
 function activate(){if(token||!signedIn||organizations.length>1){onOpen(!open);return;}void connect();}
 async function disconnect(){onToken('');onOpen(false);if(grant){const id=grant;setGrant(null);await fetch('/api/conectores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revoke',id})}).catch(()=>{});}}
 return <>
 <button disabled={loading||busy} onClick={activate} className="rounded-lg bg-[#203b2d] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy?'Conectando…':token?'Cuenta conectada':signedIn?'Usar mi cuenta GROWS':'Conectar mi cuenta'}</button>
 {open&&<section aria-label="Conectar cuenta para probar la API" className="fixed right-4 top-20 z-40 max-h-[80vh] w-[min(440px,calc(100vw-32px))] space-y-4 overflow-y-auto rounded-2xl border border-[#dce4d5] bg-white p-5 shadow-xl">
 <div className="flex items-start justify-between gap-4"><h2 className="text-base font-semibold">Probá con tu cuenta de GROWS</h2><button aria-label="Cerrar acceso" onClick={()=>onOpen(false)} className="text-lg">×</button></div>
 <p className="text-sm leading-relaxed text-[#6c786b]">Usá tus permisos habituales. No necesitás copiar claves para probar desde esta página.</p>
 {loading?<p className="text-sm">Comprobando sesión…</p>:signedIn?<>
 {organizations.length>1&&<label className="block text-sm">¿Con qué organización querés trabajar?<select aria-label="Organización de pruebas" value={org} onChange={e=>setOrg(e.target.value)} className="mt-2 w-full rounded-lg border p-3"><option value="">Solo información pública</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
 {organizations.length===1&&<p className="rounded-lg bg-[#f0f4e9] p-3 text-sm">{organizations[0].name}</p>}
 {!organizations.length&&<p className="text-xs">Tu cuenta puede consultar las obras públicas. Las funciones privadas requieren acceso a una organización.</p>}
 <button disabled={busy} onClick={()=>void connect()} className="w-full rounded-lg bg-[#203b2d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Conectando…':'Usar mi cuenta GROWS'}</button>
 </>:<Link href={'/auth/login?redirect=%2Fapi%2Fdocs' as Route} className="block rounded-lg bg-[#203b2d] px-4 py-3 text-center text-sm font-semibold text-white">Ingresar a GROWS y volver acá</Link>}
 {token&&<button onClick={()=>void disconnect()} className="text-xs underline">Desconectar esta página</button>}
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
 <details className="border-t pt-4"><summary className="cursor-pointer text-xs text-[#6c786b]">Opciones avanzadas · usar una clave personal</summary><div className="mt-3 space-y-3"><p className="text-xs">Para herramientas externas o una autorización limitada. La clave solo queda en memoria de esta pestaña.</p><input type="password" autoComplete="off" aria-label="Clave personal avanzada" value={manual} onChange={e=>setManual(e.target.value)} placeholder="grows_c_…" className="w-full rounded-lg border p-3 font-mono text-xs"/><button onClick={()=>{const clean=manual.trim().replace(/^Bearer\s+/i,'');if(!/^grows_c_[A-Za-z0-9_-]{43}$/.test(clean)){setError('Revisá la clave personal de GROWS que pegaste.');return;}setGrant(null);setError('');onToken(clean);setManual('');onOpen(false);}} className="rounded-lg border px-4 py-2 text-xs">Usar clave personal</button><Link href={'/conexiones' as Route} className="ml-3 text-xs underline">Administrar conexiones</Link></div></details>
 </section>}
 </>;
}
