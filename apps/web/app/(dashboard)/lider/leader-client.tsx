'use client';

import { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';

import { visitStatusSchema } from '@/lib/fsm';

const estadosOrdenados = visitStatusSchema.options;

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_ejecucion: 'En ejecución',
  finalizado: 'Finalizado',
  validado: 'Validado',
};

type Socio = {
  id: string;
  nombre: string;
  contacto: string | null;
  org_id: string;
  status: string;
  rol: 'funcional' | 'autonomo';
};

type Evento = {
  id: string;
  nuevo_estado: (typeof estadosOrdenados)[number];
  actor_name: string;
  created_at: string;
  notas: string;
  pdf_path: string | null;
  has_nc: boolean | null;
};

type Tarea = {
  id: string;
  obra_id: string;
  tipo: string;
  descripcion: string;
  estado: (typeof estadosOrdenados)[number];
  referente_id: string | null;
  socio_ids: string[];
  created_at: string;
  obra: { nombre: string | null; cliente: string | null } | null;
  eventos: Evento[];
};

type Token = {
  ref_id: string;
  token: string;
  enabled: boolean;
};

type LeaderClientProps = {
  socios: Socio[];
  tareas: Tarea[];
  tokens: Token[];
};

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_ejecucion: 'bg-blue-100 text-blue-800',
  finalizado: 'bg-emerald-100 text-emerald-800',
  validado: 'bg-purple-100 text-purple-800',
};

function buildProgress(estado: Tarea['estado']) {
  const idx = estadosOrdenados.indexOf(estado);
  const percent = ((idx + 1) / estadosOrdenados.length) * 100;
  return Math.max(0, Math.min(100, percent));
}

export default function LeaderClient({ socios, tareas, tokens }: LeaderClientProps) {
  const sociosOrdenados = useMemo(
    () => [...socios].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [socios]
  );
  const [socioId, setSocioId] = useState<string>(sociosOrdenados[0]?.id ?? '');
  const [estadoFiltro, setEstadoFiltro] = useState<'all' | Tarea['estado']>('all');

  const tokenMap = useMemo(() => {
    const map = new Map<string, Token>();
    tokens.forEach((token) => {
      map.set(token.ref_id, token);
    });
    return map;
  }, [tokens]);

  const socioSeleccionado = sociosOrdenados.find((s) => s.id === socioId) ?? null;

  const tareasAsignadas = useMemo(() => {
    if (!socioSeleccionado) return [] as Tarea[];
    return tareas.filter((tarea) => {
      return (
        tarea.referente_id === socioSeleccionado.id ||
        tarea.socio_ids?.includes(socioSeleccionado.id)
      );
    });
  }, [socioSeleccionado, tareas]);

  const tareasFiltradas = useMemo(() => {
    if (estadoFiltro === 'all') return tareasAsignadas;
    return tareasAsignadas.filter((tarea) => tarea.estado === estadoFiltro);
  }, [estadoFiltro, tareasAsignadas]);

  const stats = useMemo(() => {
    const total = tareasAsignadas.length;
    const porEstado = estadosOrdenados.map((estado) => ({
      estado,
      total: tareasAsignadas.filter((t) => t.estado === estado).length,
    }));
    return { total, porEstado } as const;
  }, [tareasAsignadas]);

  const equipo = useMemo(() => {
    if (!socioSeleccionado) return [] as Socio[];
    const ids = new Set<string>();
    tareasAsignadas.forEach((tarea) => {
      tarea.socio_ids?.forEach((id) => ids.add(id));
      if (tarea.referente_id) ids.add(tarea.referente_id);
    });
    if (ids.size === 0) {
      return [] as Socio[];
    }
    return sociosOrdenados.filter((s) => ids.has(s.id));
  }, [sociosOrdenados, tareasAsignadas, socioSeleccionado]);

  const handleAbrirQR = useCallback(
    (tarea: Tarea) => {
      const token = tokenMap.get(tarea.id);
      if (!token || !token.enabled) {
        alert('Esta tarea aún no tiene un QR habilitado. Solicita al Cliente Técnico su creación.');
        return;
      }
      const url = `/t/${token.token}`;
      window.open(url, '_blank', 'noopener');
    },
    [tokenMap]
  );

  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="rounded border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Panel del Líder</h1>
            <p className="text-sm text-muted-foreground">
              Visualiza tus tareas asignadas, tu micro-cuadrilla y el historial de actas.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div>
              <label className="text-xs uppercase text-muted-foreground">
                Seleccionar líder
              </label>
              <select
                className="mt-1 w-64 rounded border px-3 py-2"
                value={socioId}
                onChange={(event) => setSocioId(event.target.value)}
              >
                {sociosOrdenados.map((socio) => (
                  <option key={socio.id} value={socio.id}>
                    {socio.nombre} — {socio.rol === 'funcional' ? 'Funcional' : 'Autónomo'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">
                Filtrar por estado
              </label>
              <select
                className="mt-1 w-48 rounded border px-3 py-2"
                value={estadoFiltro}
                onChange={(event) =>
                  setEstadoFiltro(event.target.value as typeof estadoFiltro)
                }
              >
                <option value="all">Todos</option>
                {estadosOrdenados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estadoLabels[estado]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {socioSeleccionado && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase text-muted-foreground">Tareas activas</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </article>
          {stats.porEstado.map(({ estado, total }) => (
            <article
              key={estado}
              className="rounded border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-xs uppercase text-muted-foreground">
                {estadoLabels[estado]}
              </p>
              <p className="mt-2 text-xl font-semibold">{total}</p>
            </article>
          ))}
        </section>
      )}

      {equipo.length > 0 && (
        <section className="rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Mi equipo</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {equipo.map((miembro) => (
              <div key={miembro.id} className="rounded border border-dashed px-3 py-2">
                <p className="font-medium">{miembro.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {miembro.rol === 'funcional' ? 'Funcional' : 'Autónomo'}
                </p>
                {miembro.contacto && (
                  <p className="text-xs text-muted-foreground">{miembro.contacto}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tareas asignadas</h2>
          <p className="text-sm text-muted-foreground">
            Cada cambio de estado requiere evidencia fotográfica o firma según aplique.
            Puedes usar el acceso QR o solicitarlo al cliente técnico.
          </p>
        </div>
        {tareasFiltradas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay tareas para el filtro seleccionado.
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {tareasFiltradas.map((tarea) => {
            const progreso = buildProgress(tarea.estado);
            const ultimoEvento =
              [...(tarea.eventos ?? [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0] ?? null;
            const estadoClass = estadoColors[tarea.estado] ?? 'bg-slate-100 text-slate-800';
            const token = tokenMap.get(tarea.id);

            return (
              <article key={tarea.id} className="flex flex-col gap-3 rounded border border-border bg-card p-4 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{tarea.tipo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {tarea.obra?.nombre ?? 'Obra sin nombre'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoClass}`}>
                    {estadoLabels[tarea.estado]}
                  </span>
                </header>

                <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Progreso</p>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                {ultimoEvento && (
                  <div className="rounded border border-dashed px-3 py-2">
                    <p className="text-xs uppercase text-muted-foreground">Último evento</p>
                    <p className="text-sm font-medium">{estadoLabels[ultimoEvento.nuevo_estado]}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ultimoEvento.created_at), 'dd/MM HH:mm')} · {ultimoEvento.actor_name}
                    </p>
                    {ultimoEvento.has_nc && (
                      <p className="text-xs text-red-600">Contiene no conformidad</p>
                    )}
                    {ultimoEvento.pdf_path && (
                      <a
                        href={`/actas/${ultimoEvento.id}/pdf`}
                        className="mt-1 inline-flex items-center text-xs text-primary"
                      >
                        Descargar acta PDF
                      </a>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Historial</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {tarea.eventos
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((evento) => (
                        <li key={evento.id}>
                          {format(new Date(evento.created_at), 'dd/MM HH:mm')} ·{' '}
                          {estadoLabels[evento.nuevo_estado]} · {evento.actor_name}
                        </li>
                      ))}
                    {tarea.eventos.length === 0 && <li>Sin eventos registrados aún.</li>}
                  </ul>
                </div>

                <footer className="mt-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    onClick={() => handleAbrirQR(tarea)}
                    disabled={!token || !token.enabled}
                  >
                    Reportar avance por QR
                  </button>
                  {!token?.enabled && (
                    <span className="text-xs text-muted-foreground">
                      Solicita al cliente el QR de esta tarea.
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
