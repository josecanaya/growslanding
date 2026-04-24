'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Plus,
  Upload,
  Share2,
  History,
  GitBranch,
  CheckSquare,
} from 'lucide-react';
import {
  MOCK_OBRAS,
  MOCK_ORGANIZACION,
  colaboradoresForObra,
  obraById,
  tareasByObra,
} from '@/lib/mocks/clienteMockData';
import { cn } from '@/lib/utils';

type Props = { obraId: string };

const prioridadEtiqueta = (p: string) =>
  p === 'alta' ? 'Alta prioridad' : p === 'media' ? 'Media' : 'Baja';

export function ClienteCentroOperacionesView({ obraId }: Props) {
  const router = useRouter();
  const obra = obraById(obraId);
  const tareas = tareasByObra(obra.id);
  const cols = colaboradoresForObra(obra.id);
  const visibles = cols.slice(0, 3);
  const extra = Math.max(0, cols.length - 3);

  return (
    <div className="min-h-0 bg-[#f9f9f9] text-[#2d3435]">
      {/* Barra estilo Stitch (complementa ClienteShell): marca + nav local */}
      <header className="mb-6 flex flex-col gap-4 border-b border-[#dde4e5] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold tracking-tighter text-[#5d5e64] sm:text-lg">{MOCK_ORGANIZACION.nombre}</h1>
          <span className="hidden rounded-md bg-[#d1e4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#215485] sm:inline">
            Centro de obra
          </span>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs font-bold tracking-tight text-[#5d5e64]">
          <span className="border-b-2 border-[#5d5e64] pb-0.5">Proyecto</span>
          <button type="button" className="text-[#5d5e64]/50 transition hover:text-[#5d5e64]">
            Estudio
          </button>
          <button type="button" className="text-[#5d5e64]/50 transition hover:text-[#5d5e64]">
            Archivo
          </button>
        </nav>
      </header>

      <div className="flex flex-col gap-6 pb-8 xl:flex-row xl:gap-8">
        {/* Pipeline izquierda */}
        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[260px]">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">Active pipeline</span>
            <div className="h-0.5 w-8 bg-[#5d5e64]" />
          </div>
          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-h-[calc(100vh-14rem)]">
            {MOCK_OBRAS.map((o) => {
              const active = o.id === obra.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => router.push(`/cliente/obras/${o.id}` as Route)}
                  className={cn(
                    'rounded-xl p-5 text-left transition',
                    active
                      ? 'border-l-4 border-[#5d5e64] bg-white shadow-sm'
                      : 'bg-[#f2f4f4] hover:bg-[#e4e9ea]'
                  )}
                >
                  <span
                    className={cn(
                      'mb-2 block text-[10px] font-semibold uppercase tracking-widest',
                      active ? 'text-[#326293]' : 'text-[#757c7d]'
                    )}
                  >
                    {o.tipo}
                  </span>
                  <h3
                    className={cn(
                      'font-semibold leading-tight',
                      active ? 'text-lg text-[#2d3435]' : 'text-base text-[#5a6061]'
                    )}
                  >
                    {o.nombre}
                  </h3>
                  <p className="mt-1 text-xs font-light text-[#5a6061]">{o.ubicacion}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Columna central */}
        <section className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="relative h-[220px] w-full overflow-hidden sm:h-[280px] md:h-[320px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'linear-gradient(120deg, rgba(45,52,53,0.75) 0%, rgba(93,94,100,0.4) 45%, rgba(50,98,147,0.35) 100%), url(https://images.unsplash.com/photo-1487958449943-2427e367be15?auto=format&fit=crop&w=1600&q=80)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-10">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{obra.nombre}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5" />
                  {obra.ubicacion}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5" />
                  {obra.faseCentro}
                </span>
              </div>
              <div className="mt-4">
                <Link
                  href={`/cliente/obras/${obra.id}/timeline` as Route}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#326293] shadow-sm transition hover:bg-white"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Ver línea de tiempo
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-10 p-6 sm:p-8 md:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="mb-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">
                    Lista de tareas
                  </span>
                  <div className="h-0.5 w-8 bg-[#326293]" />
                </div>
                <ul className="flex flex-col gap-6">
                  {tareas.length === 0 ? (
                    <li className="text-sm text-[#5a6061]">No hay tareas mock para esta obra.</li>
                  ) : (
                    tareas.map((t, idx) => (
                      <li
                        key={t.id}
                        className={cn(
                          'flex gap-4',
                          idx === 1 ? 'opacity-70 transition-opacity hover:opacity-100' : ''
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[#adb3b4]',
                            t.estado === 'Validada' && 'border-[#326293] bg-[#326293]'
                          )}
                        >
                          {t.estado === 'Validada' ? (
                            <CheckSquare className="h-3.5 w-3.5 text-white" />
                          ) : null}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#2d3435]">{t.titulo}</h4>
                          <p className="mt-1 text-xs font-light leading-relaxed text-[#5a6061]">{t.descripcion}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded bg-[#dde4e5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#5a6061]">
                              {prioridadEtiqueta(t.prioridad)}
                            </span>
                            {t.estado === 'Para validar' ? (
                              <span className="rounded bg-[#d1e4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#215485]">
                                Para validar
                              </span>
                            ) : null}
                            {t.estado === 'En progreso' ? (
                              <span className="rounded bg-[#ebeeef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#5a6061]">
                                En obra
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <div className="mb-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">
                    Colaboradores
                  </span>
                  <div className="h-0.5 w-8 bg-[#adb3b4]" />
                </div>
                <div className="flex -space-x-3">
                  {visibles.map((ini, i) => (
                    <div
                      key={`${ini}-${i}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e9ea] text-[11px] font-bold text-[#5a6061] ring-4 ring-white"
                    >
                      {ini}
                    </div>
                  ))}
                  {extra > 0 ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dde4e5] text-[10px] font-bold text-[#5a6061] ring-4 ring-white">
                      +{extra}
                    </div>
                  ) : null}
                </div>
                <div className="mt-6 rounded-xl bg-[#f2f4f4] p-6">
                  <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#5a6061]">Nota técnica</h5>
                  <p className="text-xs italic leading-relaxed text-[#2d3435]">&ldquo;{obra.notaTecnica}&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Columna derecha CTAs */}
        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[200px]">
          <button
            type="button"
            onClick={() => router.push(`/cliente/tareas/${obra.id}` as Route)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl bg-[#5d5e64] py-8 text-white shadow-lg shadow-[#5d5e64]/20 transition hover:bg-[#515258]"
          >
            <Plus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Nueva tarea</span>
          </button>
          <div className="flex flex-col gap-3">
            {[
              { icon: Upload, label: 'Subir plano' },
              { icon: Share2, label: 'Compartir' },
              { icon: History, label: 'Historial' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex cursor-pointer items-center gap-4 rounded-xl bg-[#dde4e5] p-4 text-left transition hover:bg-[#dde4e5]/80"
              >
                <Icon className="h-5 w-5 text-[#757c7d]" strokeWidth={1.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a6061]">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto rounded-xl border border-[#5d5e64]/10 bg-[#5d5e64]/5 p-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#5d5e64]">
              Grows cloud
            </span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#5d5e64]/10">
              <div className="h-full w-2/3 rounded-full bg-[#5d5e64]" />
            </div>
            <span className="mt-2 block text-[9px] text-[#5d5e64]/70">{obra.avancePct}% avance reportado</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
