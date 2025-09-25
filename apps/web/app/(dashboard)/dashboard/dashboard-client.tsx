'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { z } from 'zod';

import { canTransition, visitStatusSchema } from '@/lib/fsm';

const obraSchema = z.object({
  nombre: z.string().min(2),
  localizacion: z.string().optional(),
  cliente: z.string().optional(),
});

type ObraFormValues = z.infer<typeof obraSchema>;

const socioSchema = z.object({
  nombre: z.string().min(2),
  contacto: z.string().optional(),
  rol: z.enum(['funcional', 'autonomo']).default('funcional'),
});

type SocioFormValues = z.infer<typeof socioSchema>;

const tareaSchema = z.object({
  obra_id: z.string().uuid({ message: 'Selecciona una obra' }),
  tipo: z.string().min(2),
  descripcion: z.string().min(5),
  referente_id: z.string().uuid().optional(),
  socio_ids: z.array(z.string().uuid()).default([]),
  precedencias: z.array(z.string().uuid()).default([]),
});

type TareaFormValues = z.infer<typeof tareaSchema>;

type VisitStatus = z.infer<typeof visitStatusSchema>;

type DashboardClientProps = {
  org: { id: string; name: string; owner_user_id: string | null };
  obras: Array<{
    id: string;
    org_id: string;
    nombre: string;
    cliente: string | null;
    localizacion: string | null;
  }>;
  socios: Array<{
    id: string;
    org_id: string;
    nombre: string;
    contacto: string | null;
    rol: 'funcional' | 'autonomo';
    status: string;
  }>;
  tareas: Array<{
    id: string;
    obra_id: string;
    tipo: string;
    descripcion: string;
    estado: VisitStatus;
    referente_id: string | null;
    socio_ids: string[];
    obra: { id: string; nombre: string | null } | null;
    eventos: Array<{
      id: string;
      nuevo_estado: VisitStatus;
      actor_name: string;
      created_at: string;
      notas: string;
      pdf_path: string | null;
    }>;
  }>;
  invites: Array<{
    id: string;
    email: string;
    nombre: string;
    rol: 'funcional' | 'autonomo';
    status: string;
    created_at: string;
  }>;
};

function useServerActionFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<'success' | 'error'>('success');

  function pushMessage(text: string, kind: 'success' | 'error') {
    setMessage(text);
    setVariant(kind);
    setTimeout(() => setMessage(null), 4000);
  }

  return { message, variant, pushMessage } as const;
}

const inviteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.enum(['funcional', 'autonomo']).default('funcional'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function DashboardClient({ org, obras, socios, tareas, invites }: DashboardClientProps) {
  const router = useRouter();
  const feedback = useServerActionFeedback();
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const obraForm = useForm<ObraFormValues>({
    resolver: zodResolver(obraSchema),
    defaultValues: { nombre: '' },
  });

  const socioForm = useForm<SocioFormValues>({
    resolver: zodResolver(socioSchema),
    defaultValues: { nombre: '', rol: 'funcional' },
  });

  const tareaForm = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      obra_id: obras[0]?.id ?? '',
      socio_ids: [],
      precedencias: [],
    },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { nombre: '', email: '', rol: 'funcional' },
  });

  async function handleSubmit(
    url: string,
    values: Record<string, unknown>,
    reset?: () => void
  ) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      feedback.pushMessage('Guardado correctamente', 'success');
      reset?.();
      router.refresh();
    } else {
      const error = await response.json().catch(() => ({ message: 'Error' }));
      feedback.pushMessage(error.message ?? 'No se pudo guardar', 'error');
    }
  }

  async function handleRevoke(inviteId: string) {
    setProcessingInviteId(inviteId);
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        feedback.pushMessage('Invitación revocada', 'success');
        router.refresh();
      } else {
        const error = await response.json().catch(() => ({ message: 'Error' }));
        feedback.pushMessage(error.message ?? 'No se pudo revocar la invitación', 'error');
      }
    } finally {
      setProcessingInviteId(null);
    }
  }

  async function handleRemoveLeader(inviteId: string, socioId: string) {
    setProcessingInviteId(inviteId);
    try {
      const response = await fetch(`/api/socios/${socioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        feedback.pushMessage('Líder eliminado', 'success');
        router.refresh();
      } else {
        const error = await response.json().catch(() => ({ message: 'Error' }));
        feedback.pushMessage(error.message ?? 'No se pudo eliminar el líder', 'error');
      }
    } finally {
      setProcessingInviteId(null);
    }
  }

  const tareasPorObra = useMemo(() => {
    return tareas.reduce<Record<string, DashboardClientProps['tareas']>>((acc, tarea) => {
      const key = tarea.obra_id;
      acc[key] = acc[key] ? [...acc[key], tarea] : [tarea];
      return acc;
    }, {});
  }, [tareas]);

  const estadoOrden: VisitStatus[] = ['pendiente', 'en_ejecucion', 'finalizado', 'validado'];

  const totalTareas = tareas.length;
  const tareasPorEstado = estadoOrden.map((estado) => ({
    estado,
    total: tareas.filter((t) => t.estado === estado).length,
  }));

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-muted/10">
      <aside className="sticky top-[80px] hidden h-[calc(100vh-80px)] w-72 flex-shrink-0 flex-col gap-6 border-r border-border bg-card/70 p-6 backdrop-blur lg:flex">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Cliente técnico</p>
          <h2 className="text-lg font-semibold">{org.name}</h2>
        </div>
        <nav className="flex flex-col gap-3 text-sm">
          <a className="text-muted-foreground transition hover:text-foreground" href="#resumen">
            Resumen
          </a>
          <a className="text-muted-foreground transition hover:text-foreground" href="#crear-obra">
            Crear obra
          </a>
          <a className="text-muted-foreground transition hover:text-foreground" href="#crear-socio">
            Crear socio
          </a>
          <a className="text-muted-foreground transition hover:text-foreground" href="#invitar-lider">
            Invitar líder
          </a>
          <a className="text-muted-foreground transition hover:text-foreground" href="#crear-tarea">
            Crear tarea
          </a>
          <a className="text-muted-foreground transition hover:text-foreground" href="#tareas">
            Tareas y actas
          </a>
        </nav>
        {feedback.message && (
          <p
            className={
              feedback.variant === 'success' ? 'text-sm text-green-600' : 'text-sm text-red-600'
            }
          >
            {feedback.message}
          </p>
        )}
      </aside>

      <main className="flex-1 space-y-12 px-6 py-8 lg:px-10">
        <section id="resumen" className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">Panel del cliente</h1>
            <p className="text-sm text-muted-foreground">
              Administra tu obra, registra líderes de cuadrilla y controla el avance desde un solo lugar.
            </p>
          </header>
          {feedback.message && (
            <p
              className={
                feedback.variant === 'success'
                  ? 'rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 lg:hidden'
                  : 'rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:hidden'
              }
            >
              {feedback.message}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">Obras activas</p>
              <p className="mt-2 text-2xl font-semibold">{obras.length}</p>
            </article>
            <article className="rounded border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">Socios registrados</p>
              <p className="mt-2 text-2xl font-semibold">{socios.length}</p>
            </article>
            <article className="rounded border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">Tareas totales</p>
              <p className="mt-2 text-2xl font-semibold">{totalTareas}</p>
            </article>
            {tareasPorEstado.map(({ estado, total }) => (
              <article key={estado} className="rounded border border-border bg-card p-4 shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">{estado}</p>
                <p className="mt-2 text-xl font-semibold">{total}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="crear-obra" className="rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Crear obra</h2>
          <p className="text-sm text-muted-foreground">
            Cada obra agrupa las tareas y evidencia asociada a un proyecto específico.
          </p>
          <form
            onSubmit={obraForm.handleSubmit((values) =>
              handleSubmit('/api/obras', values, () => obraForm.reset())
            )}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Obra Demo"
                {...obraForm.register('nombre')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Localización</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Dirección"
                {...obraForm.register('localizacion')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cliente final</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Cliente X"
                {...obraForm.register('cliente')}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Guardar obra
              </button>
            </div>
          </form>
        </section>

        <section id="crear-socio" className="rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Crear socio</h2>
          <p className="text-sm text-muted-foreground">
            Registra líderes funcionales o autónomos para asignarlos a las tareas de la obra.
          </p>
          <form
            onSubmit={socioForm.handleSubmit((values) =>
              handleSubmit('/api/socios', values, () =>
                socioForm.reset({ nombre: '', contacto: '', rol: 'funcional' })
              )
            )}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Juan Pérez"
                {...socioForm.register('nombre')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contacto</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Teléfono / email"
                {...socioForm.register('contacto')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Rol</label>
              <select
                className="mt-2 w-full rounded border border-border px-3 py-2"
                {...socioForm.register('rol')}
              >
                <option value="funcional">Líder funcional</option>
                <option value="autonomo">Líder autónomo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Guardar socio
              </button>
            </div>
          </form>
        </section>

        <section id="invitar-lider" className="rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Invitar líder de cuadrilla</h2>
          <p className="text-sm text-muted-foreground">
            Envía un enlace mágico para que nuevos líderes accedan al panel público y reporten tareas.
          </p>
          <form
            onSubmit={inviteForm.handleSubmit((values) =>
              handleSubmit('/api/invites', values, () => inviteForm.reset({ nombre: '', email: '', rol: 'funcional' }))
            )}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Ana Ruiz"
                {...inviteForm.register('nombre')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Correo</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="lider@empresa.com"
                {...inviteForm.register('email')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Rol</label>
              <select
                className="mt-2 w-full rounded border border-border px-3 py-2"
                {...inviteForm.register('rol')}
              >
                <option value="funcional">Líder funcional (microcuadrilla)</option>
                <option value="autonomo">Líder autónomo (cuadrilla propia)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                disabled={inviteForm.formState.isSubmitting}
              >
                {inviteForm.formState.isSubmitting ? 'Enviando…' : 'Enviar invitación'}
              </button>
            </div>
          </form>
          {invites.length > 0 && (
            <div className="mt-4 rounded border border-dashed px-4 py-3">
              <p className="text-sm font-medium">Invitaciones recientes</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {invites.map((invite) => {
                  const socioAsignado = socios.find(
                    (socio) => socio.contacto === invite.email && invite.status === 'accepted'
                  );

                  const showRevoke = invite.status === 'pending';
                  const showRemoveLeader = Boolean(socioAsignado);

                  return (
                    <li
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2"
                    >
                      <div>
                      <p className="font-medium text-foreground">{invite.nombre}</p>
                      <p>{invite.email}</p>
                      <p className="text-xs">
                        {invite.rol} · {invite.status} ·{' '}
                        {new Date(invite.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {showRevoke && (
                        <button
                          type="button"
                          className="rounded border border-destructive px-3 py-1 text-xs font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-60"
                          onClick={() => handleRevoke(invite.id)}
                          disabled={processingInviteId === invite.id}
                        >
                          {processingInviteId === invite.id ? 'Procesando…' : 'Revocar'}
                        </button>
                      )}
                      {showRemoveLeader && socioAsignado && (
                        <button
                          type="button"
                          className="rounded border border-destructive px-3 py-1 text-xs font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-60"
                          onClick={() => handleRemoveLeader(invite.id, socioAsignado.id)}
                          disabled={processingInviteId === invite.id}
                        >
                          {processingInviteId === invite.id ? 'Procesando…' : 'Eliminar líder'}
                        </button>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section id="crear-tarea" className="rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Crear tarea</h2>
          <p className="text-sm text-muted-foreground">
            Define el trabajo asignado y vincúlalo a la obra y líderes correspondientes.
          </p>
          {obras.length === 0 && (
            <p className="mt-3 rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              Primero crea una obra para poder registrar tareas.
            </p>
          )}
          <form
            onSubmit={tareaForm.handleSubmit((values) =>
              handleSubmit('/api/tareas', values, () =>
                tareaForm.reset({
                  obra_id: obras[0]?.id ?? '',
                  tipo: '',
                  descripcion: '',
                  socio_ids: [],
                  precedencias: [],
                })
              )
            )}
            className="mt-4 grid gap-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Obra</label>
                <select
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  {...tareaForm.register('obra_id')}
                  disabled={obras.length === 0}
                >
                  <option value="">Selecciona una obra</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <input
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  placeholder="Terminaciones"
                  {...tareaForm.register('tipo')}
                  disabled={obras.length === 0}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Descripción</label>
              <textarea
                className="mt-2 w-full rounded border border-border px-3 py-2"
                rows={3}
                placeholder="Detalle de la tarea"
                {...tareaForm.register('descripcion')}
                disabled={obras.length === 0}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Referente</label>
                <select
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  {...tareaForm.register('referente_id')}
                  disabled={obras.length === 0}
                >
                  <option value="">Sin referente</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>
                      {socio.nombre} ({socio.rol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Socios asignados</label>
                <select
                  multiple
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  value={tareaForm.watch('socio_ids')}
                  disabled={obras.length === 0}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions).map(
                      (option) => option.value
                    );
                    tareaForm.setValue('socio_ids', values);
                  }}
                >
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>
                      {socio.nombre} ({socio.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Precedencias</label>
              <select
                multiple
                className="mt-2 w-full rounded border border-border px-3 py-2"
                value={tareaForm.watch('precedencias')}
                disabled={obras.length === 0}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map(
                    (option) => option.value
                  );
                  tareaForm.setValue('precedencias', values);
                }}
              >
                {tareas.map((tarea) => (
                  <option key={tarea.id} value={tarea.id}>
                    {tarea.tipo} ({tarea.estado})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={obras.length === 0}
              >
                Guardar tarea
              </button>
            </div>
          </form>
        </section>

        <section id="tareas" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Tareas y actas</h2>
            <p className="text-sm text-muted-foreground">
              Cada transición genera un acta inmutable con la evidencia asociada a la tarea.
            </p>
          </div>
          {obras.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Crea una obra para comenzar a planificar tareas.
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {obras.map((obra) => {
              const tareasDeObra = tareasPorObra[obra.id] ?? [];
              return (
                <article key={obra.id} className="space-y-3 rounded border border-border bg-card p-4 shadow-sm">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{obra.nombre}</h3>
                      <p className="text-xs text-muted-foreground">
                        {obra.localizacion ?? 'Locación no declarada'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {tareasDeObra.length} tareas
                    </span>
                  </header>
                  <div className="space-y-3">
                    {tareasDeObra.map((tarea) => {
                      const timeline = tarea.eventos
                        .slice()
                        .sort(
                          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                      const proximoEstadoIndex = Math.min(
                        estadoOrden.indexOf(tarea.estado) + 1,
                        estadoOrden.length - 1
                      );
                      const proximoEstado = estadoOrden[proximoEstadoIndex];

                      return (
                        <div key={tarea.id} className="rounded border border-dashed px-3 py-2">
                          <header className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{tarea.tipo}</p>
                              <p className="text-xs text-muted-foreground">{tarea.descripcion}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>Estado: {tarea.estado}</p>
                              {canTransition(tarea.estado, proximoEstado) && (
                                <p>Próximo: {proximoEstado}</p>
                              )}
                            </div>
                          </header>
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {timeline.length === 0 && <li>Sin eventos aún.</li>}
                            {timeline.map((evento) => (
                              <li key={evento.id}>
                                {format(new Date(evento.created_at), 'dd/MM HH:mm')} ·{' '}
                                {evento.nuevo_estado} · {evento.actor_name}{' '}
                                {evento.pdf_path && (
                                  <a className="text-primary" href={`/actas/${evento.id}/pdf`}>
                                    PDF
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    {tareasDeObra.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sin tareas registradas todavía.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
