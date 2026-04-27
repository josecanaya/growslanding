'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  mapEstadoDbToTareaCardLabel,
  mapPrioridadDb,
  type ApiTareaRow,
} from '@/lib/mappers/tarea-api-to-ui';

type ObraRes = { id: string; name: string; address: string | null; estado: string | null; orgId: string };
type StatTarea = ApiTareaRow & { descripcion?: string | null };

type Props = { obraId: string };

const prioridadEtiqueta = (p: string | null) => {
  return mapPrioridadDb(p) === 'alta'
    ? 'Alta prioridad'
    : mapPrioridadDb(p) === 'media'
      ? 'Media'
      : 'Baja';
};

function badgeEstadoUi(est: string) {
  const l = (est || '').toLowerCase();
  if (l === 'para_validar' || l.includes('validar')) return 'para_validar';
  if (l === 'en_progreso' || l.includes('progreso')) return 'en_progreso';
  if (l === 'validada') return 'validada';
  return 'otro';
}

export function ClienteCentroOperacionesView({ obraId }: Props) {
  const router = useRouter();
  const user = useCurrentUser();
  const [obras, setObras] = useState<ObraRes[]>([]);
  const [obra, setObra] = useState<ObraRes | null>(null);
  const [tareas, setTareas] = useState<StatTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const rList = await fetch('/api/obras', { cache: 'no-store' });
      const jList = await rList.json().catch(() => ({}));
      if (!rList.ok) {
        setErr('No se pudieron cargar las obras');
        setObras([]);
        return;
      }
      const data = Array.isArray(jList.data) ? jList.data : [];
      const mapped: ObraRes[] = data.map((o: any) => ({
        id: o.id,
        name: o.name,
        address: o.address ?? null,
        estado: o.estado,
        orgId: o.orgId,
      }));
      setObras(mapped);
      const one = mapped.find((o) => o.id === obraId) || null;
      setObra(one);

      if (!one) {
        setTareas([]);
        return;
      }
      const oId = one.orgId || user?.orgId;
      if (!oId) {
        setTareas([]);
        return;
      }
      const rT = await fetch(
        `/api/tareas?obra_id=${encodeURIComponent(one.id)}&org_id=${encodeURIComponent(oId)}`,
        { cache: 'no-store' },
      );
      const jT = await rT.json().catch(() => ({}));
      if (!rT.ok) {
        setTareas([]);
        return;
      }
      setTareas(Array.isArray(jT.data) ? jT.data : []);
    } catch {
      setErr('Error de red');
    } finally {
      setLoading(false);
    }
  }, [obraId, user?.orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const orgLabel = user?.orgName || 'Organización';

  const visibles: string[] = [];
  const extra = 0;

  if (loading) {
    return (
      <div className="min-h-0 bg-[#f9f9f9] p-6 text-sm text-[#5a6061]">
        Cargando centro de operaciones…
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="min-h-0 bg-[#f9f9f9] p-6 text-sm text-[#5a6061]">
        {err || 'No se encontró la obra o no tenés acceso.'}
      </div>
    );
  }

  const fase = obra.estado || 'En curso';
  const avance = tareas.length
    ? Math.min(100, Math.round(tareas.filter((t) => t.estado === 'validada').length * (100 / tareas.length)))
    : 0;

  return (
    <div className="min-h-0 bg-[#f9f9f9] text-[#2d3435]">
      <header className="mb-6 flex flex-col gap-4 border-b border-[#dde4e5] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold tracking-tighter text-[#5d5e64] sm:text-lg">{orgLabel}</h1>
          <span className="hidden rounded-md bg-[#d1e4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#215485] sm:inline">
            Centro de obra
          </span>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs font-bold tracking-tight text-[#5d5e64]">
          <span className="border-b-2 border-[#5d5e64] pb-0.5">Proyecto</span>
          <span className="text-[#5d5e64]/50">Estudio</span>
          <span className="text-[#5d5e64]/50">Archivo</span>
        </nav>
      </header>

      <div className="flex flex-col gap-6 pb-8 xl:flex-row xl:gap-8">
        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[260px]">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">Obras de la org.</span>
            <div className="h-0.5 w-8 bg-[#5d5e64]" />
          </div>
          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-h-[calc(100vh-14rem)]">
            {obras.map((o) => {
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
                      : 'bg-[#f2f4f4] hover:bg-[#e4e9ea]',
                  )}
                >
                  <span
                    className={cn(
                      'mb-2 block text-[10px] font-semibold uppercase tracking-widest',
                      active ? 'text-[#326293]' : 'text-[#757c7d]',
                    )}
                  >
                    {o.estado || 'Obra'}
                  </span>
                  <h3
                    className={cn(
                      'font-semibold leading-tight',
                      active ? 'text-lg text-[#2d3435]' : 'text-base text-[#5a6061]',
                    )}
                  >
                    {o.name}
                  </h3>
                  <p className="mt-1 text-xs font-light text-[#5a6061]">{o.address || '—'}</p>
                </button>
              );
            })}
          </div>
        </aside>

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
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{obra.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5" />
                  {obra.address || '—'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5" />
                  {fase}
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">Lista de tareas</span>
                  <div className="h-0.5 w-8 bg-[#326293]" />
                </div>
                <ul className="flex flex-col gap-6">
                  {tareas.length === 0 ? (
                    <li className="text-sm text-[#5a6061]">No hay tareas para esta obra todavía.</li>
                  ) : (
                    tareas.map((t, idx) => {
                      const st = mapEstadoDbToTareaCardLabel(t.estado);
                      const b = badgeEstadoUi(t.estado);
                      return (
                        <li
                          key={t.id}
                          className={cn('flex gap-4', idx === 1 ? 'opacity-70 transition-opacity hover:opacity-100' : '')}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[#adb3b4]',
                              st === 'Validada' && 'border-[#326293] bg-[#326293]',
                            )}
                          >
                            {st === 'Validada' ? <CheckSquare className="h-3.5 w-3.5 text-white" /> : null}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-[#2d3435]">{t.title}</h4>
                            {t.descripcion ? (
                              <p className="mt-1 text-xs font-light leading-relaxed text-[#5a6061]">{t.descripcion}</p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded bg-[#dde4e5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#5a6061]">
                                {prioridadEtiqueta(t.prioridad)}
                              </span>
                              {b === 'para_validar' ? (
                                <span className="rounded bg-[#d1e4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#215485]">
                                  Para validar
                                </span>
                              ) : null}
                              {b === 'en_progreso' ? (
                                <span className="rounded bg-[#ebeeef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#5a6061]">
                                  En obra
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div>
                <div className="mb-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#757c7d]">Colaboradores</span>
                  <div className="h-0.5 w-8 bg-[#adb3b4]" />
                </div>
                {visibles.length === 0 ? (
                  <p className="text-xs text-[#5a6061]">Se mostrarán iniciales cuando haya asignaciones en tareas/socios.</p>
                ) : (
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
                )}
                <div className="mt-6 rounded-xl bg-[#f2f4f4] p-6">
                  <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#5a6061]">Nota</h5>
                  <p className="text-xs leading-relaxed text-[#2d3435]">
                    Datos de tareas y obra leídos desde la API. El panel de colaboradores se puede enlazar a socios
                    asignados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#5d5e64]">Avance</span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#5d5e64]/10">
              <div className="h-full rounded-full bg-[#5d5e64]" style={{ width: `${avance}%` }} />
            </div>
            <span className="mt-2 block text-[9px] text-[#5d5e64]/70">{avance}% tareas validadas (aprox.)</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
