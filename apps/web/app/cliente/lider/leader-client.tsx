'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  rol: string;
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

type Obra = {
  id: string;
  nombre: string;
  cliente: string | null;
  localizacion: string | null;
};

type Invite = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  status: string;
  created_at: string;
};

type LeaderClientProps = {
  socios: Socio[];
  tareas: Tarea[];
  tokens: Token[];
  obras: Obra[];
  invites: Invite[];
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

const nuevaTareaSchema = z.object({
  obra_id: z.string().uuid('Selecciona una obra'),
  tipo: z.string().min(2, 'Indica el tipo de tarea'),
  descripcion: z.string().min(5, 'Describe la tarea'),
});

const nuevoInviteSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
});

export default function LeaderClient({ socios, tareas, tokens, obras, invites }: LeaderClientProps) {
  const router = useRouter();
  const sociosOrdenados = useMemo(
    () => [...socios].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [socios]
  );
  const [socioId, setSocioId] = useState<string>(sociosOrdenados[0]?.id ?? '');
  const [estadoFiltro, setEstadoFiltro] = useState<'all' | Tarea['estado']>('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const tareaForm = useForm<z.infer<typeof nuevaTareaSchema>>({
    resolver: zodResolver(nuevaTareaSchema),
    defaultValues: {
      obra_id: obras[0]?.id ?? '',
      tipo: '',
      descripcion: '',
    },
  });

  const inviteForm = useForm<z.infer<typeof nuevoInviteSchema>>({
    resolver: zodResolver(nuevoInviteSchema),
    defaultValues: { nombre: '', email: '' },
  });

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
        alert('Esta tarea aún no tiene un QR habilitado. Solicita al cliente su creación.');
        return;
      }
      const url = `/t/${token.token}`;
      window.open(url, '_blank', 'noopener');
    },
    [tokenMap]
  );

  const [estadoObjetivo, setEstadoObjetivo] = useState<Record<string, Tarea['estado']>>({});

  useEffect(() => {
    setEstadoObjetivo((prev) => {
      const next: Record<string, Tarea['estado']> = {};
      tareas.forEach((t) => {
        next[t.id] = prev[t.id] ?? t.estado;
      });
      return next;
    });
  }, [tareas]);

  function showSuccess(message: string) {
    setFormSuccess(message);
    setFormError(null);
    setTimeout(() => setFormSuccess(null), 4000);
  }

  function showError(err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
    setFormError(message);
    setFormSuccess(null);
  }

  async function handleCrearTarea(values: z.infer<typeof nuevaTareaSchema>) {
    setPendingAction(true);
    try {
      const response = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, estado: 'pendiente' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo crear la tarea');
      }
      showSuccess('Tarea creada correctamente');
      tareaForm.reset({ obra_id: values.obra_id, tipo: '', descripcion: '' });
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPendingAction(false);
    }
  }

  async function handleInvitar(values: z.infer<typeof nuevoInviteSchema>) {
    setPendingAction(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo enviar la invitación');
      }
      inviteForm.reset({ nombre: '', email: '' });
      showSuccess('Invitación enviada');
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPendingAction(false);
    }
  }

  async function handleActualizarEstado(tarea: Tarea, nuevoEstado: Tarea['estado']) {
    if (nuevoEstado === tarea.estado) {
      return;
    }
    setUpdatingId(tarea.id);
    try {
      const response = await fetch(`/api/tareas/${tarea.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevo_estado: nuevoEstado,
          notas: '',
          checklist: [],
          has_nc: false,
          actor: {
            name: socioSeleccionado?.nombre ?? 'Socio constructor',
            role: 'Socio',
            method: 'login',
          },
          media: [],
          motivo:
            tarea.estado === 'finalizado' && nuevoEstado === 'en_ejecucion'
              ? 'Ajuste realizado por el socio'
              : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo actualizar el estado');
      }
      showSuccess('Estado actualizado');
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="rounded border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Panel del socio constructor</h1>
            <p className="text-sm text-muted-foreground">
              Visualiza tus tareas asignadas, tu equipo y el historial de actas.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div>
              <label className="text-xs uppercase text-muted-foreground">
                Seleccionar socio
              </label>
              <select
                className="mt-1 w-64 rounded border px-3 py-2"
                value={socioId}
                onChange={(event) => setSocioId(event.target.value)}
              >
                {sociosOrdenados.map((socio) => (
                  <option key={socio.id} value={socio.id}>
                    {socio.nombre}
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

      {(formError || formSuccess) && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            formSuccess
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {formSuccess ?? formError}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Crear nueva tarea</h2>
          {obras.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no existen obras en tu organización.
            </p>
          ) : (
            <form className="space-y-3" onSubmit={tareaForm.handleSubmit(handleCrearTarea)}>
              <div>
                <label className="block text-sm font-medium">Obra</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  {...tareaForm.register('obra_id')}
                >
                  <option value="">Selecciona una obra</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nombre}
                    </option>
                  ))}
                </select>
                {tareaForm.formState.errors.obra_id && (
                  <p className="mt-1 text-xs text-destructive">{tareaForm.formState.errors.obra_id.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Ej. Terminaciones"
                  {...tareaForm.register('tipo')}
                />
                {tareaForm.formState.errors.tipo && (
                  <p className="mt-1 text-xs text-destructive">{tareaForm.formState.errors.tipo.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  rows={3}
                  placeholder="Describe la actividad"
                  {...tareaForm.register('descripcion')}
                />
                {tareaForm.formState.errors.descripcion && (
                  <p className="mt-1 text-xs text-destructive">{tareaForm.formState.errors.descripcion.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={pendingAction}
              >
                {pendingAction ? 'Guardando…' : 'Agregar tarea'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4 rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Invitar socio constructor</h2>
          <form className="space-y-3" onSubmit={inviteForm.handleSubmit(handleInvitar)}>
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Nombre y apellido"
                {...inviteForm.register('nombre')}
              />
              {inviteForm.formState.errors.nombre && (
                <p className="mt-1 text-xs text-destructive">{inviteForm.formState.errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Correo</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="correo@socio.com"
                {...inviteForm.register('email')}
              />
              {inviteForm.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{inviteForm.formState.errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={pendingAction}
            >
              {pendingAction ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </form>

          {invites.length > 0 && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <h3 className="font-medium text-foreground">Invitaciones recientes</h3>
              <ul className="space-y-1">
                {invites.map((invite) => (
                  <li key={invite.id} className="rounded border border-dashed px-3 py-2 text-xs">
                    {invite.nombre} ({invite.email}) · Socio constructor · {invite.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

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
                <p className="text-xs text-muted-foreground">Socio constructor</p>
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
            Puedes usar el acceso QR o solicitarlo al cliente.
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <select
                      className="rounded border px-2 py-1"
                      value={estadoObjetivo[tarea.id] ?? tarea.estado}
                      onChange={(event) =>
                        setEstadoObjetivo((prev) => ({
                          ...prev,
                          [tarea.id]: event.target.value as Tarea['estado'],
                        }))
                      }
                    >
                      {estadosOrdenados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estadoLabels[estado]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-border px-3 py-1 text-xs font-medium text-foreground disabled:opacity-60"
                      onClick={() =>
                        handleActualizarEstado(
                          tarea,
                          estadoObjetivo[tarea.id] ?? tarea.estado
                        )
                      }
                      disabled={updatingId === tarea.id}
                    >
                      {updatingId === tarea.id ? 'Actualizando…' : 'Aplicar'}
                    </button>
                  </div>
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

