'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Building2, Compass, HardHat, MapPin, Search, TrendingUp, UserRound } from 'lucide-react';
import InvestmentRun from './InvestmentRun';
import type { accountRole } from '@/lib/obras/feed-profile';
import type { PublicObra } from '@/lib/obras/publication';

type AccountRole = NonNullable<ReturnType<typeof accountRole>>;

const profiles = {
  contratista: { label: 'Contratista', icon: HardHat, href: '/socio/panel' },
  profesional: { label: 'Proyectista', icon: Building2, href: '/cliente/dashboard' },
  inversor: { label: 'Inversor', icon: TrendingUp, href: null },
  admin: { label: 'Administrador', icon: Building2, href: '/cliente/dashboard' },
} as const;

const accountBadge = 'inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#e8efe4] px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm';
const panel = 'overflow-hidden rounded-3xl border border-[#dee5d9] bg-white';
const statuses = { validado: 'Validado', en_curso: 'En curso', pendiente: 'Pendiente' };
const alvearId = '569e1eda-3fcb-453a-b394-d8a1a536648e';

function workLink(id: string): Route {
  return `/inversores?obra=${id}` as Route;
}

function coverFor(work: PublicObra) {
  if (work.coverUrl) return { src: work.coverUrl, render: false };
  return work.id === alvearId ? { src: '/images/obras/pasaje-alvear.webp', render: true } : null;
}

function WorkAvatar({ work }: { work: PublicObra }) {
  const cover = coverFor(work);
  return <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9eee4] text-[#36503e]">
    {cover ? <img src={cover.src} alt="" className="size-full object-cover" /> : <Building2 size={19} aria-hidden="true" />}
  </span>;
}

function WorkCover({ work }: { work: PublicObra }) {
  const cover = coverFor(work);
  if (!cover) return null;
  return (
    <figure className="relative">
      <img src={cover.src} alt={cover.render ? `Render conceptual de ${work.title}` : `Portada de ${work.title}`} className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]" />
      {cover.render && <figcaption className="absolute bottom-4 right-4 rounded-full bg-[#172c24]/90 px-3 py-1.5 text-xs text-white">Render conceptual</figcaption>}
    </figure>
  );
}

function WorkProgress({ work }: { work: PublicObra }) {
  return (
    <div className="flex items-center gap-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{work.stage || 'Avance de obra'}</p>
        <div role="progressbar" aria-label={'Avance de ' + work.title} aria-valuenow={work.progress} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e3eadd]">
          <div className="h-full rounded-full bg-[#637e52]" style={{ width: work.progress + '%' }} />
        </div>
      </div>
      <strong className="text-2xl font-semibold tracking-tight">{work.progress}%</strong>
    </div>
  );
}

function PublishedDate({ work }: { work: PublicObra }) {
  const date = work.publishedAt && new Date(work.publishedAt);
  if (!date || !Number.isFinite(date.getTime())) return null;
  return <time dateTime={date.toISOString()}>{date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })}</time>;
}

function WorkMilestones({ work }: { work: PublicObra }) {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <h2 className="font-semibold">Hitos de obra</h2>
      {work.milestones.length ? (
        <ul className="mt-1 divide-y divide-[#e2e8df]">
          {work.milestones.map((milestone, index) => (
            <li key={index} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>{milestone.title}</span>
              <span className="shrink-0 rounded-full bg-[#e9eee4] px-2.5 py-1 text-xs font-medium text-[#36503e]">{statuses[milestone.status]}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-[#53695d]">Todavía no hay hitos publicados.</p>}
    </section>
  );
}

type FeedProps = {
  projects: PublicObra[];
  project?: PublicObra;
  unavailable: boolean;
  requestedObra: boolean;
  account: { role: AccountRole | null } | null;
};

export default function GrowsFeed({ projects, project, unavailable, requestedObra, account }: FeedProps) {
  const [query, setQuery] = useState('');
  const profile = account?.role ? profiles[account.role] : null;
  const ProfileIcon = profile?.icon ?? UserRound;
  const filtered = projects.filter((work) => [work.title, work.location, work.summary].join(' ').toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  const spotlight = project ?? filtered[0];

  return (
    <div className="min-h-screen bg-[#f5f6f1] text-[#20382f]">
      <header className="sticky top-0 z-20 border-b border-[#e0e6dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1360px] items-center gap-4 px-5 py-4 sm:gap-8 lg:px-10">
          <Link href="/inversores" className="shrink-0 text-[34px] font-bold leading-none tracking-[-2px]">grows<span className="text-[#6e8a58]">.</span></Link>
          {!project && (
            <label className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-full bg-[#f0f3ed] px-3 py-2.5 sm:px-4">
              <Search className="shrink-0" size={17} aria-hidden="true" />
              <input aria-label="Buscar obras" placeholder="Buscar obras" className="w-full min-w-0 bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          )}
          <nav aria-label="Cuenta" className="ml-auto flex items-center">
            {!account ? (
              <Link href="/auth/login?redirect=%2Finversores" prefetch={false} className="rounded-full bg-[#193c32] px-4 py-2.5 text-sm font-semibold text-white">Ingresar</Link>
            ) : profile?.href ? (
              <Link href={profile.href as Route} className={accountBadge}><ProfileIcon size={16} aria-hidden="true" />{profile.label}</Link>
            ) : (
              <span className={accountBadge}><ProfileIcon size={16} aria-hidden="true" />{profile?.label ?? 'Mi cuenta'}</span>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1360px] items-start gap-7 px-4 py-6 sm:px-6 lg:grid-cols-[160px_minmax(0,1fr)_260px] lg:px-10 lg:py-8">
        <nav aria-label="Navegación del feed" className="hidden space-y-2 lg:sticky lg:top-28 lg:block">
          <Link href="/inversores" aria-current={project ? undefined : 'page'} className="flex items-center gap-3 rounded-2xl bg-[#e5ecde] px-4 py-3 text-sm font-semibold"><Compass size={19} /> Para vos</Link>
          {profile?.href && <Link href={profile.href as Route} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-[#e5ecde]"><ProfileIcon size={19} /> Mi espacio</Link>}
        </nav>

        <main id="feed" className="min-w-0">
          {project ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link href="/inversores" className="inline-flex items-center gap-2 text-sm text-[#53695d]"><ArrowLeft size={16} /> Volver al feed</Link>
                <Link href={`/inversores?mapa=1&obra=${project.id}` as Route} className="inline-flex items-center gap-2 rounded-full bg-[#e5ecde] px-4 py-2 text-sm font-semibold"><MapPin size={16} /> Ver en mapa</Link>
              </div>
              <article className={panel}>
                <div className="flex items-center gap-3 p-5 sm:p-6">
                  <WorkAvatar work={project} />
                  <div><p className="text-xs text-[#53695d]">{project.location}</p><h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1></div>
                </div>
                <WorkCover work={project} />
                <div className="space-y-4 p-5 sm:p-6">
                  {project.summary && <p className="whitespace-pre-wrap text-sm leading-relaxed">{project.summary}</p>}
                  <WorkProgress work={project} />
                </div>
              </article>
              {project.simulation && <InvestmentRun run={project.simulation} />}
              {!project.simulation && account?.role === 'inversor' && project.investorNotes && <section className={`${panel} mt-5 p-5 sm:p-6`}>
                <h2 className="font-semibold">Seguimiento de inversión</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{project.investorNotes}</p>
              </section>}
              {account?.role === 'contratista' && project.contractorNotes && <section className={`${panel} mt-5 p-5 sm:p-6`}>
                <h2 className="font-semibold">Trabajos en esta obra</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{project.contractorNotes}</p>
              </section>}
              <div className="mt-5 lg:hidden"><WorkMilestones work={project} /></div>
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">Tu comunidad, en obra.</h1>
                <Link href="/inversores?mapa=1" className="inline-flex items-center gap-2 rounded-full bg-[#e5ecde] px-4 py-2 text-sm font-semibold"><MapPin size={16} /> Ver mapa</Link>
              </div>
              {requestedObra && <p role="status" className="mb-5 text-sm">Esta obra no tiene una publicación disponible.</p>}
              <div className="space-y-6">
                {filtered.map((work) => (
                  <article key={work.id} className={panel}>
                    <div className="flex items-center gap-3 px-5 py-4">
                      <WorkAvatar work={work} />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold"><Link href={workLink(work.id)} className="hover:underline">{work.title}</Link></h2>
                        {work.location && <p className="text-xs text-[#53695d]">{work.location}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-[#53695d]"><PublishedDate work={work} /></span>
                    </div>
                    <WorkCover work={work} />
                    <div className="space-y-4 px-5 py-5 sm:px-6">
                      {work.summary && <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed">{work.summary}</p>}
                      <WorkProgress work={work} />
                      <div className="flex items-center justify-between gap-3 border-t border-[#e0e6dc] pt-4 text-sm">
                        <span className="text-[#53695d]">{work.milestones.length ? `${work.milestones.length} ${work.milestones.length === 1 ? 'hito publicado' : 'hitos publicados'}` : 'Seguimiento de obra'}</span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          {work.simulation && <Link href={`${workLink(work.id)}#inversion` as Route} className="font-semibold hover:underline">Ver rondas</Link>}
                          <Link href={workLink(work.id)} className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline" aria-label={'Ver actividad de ' + work.title}>Ver actividad <ArrowUpRight size={17} /></Link>
                        </div>
                      </div>
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

        <aside className="hidden lg:sticky lg:top-28 lg:block">{spotlight && <WorkMilestones work={spotlight} />}</aside>
      </div>
    </div>
  );
}
