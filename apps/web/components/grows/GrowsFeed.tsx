'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Compass, HardHat, Search, TrendingUp } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import type { PublicObra } from '@/lib/obras/publication';

const views = [
  { id: 'contratista', label: 'Contratista', icon: HardHat },
  { id: 'arquitecto', label: 'Arquitecto', icon: Building2 },
  { id: 'inversor', label: 'Inversor', icon: TrendingUp },
] as const;
type View = typeof views[number]['id'];
type Tab = 'actividad' | 'hitos' | View;

const panel = 'overflow-hidden rounded-2xl border border-[#e0e5dc] bg-white';
const primary = 'inline-flex items-center gap-2 rounded-full bg-[#193c32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#274d40]';
const statusLabels = { validado: 'Validado', en_curso: 'En curso', pendiente: 'Pendiente' };

function workLink(id: string, view: View): Route {
  return `/inversores?obra=${id}&vista=${view}` as Route;
}

function access(sector: 'trabajo' | 'proyecto', id?: string): Route {
  return ('/acceder?sector=' + sector + (id ? '&obra=' + id : '')) as Route;
}

function WorkAvatar({ work, large = false }: { work: PublicObra; large?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#e5ecde] ${large ? 'h-14 w-14' : 'h-10 w-10'}`}>
      {work.coverUrl
        ? <img src={work.coverUrl} alt="" className="h-full w-full object-cover" />
        : <Building2 size={large ? 24 : 19} aria-hidden="true" />}
    </span>
  );
}

function WorkProgress({ work, prominent = false }: { work: PublicObra; prominent?: boolean }) {
  return (
    <div>
      {prominent && <p className="mb-2 text-xs font-medium text-[#53695d]">Avance de obra</p>}
      <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
        <span>{work.stage || (prominent ? 'Avance publicado' : 'Avance de obra')}</span>
        <strong className={prominent ? 'text-4xl font-semibold tracking-tight' : undefined}>{work.progress}%</strong>
      </div>
      <progress value={work.progress} max={100} aria-label={'Avance de ' + work.title} className="mt-2 block h-2 w-full overflow-hidden rounded-full accent-[#6e8a58]" />
    </div>
  );
}

function PublishedDate({ work }: { work: PublicObra }) {
  const date = work.publishedAt && new Date(work.publishedAt);
  if (!date || !Number.isFinite(date.getTime())) return null;
  return <time dateTime={date.toISOString()}>{date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</time>;
}

export default function GrowsFeed({ projects, unavailable }: { projects: PublicObra[]; unavailable: boolean }) {
  const params = useSearchParams();
  const requestedView = views.find(({ id }) => id === params.get('vista'))?.id;
  const requestedWork = params.get('obra');
  const [preference, setPreference] = useState<View>('contratista');
  const [override, setOverride] = useState<{ url: string; view: View }>();
  const [query, setQuery] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [selection, setSelection] = useState<{ id: string; view: View; tab: Tab }>();
  const url = params.toString();
  const view = override?.url === url ? override.view : requestedView || preference;
  const project = projects.find((item) => item.id === requestedWork);
  const tab = selection && selection.id === project?.id && selection.view === view ? selection.tab : 'actividad';
  const role = views.find(({ id }) => id === view)!;

  useEffect(() => {
    const saved = views.find(({ id }) => id === localStorage.getItem('grows.feed.view'));
    if (saved) setPreference(saved.id);
  }, []);

  useEffect(() => {
    const auth = getBrowserSupabaseClient();
    let active = true;
    void auth.auth.getUser().then(({ data }) => { if (active) setSignedIn(Boolean(data.user)); });
    const { data } = auth.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  function chooseView(value: View) {
    if (value !== view) setSelection(undefined);
    setPreference(value);
    setOverride({ url, view: value });
    localStorage.setItem('grows.feed.view', value);
  }

  const feedLink = `/inversores?vista=${view}` as Route;
  const login = ('/auth/login?redirect=' + encodeURIComponent(project ? workLink(project.id, view) : feedLink)) as Route;
  const workspace = access(view === 'contratista' ? 'trabajo' : 'proyecto', project?.id);
  const filtered = projects.filter((item) => (item.title + ' ' + item.location + ' ' + item.summary).toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  const tabs: { id: Tab; label: string }[] = [{ id: 'actividad', label: 'Actividad' }, { id: 'hitos', label: 'Hitos' }, { id: view, label: view === 'inversor' ? 'Inversión' : view === 'contratista' ? 'Trabajos' : 'Proyecto' }];

  return (
    <div className="min-h-screen bg-[#f4f5f1] text-[#20382f]">
      <header className="sticky top-0 z-20 border-b border-[#e1e6dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-5 py-4 sm:gap-6 lg:px-10">
          <Link href={feedLink} className="text-[34px] font-bold leading-none tracking-[-2px]">grows<span className="text-[#6e8a58]">.</span></Link>
          {!project && <label className="hidden max-w-md flex-1 items-center gap-3 rounded-full bg-[#f1f3ee] px-4 py-2.5 md:flex">
            <Search size={17} aria-hidden="true" /><input aria-label="Buscar obras" placeholder="Obras, lugares…" className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>}
          <nav aria-label="Cuenta" className="ml-auto flex items-center gap-5">
            <Link href={feedLink} aria-label="Explorar obras"><Compass size={22} /></Link>
            {signedIn && view === 'inversor'
              ? <span className="rounded-full bg-[#e5ecde] px-4 py-2.5 text-sm">Sesión iniciada</span>
              : <Link href={signedIn ? workspace : login} prefetch={false} className={primary}>{signedIn ? 'Mi espacio' : 'Ingresar'}</Link>}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-x-8 px-5 py-7 md:grid-cols-[170px_minmax(0,1fr)] lg:grid-cols-[185px_minmax(0,1fr)_250px] lg:px-10">
        <aside className="mb-5 md:mb-0">
          <div className="space-y-3 md:sticky md:top-28">
            <Link href={feedLink} className="hidden items-center gap-3 rounded-xl bg-[#e5ecde] px-4 py-3 text-sm font-semibold md:flex"><Compass size={19} /> Para vos</Link>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-[#53695d] md:px-4">Ver como</legend>
              <div className="flex flex-wrap gap-1 md:block md:space-y-1">
                {views.map(({ id, label, icon: Icon }) => (
                  <button type="button" key={id} onClick={() => chooseView(id)} aria-pressed={view === id} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm md:w-full md:px-4 ${view === id ? 'bg-[#193c32] text-white' : 'hover:bg-[#e5ecde]'}`}>
                    <Icon size={16} aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </aside>

        <main id="feed" className="min-w-0">
          {project ? (
            <>
              <Link href={feedLink} className="mb-5 inline-flex items-center gap-2 text-sm text-[#53695d]"><ArrowLeft size={16} /> Volver al feed</Link>
              <section className={panel}>
                {project.coverUrl && <img src={project.coverUrl} alt={project.title} className="aspect-[16/10] w-full object-cover" />}
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <WorkAvatar work={project} />
                    <div>
                      {project.location && <p className="text-xs text-[#53695d]">{project.location}</p>}
                      <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
                    </div>
                  </div>
                  <WorkProgress work={project} />
                </div>
              </section>
              <nav aria-label="Información de la obra" className="my-5 flex gap-2 overflow-x-auto border-b border-[#dce3d5]">
                {tabs.map(({ id, label }) => (
                  <button type="button" key={id} aria-pressed={tab === id} onClick={() => setSelection({ id: project.id, view, tab: id })} className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === id ? 'border-[#193c32] font-semibold' : 'border-transparent text-[#53695d]'}`}>{label}</button>
                ))}
              </nav>
              {tab === 'actividad' && <section className={`${panel} p-5 sm:p-6`}>
                <h2 className="font-semibold">Publicación de la obra</h2>
                <p className="mt-1 text-xs text-[#53695d]"><PublishedDate work={project} /></p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#394f43]">{project.summary || 'Todavía no hay novedades publicadas.'}</p>
              </section>}
              {tab === 'hitos' && <section className={`${panel} p-5 sm:p-6`}>
                <h2 className="font-semibold">Hitos de obra</h2>
                {project.milestones.length ? <ul className="mt-2 divide-y divide-[#e0e5dc]">
                  {project.milestones.map((milestone, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{milestone.title}</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${milestone.status === 'pendiente' ? 'bg-[#f1f3ee]' : 'bg-[#e5ecde]'}`}>{statusLabels[milestone.status]}</span></li>)}
                </ul> : <p className="mt-3 text-sm text-[#53695d]">Todavía no hay hitos publicados.</p>}
              </section>}
              {tab === view && <section className={`${panel} space-y-4 p-5 sm:p-6`}>
                <h2 className="text-lg font-semibold">{view === 'contratista' ? 'Trabajar en esta obra' : view === 'arquitecto' ? 'Coordinar esta obra' : 'Inversión en esta obra'}</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#394f43]">{view === 'contratista' ? project.contractorNotes || 'Todavía no hay información de contratación publicada.' : view === 'inversor' ? project.investorNotes || 'Todavía no hay información de inversión publicada.' : 'Accedé al plan, las tareas y los presupuestos con los permisos de tu equipo.'}</p>
                {view !== 'inversor' && <Link href={workspace} className={primary}>{view === 'contratista' ? 'Ver oportunidades de esta obra' : 'Abrir espacio de obra'}<ArrowRight size={16} /></Link>}
              </section>}
            </>
          ) : (
            <>
              {projects.length > 0 && <nav aria-label="Obras publicadas" className="mb-5 flex gap-4 overflow-x-auto pb-2">
                {projects.map((work) => <Link key={work.id} href={workLink(work.id, view)} title={work.title} className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center text-xs">
                  <span className="rounded-full border-2 border-[#9db582] p-[3px] group-hover:border-[#193c32]"><WorkAvatar work={work} large /></span>
                  <span className="w-full truncate">{work.title}</span>
                </Link>)}
              </nav>}
              <h1 className="mb-5 text-2xl font-semibold tracking-tight">Tu comunidad, en obra.</h1>
              {requestedWork && <p role="status" className="mb-4 text-sm">Esta obra no tiene una publicación disponible.</p>}
              <label className="mb-5 flex items-center gap-3 rounded-full border border-[#e0e5dc] bg-white px-4 py-2.5 md:hidden">
                <Search size={17} aria-hidden="true" /><input aria-label="Buscar obras" placeholder="Obras, lugares…" className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className="space-y-6">
                {filtered.map((work) => (
                  <article key={work.id} className={panel}>
                    <div className="flex items-center gap-3 px-5 py-4">
                      <Link href={workLink(work.id, view)} tabIndex={-1} aria-hidden="true"><WorkAvatar work={work} /></Link>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold"><Link href={workLink(work.id, view)} className="hover:underline">{work.title}</Link></h2>
                        <p className="text-xs text-[#53695d]">{work.location}{work.location && work.publishedAt ? ' · ' : ''}<PublishedDate work={work} /></p>
                      </div>
                    </div>
                    {work.summary && <p className="line-clamp-4 whitespace-pre-wrap px-5 pb-4 text-sm leading-relaxed text-[#394f43]">{work.summary}</p>}
                    {work.coverUrl && <Link href={workLink(work.id, view)} aria-label={'Ver ' + work.title} className="block">
                      <img src={work.coverUrl} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    </Link>}
                    <div className={`px-5 py-5 ${work.coverUrl ? 'bg-white' : 'bg-gradient-to-br from-[#e5ecde] to-[#f0f3eb] sm:px-7 sm:py-8'}`}><WorkProgress work={work} prominent={!work.coverUrl} /></div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                      <span className="text-[#53695d]">{work.milestones.length ? `${work.milestones.length} ${work.milestones.length === 1 ? 'hito publicado' : 'hitos publicados'}` : 'Seguimiento de obra'}</span>
                      <Link href={workLink(work.id, view)} className="inline-flex items-center gap-1 font-semibold hover:underline" aria-label={'Ver actividad de ' + work.title}>Ver actividad <ArrowUpRight size={17} /></Link>
                    </div>
                  </article>
                ))}
              </div>
              {!filtered.length && <section role="status" className={`${panel} p-8 text-center`}>
                <h2 className="font-semibold">{unavailable ? 'No pudimos cargar las obras' : query.trim() ? 'No encontramos obras con esa búsqueda' : 'Todavía no hay obras publicadas'}</h2>
                {unavailable && <p className="mt-2 text-sm text-[#53695d]">Volvé a cargar la página para reintentar.</p>}
              </section>}
            </>
          )}
        </main>

        <aside className="mt-6 md:col-start-2 lg:col-start-3 lg:row-start-1 lg:mt-0">
          <div className="space-y-4 lg:sticky lg:top-28">
            {view !== 'inversor' && <section className={`${panel} space-y-3 p-4`}>
              <h2 className="flex items-center gap-2 text-sm font-semibold"><role.icon size={17} aria-hidden="true" /> Espacio de {role.label.toLocaleLowerCase('es')}</h2>
              <Link href={workspace} className="flex items-center justify-between gap-2 text-sm text-[#394f43] hover:underline">{view === 'contratista' ? 'Mi trabajo' : 'Mis proyectos'}<ArrowUpRight size={16} /></Link>
              {view === 'arquitecto' && <Link href="/acceder?sector=proyecto&redirect=%2Fcliente%2Fproyectos%2Fnuevo" className="flex items-center justify-between gap-2 text-sm text-[#394f43] hover:underline">Crear un proyecto<ArrowUpRight size={16} /></Link>}
            </section>}
            {project && projects.some((work) => work.id !== project.id) && <section className={`${panel} space-y-3 p-4`}>
              <h2 className="text-sm font-semibold">Más obras</h2>
              {projects.filter((work) => work.id !== project.id).slice(0, 5).map((work) => <Link key={work.id} href={workLink(work.id, view)} className="flex items-center gap-2 text-sm hover:underline"><WorkAvatar work={work} /><span className="truncate">{work.title}</span></Link>)}
            </section>}
            <Link href="/inversores/simulacion" className="block px-1 text-sm text-[#53695d] hover:underline">Explorar la simulación <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
