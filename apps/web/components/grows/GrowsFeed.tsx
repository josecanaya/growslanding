'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bookmark, Briefcase, Building2, CheckCircle2, Compass, HardHat, Home, MapPin,
  Search, Share2, TrendingUp, UserRound,
} from 'lucide-react';
import InvestmentRun, { roundLabel } from './InvestmentRun';
import type { accountRole } from '@/lib/obras/feed-profile';
import type { PublicObra } from '@/lib/obras/publication';

type AccountRole = NonNullable<ReturnType<typeof accountRole>>;

const profiles = {
  contratista: { label: 'Contratista', icon: HardHat, href: '/socio/panel' },
  profesional: { label: 'Proyectista', icon: Building2, href: '/cliente/dashboard' },
  inversor: { label: 'Inversor', icon: TrendingUp, href: null },
  admin: { label: 'Administrador', icon: Building2, href: '/cliente/dashboard' },
} as const;

const ink = 'text-[#1d3329]';
const muted = 'text-[#5a6b61]';
const card = 'overflow-hidden rounded-[20px] border border-[#e3e8df] bg-white';
const chip = 'inline-flex min-h-11 items-center rounded-full px-4 text-sm';
const statuses = { validado: 'Validado', en_curso: 'En curso', pendiente: 'Pendiente' };
const alvearId = '569e1eda-3fcb-453a-b394-d8a1a536648e';
const mcu = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

type Filter = 'todo' | 'rondas' | 'avances';
const filters: { id: Filter; label: string }[] = [
  { id: 'todo', label: 'Para vos' },
  { id: 'rondas', label: 'Rondas abiertas' },
  { id: 'avances', label: 'Avances de obra' },
];

function workLink(id: string, hash = ''): Route {
  return `/inversores?obra=${id}${hash}` as Route;
}

function coverFor(work: PublicObra) {
  if (work.coverUrl) return { src: work.coverUrl, render: false };
  return work.id === alvearId ? { src: '/images/obras/pasaje-alvear.webp', render: true } : null;
}

function currentRound(work: PublicObra) {
  const rounds = work.simulation?.rondas ?? [];
  if (!rounds.length) return null;
  const index = rounds.findIndex((round) => round.estado === 'abierta');
  const at = index >= 0 ? index : rounds.length - 1;
  return { number: at + 1, ...rounds[at] };
}

function WorkAvatar({ work, size = 'size-11', rounded = 'rounded-full' }: { work: PublicObra; size?: string; rounded?: string }) {
  const cover = coverFor(work);
  return <span className={`grid ${size} ${rounded} shrink-0 place-items-center overflow-hidden bg-[#e6eedf] text-[#36503e]`}>
    {cover ? <img src={cover.src} alt="" className="size-full object-cover" /> : <Building2 size={19} aria-hidden="true" />}
  </span>;
}

function PublishedDate({ work }: { work: PublicObra }) {
  const date = work.publishedAt && new Date(work.publishedAt);
  if (!date || !Number.isFinite(date.getTime())) return null;
  return <time dateTime={date.toISOString()}>{date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })}</time>;
}

function ProgressBar({ work, compact = false }: { work: PublicObra; compact?: boolean }) {
  return (
    <div role="progressbar" aria-label={'Avance de ' + work.title} aria-valuenow={work.progress} aria-valuemin={0} aria-valuemax={100} className={`${compact ? 'mt-1.5 h-1.5' : 'mt-2 h-1.5'} overflow-hidden rounded-full bg-[#e3eadd]`}>
      <div className="h-full rounded-full bg-[#4f6b3f]" style={{ width: work.progress + '%' }} />
    </div>
  );
}

function ShareButton({ work, label = true }: { work: PublicObra; label?: boolean }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = `${window.location.origin}/inversores?obra=${work.id}`;
    try {
      if (navigator.share) await navigator.share({ title: work.title, url });
      else { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); }
    } catch { /* el usuario canceló */ }
  }
  return (
    <button type="button" onClick={share} aria-label={label ? undefined : 'Compartir ' + work.title}
      className={label ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm text-[#3c5047] hover:bg-[#f4f5f0]' : 'grid size-11 place-items-center rounded-full border border-[#d5dccf] bg-white hover:bg-[#f4f5f0]'}>
      <Share2 size={label ? 19 : 17} aria-hidden="true" />{label && (done ? 'Link copiado' : 'Compartir')}
    </button>
  );
}

/* ---------- Posteos del feed ---------- */

function RoundStrip({ work }: { work: PublicObra }) {
  const round = currentRound(work);
  if (!round) return null;
  return (
    <div className="mx-4 mt-4 flex flex-wrap items-center gap-3.5 rounded-2xl border border-[#e3e8df] bg-[#fbfbf8] p-3.5 sm:mx-5">
      <span className="grid size-10 place-items-center rounded-xl bg-[#fbf3d0] text-[#6b5000]"><TrendingUp size={19} aria-hidden="true" /></span>
      <div className="min-w-0 flex-[1_1_200px]">
        <p className="font-semibold">Ronda {round.number} · {roundLabel(round.estado).toLocaleLowerCase('es')}</p>
        <p className={`mt-0.5 text-[13px] ${muted}`}>{mcu.format(round.mcu_integradas)} MCU integradas · operaciones ficticias</p>
      </div>
      <Link href={workLink(work.id, '#inversion')} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#e8c547] px-4 text-sm font-semibold text-[#1d3329] hover:bg-[#dcb83a]">
        Ver oportunidad <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

function ProgressPost({ work }: { work: PublicObra }) {
  const cover = coverFor(work);
  return (
    <article className={card}>
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <WorkAvatar work={work} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold"><Link href={workLink(work.id)} className="hover:underline">{work.title}</Link> <span className={`font-normal ${muted}`}>· actualizó el avance</span></h2>
          <p className={`mt-0.5 text-[13px] ${muted}`}>{work.location}{work.location && work.publishedAt ? ' · ' : ''}<PublishedDate work={work} /></p>
        </div>
      </div>
      {work.summary && <p className="line-clamp-3 whitespace-pre-wrap px-4 pb-3.5 leading-relaxed sm:px-5">{work.summary}</p>}
      <Link href={workLink(work.id)} className="relative block">
        {cover ? (
          <>
            <img src={cover.src} alt={cover.render ? `Render conceptual de ${work.title}` : `Portada de ${work.title}`} className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]" />
            {cover.render && <span className="absolute left-3.5 top-3.5 rounded-full bg-[#172c24]/90 px-2.5 py-1.5 text-xs text-white">Render conceptual</span>}
          </>
        ) : <div className="aspect-[16/9] w-full bg-[#e6eedf]" />}
        <span className="absolute inset-x-3.5 bottom-3.5 flex items-center gap-3.5 rounded-2xl bg-white px-3.5 py-3">
          <span className="min-w-0 flex-1">
            <span className={`block text-[13px] ${muted}`}>{work.stage || 'Avance de obra'}</span>
            <ProgressBar work={work} />
          </span>
          <strong className={`text-2xl font-semibold tracking-tight ${ink}`}>{work.progress}%</strong>
        </span>
      </Link>
      <RoundStrip work={work} />
      <div className="mt-2 flex gap-1 px-2.5 pb-1.5 pt-2.5">
        <Link href={workLink(work.id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm text-[#3c5047] hover:bg-[#f4f5f0]" aria-label={'Ver actividad de ' + work.title}>
          <Compass size={19} aria-hidden="true" />Ver actividad
        </Link>
        <ShareButton work={work} />
      </div>
    </article>
  );
}

function MilestonePost({ work }: { work: PublicObra }) {
  const done = work.milestones.filter((milestone) => milestone.status === 'validado');
  if (!done.length) return null;
  const last = done[done.length - 1];
  return (
    <article className={`${card} flex items-start gap-3.5 p-4 sm:p-5`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6eedf] text-[#2f5a2a]"><CheckCircle2 size={20} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed"><Link href={workLink(work.id)} className="font-semibold hover:underline">{work.title}</Link> validó el hito <strong>{last.title}</strong></p>
        <p className={`mt-0.5 text-[13px] ${muted}`}>{done.length} de {work.milestones.length} hitos validados</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {work.milestones.map((milestone, index) => (
            <li key={index} className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${milestone.status === 'validado' ? 'bg-[#e6eedf] text-[#2f5a2a]' : 'bg-[#f4f5f0] text-[#5a6b61]'}`}>
              {milestone.title} · {statuses[milestone.status]}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* ---------- Columnas laterales ---------- */

function Stories({ projects }: { projects: PublicObra[] }) {
  if (projects.length < 2) return null;
  return (
    <nav aria-label="Obras con novedades" className={`${card} flex gap-4 overflow-x-auto px-4 py-4`}>
      {projects.map((work) => (
        <Link key={work.id} href={workLink(work.id)} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
          <span className="rounded-full border-2 border-[#4f6b3f] p-0.5"><WorkAvatar work={work} size="size-14" /></span>
          <span className="line-clamp-2 text-center text-xs leading-tight">{work.title}</span>
        </Link>
      ))}
    </nav>
  );
}

function Opportunities({ projects }: { projects: PublicObra[] }) {
  const open = projects.filter((work) => currentRound(work));
  if (!open.length) return null;
  return (
    <section className={`${card} p-[18px]`}>
      <h2 className="text-lg font-semibold tracking-tight">Oportunidades abiertas</h2>
      <ul className="mt-3.5 space-y-3.5">
        {open.map((work) => {
          const round = currentRound(work)!;
          return (
            <li key={work.id}>
              <Link href={workLink(work.id, '#inversion')} className="flex items-center gap-3 rounded-xl hover:bg-[#f4f5f0]">
                <WorkAvatar work={work} size="size-16" rounded="rounded-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{work.title}</span>
                  <span className={`block text-xs ${muted}`}>Ronda {round.number} · {roundLabel(round.estado).toLocaleLowerCase('es')}</span>
                  <span className={`block text-xs ${muted}`}>{mcu.format(round.mcu_integradas)} MCU integradas</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Ficha de obra ---------- */

function WorkDetail({ project, role }: { project: PublicObra; role: AccountRole | null }) {
  const cover = coverFor(project);
  const run = project.simulation;
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/inversores" className={`inline-flex min-h-11 items-center gap-2 text-sm ${muted}`}><ArrowLeft size={16} aria-hidden="true" /> Volver al feed</Link>
      </div>
      <div className="overflow-hidden rounded-3xl">
        {cover ? (
          <figure className="relative">
            <img src={cover.src} alt={cover.render ? `Render conceptual de ${project.title}` : `Portada de ${project.title}`} className="h-[260px] w-full object-cover sm:h-[420px]" />
            {cover.render && <figcaption className="absolute right-4 top-4 rounded-full bg-[#172c24]/90 px-2.5 py-1.5 text-xs text-white">Render conceptual</figcaption>}
          </figure>
        ) : <div className="h-40 bg-[#1d3329]" />}
      </div>
      <div className="relative -mt-11 flex flex-wrap items-end gap-4 px-2">
        <span className="rounded-[24px] border-4 border-[#f4f5f0]"><WorkAvatar work={project} size="size-24" rounded="rounded-[20px]" /></span>
        <div className="min-w-0 flex-[1_1_280px] pb-1">
          <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
          {project.location && <p className={`mt-1 text-sm ${muted}`}>{project.location}</p>}
        </div>
        <div className="flex gap-2 pb-1.5">
          <Link href={`/inversores?mapa=1&obra=${project.id}` as Route} aria-label="Ver en mapa" className="grid size-11 place-items-center rounded-full border border-[#d5dccf] bg-white hover:bg-[#f4f5f0]"><MapPin size={17} aria-hidden="true" /></Link>
          <ShareButton work={project} label={false} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <section className={`${card} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Así va la obra</h2>
              <span className={`text-[13px] ${muted}`}>{project.stage || 'Avance de obra'}</span>
            </div>
            <div className="mt-4 flex items-center gap-5">
              <div className="min-w-0 flex-1"><p className={`text-sm ${muted}`}>Avance físico publicado</p><ProgressBar work={project} /></div>
              <strong className="text-3xl font-semibold tracking-tight">{project.progress}%</strong>
            </div>
            {project.summary && <p className="mt-4 whitespace-pre-wrap leading-relaxed">{project.summary}</p>}
          </section>

          {role === 'contratista' && project.contractorNotes && <section className={`${card} p-5`}>
            <h2 className="font-semibold">Trabajos en esta obra</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{project.contractorNotes}</p>
          </section>}

          <section aria-labelledby="actividad" className="space-y-0">
            <h2 id="actividad" className="mb-3 text-xl font-semibold tracking-tight">Actividad</h2>
            {project.milestones.length ? (
              <ol>
                {project.milestones.map((milestone, index) => {
                  const last = index === project.milestones.length - 1;
                  const ok = milestone.status === 'validado';
                  return (
                    <li key={index} className="flex gap-4">
                      <div className="flex w-11 shrink-0 flex-col items-center">
                        <span className={`grid size-11 place-items-center rounded-full ${ok ? 'bg-[#e6eedf] text-[#2f5a2a]' : 'bg-white text-[#5a6b61] ring-1 ring-[#d5dccf]'}`}><CheckCircle2 size={20} aria-hidden="true" /></span>
                        {!last && <span className="w-0.5 flex-1 bg-[#dfe5da]" />}
                      </div>
                      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-6'}`}>
                        <p className="mt-2.5"><strong>{ok ? 'Hito validado:' : 'Hito:'}</strong> {milestone.title}</p>
                        <p className={`mt-0.5 text-sm ${muted}`}>{statuses[milestone.status]}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : <p className={`${card} p-5 text-sm ${muted}`}>Todavía no hay actividad publicada.</p>}
          </section>
        </div>

        <aside className="flex min-w-[280px] max-w-[400px] flex-[1_1_340px] flex-col gap-4 lg:sticky lg:top-24">
          {run && <InvestmentRun run={run} />}
          {!run && role === 'inversor' && project.investorNotes && <section id="inversion" className={`${card} p-5`}>
            <h2 className="font-semibold">Seguimiento de inversión</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{project.investorNotes}</p>
          </section>}
          {project.milestones.length > 0 && <section className={`${card} p-[18px]`}>
            <h2 className="text-[15px] font-semibold">Hitos</h2>
            <ul className="mt-2 divide-y divide-[#eef1ea]">
              {project.milestones.map((milestone, index) => (
                <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>{milestone.title}</span>
                  <span className="shrink-0 rounded-full bg-[#e6eedf] px-2.5 py-1 text-xs font-semibold text-[#2f5a2a]">{statuses[milestone.status]}</span>
                </li>
              ))}
            </ul>
          </section>}
        </aside>
      </div>
    </>
  );
}

/* ---------- Página ---------- */

type FeedProps = {
  projects: PublicObra[];
  project?: PublicObra;
  unavailable: boolean;
  requestedObra: boolean;
  account: { role: AccountRole | null } | null;
};

export default function GrowsFeed({ projects, project, unavailable, requestedObra, account }: FeedProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todo');
  const role = account?.role ?? null;
  const profile = role ? profiles[role] : null;
  const ProfileIcon = profile?.icon ?? UserRound;
  const needle = query.trim().toLocaleLowerCase('es');
  const searched = projects.filter((work) => [work.title, work.location, work.summary].join(' ').toLocaleLowerCase('es').includes(needle));
  const filtered = filter === 'rondas' ? searched.filter((work) => currentRound(work)) : searched;
  const navItem = 'flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm hover:bg-[#e6eedf]';

  return (
    <div className={`min-h-screen bg-[#f4f5f0] pb-20 text-[15px] lg:pb-0 ${ink}`}>
      <header className="sticky top-0 z-20 border-b border-[#e3e8df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1360px] items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
          <Link href="/inversores" className="shrink-0 text-[30px] font-bold leading-none tracking-[-1.5px]">grows<span className="text-[#6e8a58]">.</span></Link>
          {!project && (
            <label className="flex min-w-0 max-w-md flex-1 items-center gap-2.5 rounded-full bg-[#f0f3ec] px-4 py-2.5 text-[#5a6b61]">
              <Search className="shrink-0" size={17} aria-hidden="true" />
              <input aria-label="Buscar obras" placeholder="Buscar obras" className={`w-full min-w-0 bg-transparent text-sm outline-none ${ink}`} value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          )}
          <nav aria-label="Cuenta" className="ml-auto flex items-center gap-1">
            <Link href="/inversores?mapa=1" aria-label="Mapa de obras" className="hidden size-11 place-items-center rounded-xl text-[#5a6b61] hover:bg-[#f4f5f0] md:grid"><MapPin size={20} aria-hidden="true" /></Link>
            {!account ? (
              <Link href="/auth/login?redirect=%2Finversores" prefetch={false} className="inline-flex min-h-11 items-center rounded-full bg-[#1d3329] px-4 text-sm font-semibold text-white">Ingresar</Link>
            ) : profile?.href ? (
              <Link href={profile.href as Route} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6eedf] py-1 pl-1 pr-4 text-sm font-semibold">
                <span className="grid size-9 place-items-center rounded-full bg-[#1d3329] text-white"><ProfileIcon size={16} aria-hidden="true" /></span><span>{profile.label}</span>
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6eedf] py-1 pl-1 pr-4 text-sm font-semibold">
                <span className="grid size-9 place-items-center rounded-full bg-[#1d3329] text-white"><ProfileIcon size={16} aria-hidden="true" /></span><span>{profile?.label ?? 'Mi cuenta'}</span>
              </span>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:py-6">
        {project ? <WorkDetail project={project} role={role} /> : (
          <div className="flex flex-wrap items-start gap-6">
            <aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:sticky lg:top-24 lg:flex">
              {profile && (
                <section className={card}>
                  <div className="h-16 bg-[#1d3329]" />
                  <div className="-mt-7 px-[18px] pb-[18px]">
                    <span className="grid size-14 place-items-center rounded-full border-[3px] border-white bg-[#e8c547] text-[#1d3329]"><ProfileIcon size={22} aria-hidden="true" /></span>
                    <p className="mt-2.5 font-semibold">Tu espacio en GROWS</p>
                    <p className={`text-[13px] ${muted}`}>Perfil de {profile.label.toLocaleLowerCase('es')}</p>
                  </div>
                </section>
              )}
              <nav aria-label="Navegación del feed" className="flex flex-col gap-0.5">
                <Link href="/inversores" aria-current="page" className={`${navItem} bg-[#e6eedf] font-semibold`}><Home size={19} aria-hidden="true" /> Para vos</Link>
                {profile?.href && <Link href={profile.href as Route} className={navItem}><Briefcase size={19} aria-hidden="true" /> Mi espacio</Link>}
                <Link href="/inversores/panel" className={navItem}><TrendingUp size={19} aria-hidden="true" /> Panel inversor</Link>
                <Link href="/inversores?mapa=1" className={navItem}><MapPin size={19} aria-hidden="true" /> Mapa de obras</Link>
              </nav>
            </aside>

            <main id="feed" className="flex min-w-0 max-w-[680px] flex-[999_1_560px] flex-col gap-5">
              <h1 className="sr-only">Tu comunidad, en obra.</h1>
              {!query && <Stories projects={projects} />}
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Filtrar feed" className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}
                      className={`${chip} ${filter === item.id ? 'bg-[#1d3329] font-semibold text-white' : 'border border-[#d5dccf] bg-white hover:bg-[#f0f3ec]'}`}>{item.label}</button>
                  ))}
                </div>
                <Link href="/inversores?mapa=1" className={`${chip} ml-auto gap-2 border border-[#d5dccf] bg-white font-semibold hover:bg-[#f0f3ec]`}><MapPin size={16} aria-hidden="true" /> Ver mapa</Link>
              </div>
              {requestedObra && <p role="status" className="text-sm">Esta obra no tiene una publicación disponible.</p>}
              {filtered.map((work) => (
                <div key={work.id} className="flex flex-col gap-5">
                  <ProgressPost work={work} />
                  {filter === 'todo' && <MilestonePost work={work} />}
                </div>
              ))}
              {!filtered.length && <section role="status" className={`${card} p-8 text-center`}>
                <h2 className="font-semibold">{unavailable ? 'No pudimos cargar las obras' : needle ? 'No encontramos obras con esa búsqueda' : filter === 'rondas' ? 'No hay rondas abiertas por ahora' : 'Todavía no hay obras publicadas'}</h2>
                {unavailable && <p className={`mt-2 text-sm ${muted}`}>Volvé a cargar la página para reintentar.</p>}
              </section>}
            </main>

            <aside className="hidden min-w-[280px] max-w-[340px] flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-24 lg:flex">
              <Opportunities projects={projects} />
              {role === 'inversor' && (
                <section className="rounded-[20px] bg-[#1d3329] p-[18px] text-white">
                  <p className="text-[13px] text-[#c9d6c2]">Tu cartera</p>
                  <p className="mt-1.5 text-lg font-semibold">Seguí tus rondas y suscripciones del ensayo</p>
                  <Link href="/inversores/panel" className="mt-3.5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#e8c547]">Abrir panel <ArrowRight size={16} aria-hidden="true" /></Link>
                </section>
              )}
              <section className={`${card} p-[18px]`}>
                <p className="flex items-center gap-2 text-sm font-semibold"><Bookmark size={16} aria-hidden="true" /> Obras publicadas</p>
                <p className={`mt-1 text-sm ${muted}`}>{projects.length} {projects.length === 1 ? 'obra en la comunidad' : 'obras en la comunidad'}</p>
              </section>
            </aside>
          </div>
        )}
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[#e3e8df] bg-white px-1 pb-4 pt-1.5 lg:hidden">
        <Link href="/inversores" className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold"><Home size={22} aria-hidden="true" />Inicio</Link>
        <Link href="/inversores?mapa=1" className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] ${muted}`}><MapPin size={22} aria-hidden="true" />Mapa</Link>
        <Link href="/inversores/panel" className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] ${muted}`}><Briefcase size={22} aria-hidden="true" />Cartera</Link>
        <Link href={(profile?.href ?? (account ? '/inversores/panel' : '/auth/login?redirect=%2Finversores')) as Route} prefetch={false} className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] ${muted}`}><UserRound size={22} aria-hidden="true" />Perfil</Link>
      </nav>
    </div>
  );
}
