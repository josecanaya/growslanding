'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, BriefcaseBusiness, Compass, FolderPlus, HardHat, Search, TrendingUp } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import type { PublicObra } from '@/lib/obras/publication';

const views = [
  { id: 'contratista', label: 'Contratista', icon: HardHat },
  { id: 'arquitecto', label: 'Arquitecto', icon: Building2 },
  { id: 'inversor', label: 'Inversor', icon: TrendingUp },
] as const;
type View = typeof views[number]['id'];

export default function GrowsFeed({ projects, unavailable }: { projects: PublicObra[]; unavailable: boolean }) {
  const params = useSearchParams();
  const [view, setView] = useState<View>('contratista');
  const [query, setQuery] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const project = projects.find((item) => item.id === params.get('obra'));
  useEffect(() => {
    const requested = params.get('vista');
    const saved = localStorage.getItem('grows.feed.view');
    const candidate = requested || saved;
    if (views.some((item) => item.id === candidate)) setView(candidate as View);
  }, [params]);
  useEffect(() => {
    const auth = getBrowserSupabaseClient();
    let active = true;
    void auth.auth.getUser().then(({ data }) => { if (active) setSignedIn(Boolean(data.user)); });
    const { data } = auth.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  function chooseView(value: View) {
    setView(value);
    localStorage.setItem('grows.feed.view', value);
  }

  const access = (sector: 'trabajo' | 'proyecto', id?: string) =>
    ('/acceder?sector=' + sector + (id ? '&obra=' + id : '')) as Route;
  const login = ('/auth/login?redirect=' + encodeURIComponent('/inversores' + (project ? '?obra=' + project.id + '&vista=' + view : ''))) as Route;
  const filtered = projects.filter((item) => (item.title + ' ' + item.location + ' ' + item.summary).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#19362d]">
      <header className="sticky top-0 z-20 border-b border-[#e1e7df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-4">
          <Link href="/inversores" className="text-3xl font-bold tracking-tight">Grows<span className="text-[#38826b]">.</span></Link>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-[#708175] md:block">Construimos en común</span>
          <nav className="ml-auto flex items-center gap-3 text-sm font-semibold">
            <Link href={access('trabajo')} className="hidden hover:underline sm:block">Mi trabajo</Link>
            <Link href={access('proyecto')} className="hidden hover:underline sm:block">Mis proyectos</Link>
            <Link href={signedIn ? access(view === 'contratista' ? 'trabajo' : 'proyecto') : login} prefetch={false} className="rounded-xl bg-[#19362d] px-5 py-2.5 text-white">
              {signedIn ? 'Mi espacio' : 'Ingresar'}
            </Link>
          </nav>
        </div>
      </header>
      <main id="feed" className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Link href="/inversores" className="flex items-center gap-3 rounded-xl bg-[#e9f0e6] px-4 py-3 font-semibold"><Compass size={19} /> Descubrir obras</Link>
          <div className="space-y-2">
            <p className="px-4 text-xs font-semibold uppercase tracking-widest text-[#718274]">Mi mirada</p>
            {views.map(({ id, label, icon: Icon }) => (
              <button type="button" key={id} onClick={() => chooseView(id)} aria-pressed={view === id} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${view === id ? 'bg-[#19362d] text-white' : 'hover:bg-[#e9f0e6]'}`}>
                <Icon size={19} />{label}
              </button>
            ))}
          </div>
          <p className="px-4 text-sm leading-relaxed text-[#718274]">Una obra compartida. Cada persona encuentra la información y las acciones de su trabajo.</p>
        </aside>
        <div className="min-w-0 space-y-7">
          {project ? (
            <>
              <Link href="/inversores" className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Todas las obras</Link>
              <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white">
                {project.coverUrl && <img src={project.coverUrl} alt={project.title} className="h-72 w-full object-cover" />}
                <div className="space-y-5 p-6 sm:p-8">
                  <span className="text-xs uppercase tracking-widest text-[#718274]">{project.location || 'Proyecto publicado'}</span>
                  <h1 className="text-3xl font-semibold sm:text-4xl">{project.title}</h1>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#53695d]">{project.summary}</p>
                  <div className="flex justify-between text-sm"><span>{project.stage || 'Avance publicado'}</span><strong>{project.progress}%</strong></div>
                  <progress value={project.progress} max={100} aria-label="Avance publicado" className="h-2 w-full accent-[#38826b]" />
                  <p className="text-xs text-[#718274]">{project.publishedAt ? 'Actualizado ' + new Date(project.publishedAt).toLocaleDateString('es-AR') : 'Información publicada por el responsable'}</p>
                </div>
              </section>
              <section className="space-y-4 rounded-2xl border border-[#dfe6df] bg-white p-6">
                <h2 className="text-xl font-semibold">{view === 'contratista' ? 'Trabajar en esta obra' : view === 'arquitecto' ? 'Organizar esta obra con agentes' : 'Seguir el proyecto'}</h2>
                <p className="whitespace-pre-wrap text-[#53695d]">{view === 'contratista' ? project.contractorNotes || 'El responsable todavía no publicó información de contratación.' : view === 'inversor' ? project.investorNotes || 'El responsable todavía no publicó información de inversión.' : 'Accedé al plan, las tareas, los presupuestos y las propuestas de agentes con los permisos de tu equipo.'}</p>
                {view !== 'inversor' && <Link href={access(view === 'contratista' ? 'trabajo' : 'proyecto', project.id)} className="inline-flex items-center gap-2 rounded-xl bg-[#19362d] px-5 py-3 text-white">
                  {view === 'contratista' ? 'Ver oportunidades de esta obra' : 'Abrir espacio de obra'}<ArrowRight size={16} />
                </Link>}
                <div className="divide-y divide-[#e1e7df]">
                  {project.milestones.map((milestone, index) => <div key={index} className="flex justify-between gap-4 py-3 text-sm"><span>{milestone.title}</span><span>{milestone.status === 'validado' ? 'Validado' : milestone.status === 'en_curso' ? 'En curso' : 'Pendiente'}</span></div>)}
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718274]">Grows para todos</p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Obras que conectan personas.</h1>
                <p className="text-[#718274]">Explorá proyectos, encontrá trabajo y seguí lo que se está construyendo.</p>
                {params.get('obra') && <p role="status">Esta obra no tiene una publicación disponible.</p>}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#dfe6df] bg-white px-4 py-3">
                <Search size={19} /><input aria-label="Buscar obras" placeholder="Buscar proyecto o localidad" className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {filtered.map((item) => (
                  <Link key={item.id} href={('/inversores?obra=' + item.id + '&vista=' + view) as Route} className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white transition hover:border-[#38826b] hover:shadow-md">
                    {item.coverUrl ? <img src={item.coverUrl} alt={item.title} loading="lazy" className="h-52 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-[#e9f0e6]"><Building2 size={48} className="text-[#7e9b74]" /></div>}
                    <div className="space-y-3 p-5">
                      <p className="text-xs text-[#718274]">{item.location || 'Proyecto publicado'}</p>
                      <h2 className="text-xl font-semibold">{item.title}</h2>
                      <p className="line-clamp-2 text-sm text-[#53695d]">{item.summary}</p>
                      <div className="flex justify-between text-sm"><span>{item.stage || 'Avance publicado'}</span><strong>{item.progress}%</strong></div>
                      <progress aria-label={'Avance de ' + item.title} value={item.progress} max={100} className="h-2 w-full accent-[#38826b]" />
                    </div>
                  </Link>
                ))}
              </div>
              {!filtered.length && <section role="status" className="rounded-2xl border border-dashed border-[#becbbb] bg-white p-8 text-center">
                <h2 className="text-lg font-semibold">{unavailable ? 'No pudimos cargar las obras' : query ? 'No encontramos obras con esa búsqueda' : 'Las próximas obras empiezan acá'}</h2>
                <p className="mt-2 text-sm text-[#718274]">{unavailable ? 'Volvé a cargar la página para reintentar.' : 'Los responsables publican aquí el avance y las oportunidades de sus proyectos.'}</p>
              </section>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href={access('trabajo')} className="flex items-center gap-4 rounded-2xl bg-[#e9f0e6] p-5"><BriefcaseBusiness /><div><strong>Buscar trabajo</strong><p className="text-sm text-[#53695d]">Presupuestá y seguí tus tareas.</p></div><ArrowRight className="ml-auto" /></Link>
                <Link href="/acceder?sector=proyecto&redirect=%2Fcliente%2Fproyectos%2Fnuevo" className="flex items-center gap-4 rounded-2xl bg-[#19362d] p-5 text-white"><FolderPlus /><div><strong>Crear un proyecto</strong><p className="text-sm text-[#c7d8c2]">Dale una obra a tu próximo objetivo.</p></div><ArrowRight className="ml-auto" /></Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
