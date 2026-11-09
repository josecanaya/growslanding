'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFeedIdentity } from './useFeedIdentity';
import InvestorView, { InvestmentTeaser } from './InvestorView';
import UnitPackages from './UnitPackages';
import { investmentFor } from '@/lib/obras/investment-demo';
import { obraReturnPath } from '@/lib/obras/feed-profile';
import { ArrowLeft, ArrowUpRight, Bookmark, Check, Compass, Heart, MessageCircle, MoreHorizontal, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { act, createScenarios, inspectScenario, visibleActivity, type Action, type Role, type Scenario } from '@/lib/obras/simulation';

const labels = { publico: 'Comunidad', profesional: 'Profesional', contratista: 'Contratista', inversor: 'Inversor' };
const states = { pendiente: 'Próximamente', en_curso: 'En obra', presentado: 'En revisión', validado: 'Validado' };
const image = (w: Scenario) => `/images/obras/${w.id}.webp`;
const initials = (name: string) => name.split(' ').map(s => s[0]).slice(0, 2).join('');
const primary = 'rounded-full bg-[#193c32] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40';

export default function Simulation() {
  const [works, setWorks] = useState(createScenarios);
  const [selected, setSelected] = useState<string | null>(null);
  const identity = useFeedIdentity();
  const role: Role | 'publico' = identity.profile ?? 'publico';
  const [pending, setPending] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Para vos');
  const [likes, setLikes] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [agent, setAgent] = useState(false);
  const [tab, setTab] = useState('Actividad');
  const obra = identity.user && identity.profile ? works.find(w => w.id === selected) : undefined;
  const report = obra && inspectScenario(obra);
  const current = obra?.blocks.find(b => b.id === 'actual');
  function toggle(id: string, list: string[], setter: (value: string[]) => void) { setter(list.includes(id) ? list.filter(v => v !== id) : [...list, id]); }
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('obra');
    if (id && /^demo-(?:[1-9]|1[0-5])$/.test(id)) setPending(id);
  }, []);
  useEffect(() => {
    if (pending && identity.ready && identity.user && identity.profile) {
      setSelected(pending); setPending(null); setTab(identity.profile === 'inversor' ? 'Inversión' : 'Trabajos');
    }
  }, [pending, identity.ready, identity.user, identity.profile]);
  function open(id: string | null) {
    setTab('Actividad'); setAgent(false); setText(''); setNotice('');
    if (!id) { setSelected(null); setPending(null); window.history.replaceState(null, '', '/inversores/simulacion'); }
    else {
      window.history.replaceState(null, '', obraReturnPath(id));
      if (identity.ready && identity.user && identity.profile) { setSelected(id); setTab(identity.profile === 'inversor' ? 'Inversión' : 'Trabajos'); }
      else setPending(id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function chooseProfile(profile: Role) {
    setProfileBusy(true); setProfileError('');
    try { await identity.chooseProfile(profile); setChoosing(false); setTab(profile === 'inversor' ? 'Inversión' : 'Trabajos'); }
    catch (error) { setProfileError(error instanceof Error ? error.message : 'No pudimos guardar el perfil.'); }
    finally { setProfileBusy(false); }
  }
  const accountName = String(identity.user?.user_metadata?.full_name || identity.user?.user_metadata?.name || identity.user?.email?.split('@')[0] || 'Mi cuenta');
  const needsLogin = Boolean(pending && identity.ready && !identity.user);
  const needsProfile = Boolean(identity.user && (choosing || (pending && !identity.profile)));
  function dispatch(action: Action) {
    if (!obra) return;
    try {
      if (!identity.user || !identity.profile) { setPending(obra.id); return; }
      const updated = act(obra, role, action);
      updated.activity = updated.activity.map((event, index) => index >= obra.activity.length ? { ...event, author: accountName } : event);
      setWorks(items => items.map(w => w.id === obra.id ? updated : w)); setText(''); setNotice('');
    }
    catch (error) { setNotice(error instanceof Error ? error.message : 'No pudimos guardar el cambio.'); }
  }
  const filtered = works.filter(w => `${w.name} ${w.city} ${w.type} ${role === 'inversor' ? investmentFor(w).ticker : ''}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')) && (filter !== 'Siguiendo' || w.following) && (filter !== 'Guardados' || saved.includes(w.id)));
  return <div className="min-h-screen bg-[#f4f5f1] text-[#20382f]">
    {(needsLogin || needsProfile || (pending && !identity.ready)) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#122a23]/50 p-5 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="access-title" className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
      <button aria-label="Cerrar acceso" onClick={() => { setPending(null); setChoosing(false); setProfileError(''); window.history.replaceState(null, '', selected ? obraReturnPath(selected) : '/inversores/simulacion'); }} className="absolute right-5 top-5 text-[#839075]"><X size={19}/></button>
      <p className="mb-6 text-3xl font-bold tracking-tight">grows.</p>
      {pending && <p className="mb-2 text-sm text-[#839075]">{works.find(w => w.id === pending)?.name}</p>}
      <h2 id="access-title" className="text-2xl font-semibold">{needsLogin ? 'Entrá para ser parte de la obra.' : needsProfile ? '¿Cómo participás en Grows?' : 'Preparando tu acceso…'}</h2>
      {needsLogin && <><p className="mb-6 mt-3 text-sm leading-relaxed text-[#718064]">Iniciá sesión para ver la obra desde tu perfil y conectar con su equipo.</p><a href={'/auth/login?redirect=' + encodeURIComponent(obraReturnPath(pending!))} className={`${primary} block text-center`}>Iniciar sesión</a><button onClick={() => { setPending(null); window.history.replaceState(null, '', '/inversores/simulacion'); }} className="mt-4 w-full text-sm text-[#718064]">Seguir explorando</button></>}
      {needsProfile && <><p className="mb-5 mt-3 text-sm text-[#718064]">Tu perfil prepara la información que ves al entrar a cada obra.</p><div className="space-y-3">{([{id:'profesional',description:'Proyecto, planificación y coordinación.'},{id:'contratista',description:'Trabajos, avances y seguimiento.'},{id:'inversor',description:'Hitos, novedades y evolución de la obra.'}] as const).map(p => <button key={p.id} disabled={profileBusy} onClick={() => void chooseProfile(p.id)} className="w-full rounded-2xl border border-[#dce4d4] p-4 text-left hover:bg-[#f1f5eb] disabled:opacity-50"><strong className="text-sm">{labels[p.id]}</strong><span className="mt-1 block text-xs text-[#839075]">{p.description}</span></button>)}</div>{profileBusy && <p role="status" className="mt-3 text-sm">Guardando tu perfil…</p>}{profileError && <p role="alert" className="mt-3 text-sm text-red-700">{profileError}</p>}</>}
    </section></div>}
    <header className="sticky top-0 z-30 border-b border-[#e1e6dc] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-4 sm:gap-6 lg:px-10">
      <button onClick={() => open(null)} aria-label="Grows, inicio" className="text-[34px] font-bold leading-none tracking-[-2px]">grows<span className="text-[#7e9d64]">.</span></button>
      <div className="hidden max-w-md flex-1 items-center gap-3 rounded-full bg-[#f1f3ee] px-4 py-2.5 md:flex"><Search size={17}/><input aria-label="Buscar obras" value={query} onChange={e => { setQuery(e.target.value); if (selected) open(null); }} placeholder="Obras, personas, lugares..." className="w-full bg-transparent text-sm outline-none"/></div>
      <nav className="ml-auto flex items-center gap-3 sm:gap-5"><button onClick={() => open(null)} aria-label="Explorar obras"><Compass size={22}/></button><Link href="/inversores" className="hidden text-sm text-[#6e7e71] sm:block">Mi espacio</Link><span className="rounded-full bg-[#eef1e7] px-2.5 py-1 text-[10px] uppercase tracking-wider">Obras ficticias</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8e4ca] text-xs font-semibold">{identity.user ? initials(accountName) : <Users size={17}/>}</span></nav>
    </div></header>
    <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 lg:grid-cols-[185px_minmax(0,1fr)_270px] lg:px-10">
      <aside className="hidden lg:block"><div className="sticky top-28 space-y-2">{[{ name: 'Para vos', icon: Compass }, { name: 'Siguiendo', icon: Users }, { name: 'Guardados', icon: Bookmark }].map(({name, icon: Icon}) => <button key={name} onClick={() => {setFilter(name); open(null);}} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm ${filter === name ? 'bg-[#e5ecde] font-semibold' : 'text-[#788475]'}`}><Icon size={19}/>{name}</button>)}<div className="px-4 pt-8"><p className="text-xs uppercase tracking-widest text-[#8b9686]">Tu comunidad</p><p className="mt-4 text-sm leading-relaxed text-[#75816f]">Las ideas se conectan.<br/>Las obras crecen.</p><div className="mt-7 h-px bg-[#dfe5d8]"/><p className="mt-5 text-xs text-[#8b9686]">Grows · Construimos en común</p></div></div></aside>
      <main className="min-w-0">
        {!obra ? <>
          <div className="mb-6 flex gap-5 overflow-x-auto pb-3">{works.map(w => <button key={w.id} onClick={() => open(w.id)} className="w-[72px] shrink-0 text-center"><div className="rounded-full border-2 border-[#9db582] p-[3px]"><img src={image(w)} alt={w.name} className="h-16 w-16 rounded-full object-cover"/></div><span className="mt-2 block truncate text-xs">{w.name}</span></button>)}</div>
          <div className="mb-6 flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[.2em] text-[#84917c]">Lo que estamos construyendo</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Tu comunidad, en obra.</h1></div><span className="text-xs text-[#83907c]">15 obras</span></div>
          <div className="mb-5 flex gap-2 lg:hidden">{['Para vos','Siguiendo','Guardados'].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm ${filter === f ? 'bg-[#193c32] text-white' : 'bg-white'}`}>{f}</button>)}</div>
          <div className="space-y-7">{filtered.map((w, i) => <article key={w.id} className="overflow-hidden rounded-2xl border border-[#e0e5dc] bg-white">
            <div className="flex items-center gap-3 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8edde] text-xs font-semibold">{initials(w.professional)}</span><button onClick={() => open(w.id)} className="text-left"><p className="text-sm font-semibold">{w.professional} <span className="font-normal text-[#86917f]">en</span> {w.name}</p><p className="mt-0.5 text-xs text-[#8a9583]">{w.city} · Hace {i + 1} h</p></button><button aria-label={`Abrir ${w.name}`} onClick={() => open(w.id)} className="ml-auto"><MoreHorizontal size={20}/></button></div>
            <p className="px-5 pb-4 text-sm leading-relaxed">{w.situation} <span className="text-[#6e8a58]">#{w.type.replaceAll(' ', '')} #EnObra</span></p>
            {role === 'inversor' && <InvestmentTeaser obra={w}/>}
            <button onClick={() => open(w.id)} className="relative block w-full text-left"><img src={image(w)} alt={`Obra ${w.name} en ${w.city}`} loading={i ? 'lazy' : 'eager'} className="aspect-[4/3] w-full object-cover"/><span className="absolute bottom-5 left-5 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold shadow-sm">{w.name} ↗</span></button>
            <div className="p-5"><div className="flex items-center gap-5"><button aria-label={`Me gusta ${w.name}`} aria-pressed={likes.includes(w.id)} onClick={() => toggle(w.id, likes, setLikes)}><Heart size={23} fill={likes.includes(w.id) ? '#ab6256' : 'none'} className={likes.includes(w.id) ? 'text-[#ab6256]' : ''}/></button><button aria-label={`Comentar en ${w.name}`} onClick={() => open(w.id)}><MessageCircle size={23}/></button><button aria-label={`Ver ${w.name}`} onClick={() => open(w.id)}><ArrowUpRight size={23}/></button><button className="ml-auto" aria-label={`Guardar ${w.name}`} aria-pressed={saved.includes(w.id)} onClick={() => toggle(w.id, saved, setSaved)}><Bookmark size={22} fill={saved.includes(w.id) ? '#20382f' : 'none'}/></button></div><p className="mt-3 text-xs font-semibold">{28 + i * 7 + Number(likes.includes(w.id))} personas acompañan esta obra</p><button onClick={() => open(w.id)} className="mt-3 text-sm text-[#89937f]">Ver la conversación · {visibleActivity(w, 'publico').length} novedades</button>{visibleActivity(w, 'publico').slice(-1).map(e => <p key={e.id} className="mt-2 text-sm"><strong>{e.author}</strong> <span className="text-[#66745e]">{e.text}</span></p>)}</div>
          </article>)}</div>{!filtered.length && <p className="rounded-2xl bg-white p-8 text-sm text-[#718064]">Todavía no hay obras aquí.</p>}
        </> : <>
          <button onClick={() => open(null)} className="mb-5 flex items-center gap-2 text-sm text-[#718064]"><ArrowLeft size={16}/> Volver</button>
          <section className="overflow-hidden rounded-2xl border border-[#e0e5dc] bg-white"><img src={image(obra)} alt={obra.name} className="aspect-[16/10] w-full object-cover"/><div className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#829075]">{obra.city} · {obra.type}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{obra.name}</h1></div><button onClick={() => dispatch({type:'follow'})} className={primary}>{obra.following ? 'Siguiendo ✓' : 'Seguir'}</button></div><p className="mt-4 text-sm leading-relaxed text-[#6b7c62]">{obra.situation}</p><div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8edde]"><div className="h-full bg-[#87a56b]" style={{width:`${report!.progress}%`}}/></div><span className="text-xs text-[#7c8b70]">{report!.progress}% de hitos validados</span></div></div></section>
          <div className="my-5 flex items-center justify-between gap-3"><div><p className="text-xs text-[#829075]">{accountName} · {labels[role]}</p><h2 className="mt-1 text-lg font-semibold">{role === 'profesional' ? 'Tu espacio de coordinación' : role === 'contratista' ? 'Tu trabajo en esta obra' : 'La evolución de tu obra'}</h2></div><button onClick={() => setChoosing(true)} className="text-xs text-[#718064] underline">Mi perfil</button></div>
          <div className="mb-5 flex overflow-x-auto border-b border-[#dce3d5]">{(role === 'inversor' ? ['Inversión','Paquetes','Actividad','Trabajos','Personas'] : ['Actividad','Paquetes','Trabajos','Personas']).map(t => <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm ${tab === t ? 'border-b-2 border-[#193c32] font-semibold' : 'text-[#839075]'}`}>{t}</button>)}</div>
          {notice && <p role="status" className="mb-4 rounded-xl bg-[#eee8dc] p-3 text-sm">{notice}</p>}
          {tab === 'Inversión' && role === 'inversor' && <InvestorView key={obra.id} obra={obra} works={works} onOpen={open} />}
          {tab === 'Paquetes' && <UnitPackages key={obra.id} obra={obra} onConsult={message => { setText(message); setTab('Actividad'); }} />}
          {tab === 'Actividad' && <section className="space-y-4">{visibleActivity(obra, role).map(e => <article key={e.id} className="rounded-2xl border border-[#e0e5dc] bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9edde] text-xs font-semibold">{initials(e.author)}</span><div><p className="text-sm font-semibold">{e.author}</p><p className="text-[11px] text-[#8a957e]">{labels[e.role]}{e.visibility === 'equipo' ? ' · Equipo de obra' : ''}</p></div></div><p className="mt-4 text-sm leading-relaxed">{e.text}</p></article>)}<div className="rounded-2xl bg-white p-4"><label className="sr-only" htmlFor="comment">Escribir un comentario</label><textarea id="comment" value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="Sumate a la conversación..." className="w-full resize-none bg-transparent p-2 text-sm outline-none"/><div className="flex justify-end"><button disabled={!text.trim()} aria-label="Publicar comentario" onClick={() => dispatch({type:'comment',text})} className={primary}><Send size={16}/></button></div></div></section>}
          {tab === 'Trabajos' && <section className="space-y-4">{obra.blocks.filter(b => role === 'profesional' || role === 'contratista' || b.id !== 'propuesta').map(b => <article key={b.id} className="rounded-2xl border border-[#e0e5dc] bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">{b.title}</h2>{b.state === 'validado' && <Check size={19} className="text-[#7e9d64]"/>}</div><p className="mt-2 text-xs text-[#859277]">{states[b.state]}</p>{(role === 'contratista' || role === 'profesional') && b.evidence && <p className="mt-4 text-sm text-[#6f7d65]">{b.evidence}</p>}</article>)}{role === 'contratista' && current?.state === 'en_curso' && <div className="rounded-2xl bg-white p-5"><textarea aria-label="Evidencia del trabajo" value={text} onChange={e => setText(e.target.value)} placeholder="Contá el avance y la evidencia del trabajo..." className="mb-3 w-full rounded-xl border p-3 text-sm"/><button disabled={!text.trim()} onClick={() => dispatch({type:'evidence',text})} className={primary}>Presentar avance</button></div>}{role === 'profesional' && current?.state === 'presentado' && <button onClick={() => dispatch({type:'validate'})} className={primary}>Validar avance</button>}</section>}
          {tab === 'Personas' && <section className="space-y-3">{[{name:obra.professional,role:'Profesional'},{name:obra.contractor,role:'Contratista'},{name:obra.investor,role:'Inversor'}].map(p => <article key={p.role} className="flex items-center gap-4 rounded-2xl bg-white p-5"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e4ebda] text-sm">{initials(p.name)}</span><div><h2 className="font-semibold">{p.name}</h2><p className="text-xs text-[#829075]">{p.role}</p></div></article>)}</section>}
          <button onClick={() => setAgent(!agent)} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#193c32] px-5 py-4 text-sm text-white shadow-xl"><Sparkles size={18}/> Preguntale a Grows</button>
          {agent && <section className="fixed bottom-24 right-5 z-40 w-[calc(100%-40px)] max-w-sm rounded-2xl border border-[#dce4d4] bg-white p-6 shadow-2xl"><div className="mb-4 flex justify-between"><h2 className="font-semibold">Grows · {obra.name}</h2><button onClick={() => setAgent(false)} aria-label="Cerrar agente"><X size={18}/></button></div><p className="text-sm leading-relaxed">Hay {report!.pendingReview.length} trabajos esperando revisión y {report!.blocked.length} con dependencias pendientes. El {report!.progress}% de los hitos está validado.</p><p className="mt-4 text-xs text-[#839075]">Calculado desde los bloques de esta obra.</p>{role === 'profesional' && <div className="mt-4 border-t pt-4"><button onClick={() => dispatch({type:'propose'})} className="text-sm underline">Preparar próxima inspección</button>{obra.proposal && <div className="mt-3"><p className="mb-3 text-sm">{obra.proposal}</p><button onClick={() => dispatch({type:'accept'})} className={primary}>Agregar tarea</button><p className="mt-2 text-[10px] text-[#839075]">Propuesta de ejemplo · Sin LLM conectado</p></div>}</div>}</section>}
        </>}
      </main>
      <aside className="hidden xl:block"><div className="sticky top-28"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce7ce] font-semibold">{identity.user ? initials(accountName) : <Users size={17}/>}</span><div><p className="text-sm font-semibold">Tu próxima conexión</p><p className="text-xs text-[#839075]">Empieza con una obra.</p></div></div><div className="mt-8 flex items-center justify-between"><h2 className="text-sm font-semibold">Obras para descubrir</h2><Compass size={16} className="text-[#8b977f]"/></div><div className="mt-4 space-y-5">{works.filter(w => w.id !== selected).slice(3,8).map(w => <button key={w.id} onClick={() => open(w.id)} className="flex w-full items-center gap-3 text-left"><img src={image(w)} alt="" className="h-12 w-12 rounded-xl object-cover"/><div className="min-w-0"><p className="truncate text-sm font-semibold">{w.name}</p><p className="mt-1 text-xs text-[#8b977f]">{w.city}</p></div><ArrowUpRight size={16} className="ml-auto shrink-0"/></button>)}</div><div className="mt-8 border-t border-[#dce3d5] pt-5 text-[11px] leading-relaxed text-[#94a08a]">Una comunidad alrededor de cada obra.<br/>Grows © 2026</div></div></aside>
    </div>
  </div>;
}
