'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { visitStatusSchema } from '@/lib/fsm';

const orgSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(80),
});

const obraSchema = z.object({
  nombre: z.string().min(2),
  localizacion: z.string().optional(),
  cliente: z.string().optional(),
});

const tareaSchema = z.object({
  obra_id: z.string().uuid('Selecciona una obra'),
  tipo: z.string().min(2),
  descripcion: z.string().min(5),
  estado: visitStatusSchema.default('pendiente'),
});

const inviteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.string().min(1),
});

type Org = {
  id: string;
  name: string;
  onboarding_completed: boolean;
};

type Obra = {
  id: string;
  nombre: string;
  localizacion: string | null;
  cliente: string | null;
};

type Tarea = {
  id: string;
  obra_id: string;
  tipo: string;
  descripcion: string;
  estado: z.infer<typeof visitStatusSchema>;
};

type Invite = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  status: string;
};

type OnboardingClientProps = {
  org: Org;
  initialObras: Obra[];
  initialSocios: Array<{ id: string; nombre: string }>;
  initialTareas: Array<Tarea & { obra?: { org_id: string | null } | null }>;
  initialInvites: Invite[];
};

const steps = [
  { id: 0, label: 'Organización' },
  { id: 1, label: 'Primera obra' },
  { id: 2, label: 'Tareas iniciales' },
  { id: 3, label: 'Invitar socios' },
];

export default function OnboardingClient({
  org,
  initialObras,
  initialTareas,
  initialInvites,
}: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(() => {
    if (initialInvites.length > 0) return 3;
    if (initialTareas.length > 0) return 2;
    if (initialObras.length > 0) return 1;
    return 0;
  });
  const [saving, setSaving] = useState(false);
  const [obras, setObras] = useState<Obra[]>(initialObras);
  const [tareas, setTareas] = useState<Tarea[]>(
    initialTareas.map(({ obra, ...rest }) => rest)
  );
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [error, setError] = useState<string | null>(null);

  const orgForm = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: org.name },
  });

  const obraForm = useForm<z.infer<typeof obraSchema>>({
    resolver: zodResolver(obraSchema),
    defaultValues: { nombre: '', localizacion: '', cliente: '' },
  });

  const tareaForm = useForm<z.infer<typeof tareaSchema>>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      obra_id: initialObras[0]?.id ?? '',
      tipo: '',
      descripcion: '',
      estado: 'pendiente',
    },
  });

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { nombre: '', email: '', rol: 'constructor' },
  });

  const obraOptions = useMemo(() => obras.map((obra) => ({ value: obra.id, label: obra.nombre })), [obras]);

  async function handleOrgSubmit(values: z.infer<typeof orgSchema>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/orgs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo guardar');
      }
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function handleObraSubmit(values: z.infer<typeof obraSchema>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo crear la obra');
      }
      const data = await response.json();
      const newObra: Obra = {
        id: data.id,
        nombre: values.nombre,
        localizacion: values.localizacion ?? null,
        cliente: values.cliente ?? null,
      };
      setObras((prev) => [...prev, newObra]);
      tareaForm.setValue('obra_id', newObra.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function handleTareaSubmit(values: z.infer<typeof tareaSchema>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo crear la tarea');
      }
      const data = await response.json();
      const newTarea: Tarea = {
        id: data.id,
        obra_id: values.obra_id,
        tipo: values.tipo,
        descripcion: values.descripcion,
        estado: values.estado,
      };
      setTareas((prev) => [...prev, newTarea]);
      tareaForm.reset({
        obra_id: values.obra_id,
        tipo: '',
        descripcion: '',
        estado: 'pendiente',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteSubmit(values: z.infer<typeof inviteSchema>) {
    setSaving(true);
    setError(null);
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
      const data = await response.json();
      const newInvite: Invite = {
        id: data.inviteId,
        email: values.email,
        nombre: values.nombre,
        rol: values.rol,
        status: 'pending',
      };
      setInvites((prev) => [...prev, newInvite]);
      inviteForm.reset({ nombre: '', email: '', rol: 'constructor' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function finalizeOnboarding() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/orgs/complete-onboarding', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Error' }));
        throw new Error(data.message ?? 'No se pudo completar el onboarding');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Bienvenido a Grows</h1>
        <p className="text-sm text-muted-foreground">
          Configura tu organización, crea la primera obra y tareas, e invita a tus socios constructores.
        </p>
      </header>

      <ol className="flex items-center gap-3 text-xs font-medium">
        {steps.map(({ id, label }) => (
          <li key={id} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border bg-background ${
                step === id ? 'border-primary text-primary' : step > id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
              }`}
            >
              {id + 1}
            </span>
            <span className={step === id ? 'text-primary' : 'text-muted-foreground'}>{label}</span>
            {id < steps.length - 1 && <span className="ml-3 h-px w-8 bg-border" />}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 0 && (
        <section className="space-y-4 rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">1. Personaliza tu organización</h2>
          <p className="text-sm text-muted-foreground">
            Asigna el nombre con el que se identificarán tus obras y tu equipo.
          </p>
          <form
            onSubmit={orgForm.handleSubmit(handleOrgSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium">Nombre comercial</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Ej. Constructora Demo"
                {...orgForm.register('name')}
              />
              {orgForm.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{orgForm.formState.errors.name.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Continuar con obras'}
            </button>
          </form>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4 rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">2. Crea tu primera obra</h2>
          <p className="text-sm text-muted-foreground">
            Esta obra servirá como base para asignar tareas y socios constructores.
          </p>
          <form
            onSubmit={obraForm.handleSubmit(handleObraSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Nombre de la obra</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Obra Principal"
                {...obraForm.register('nombre')}
              />
              {obraForm.formState.errors.nombre && (
                <p className="mt-1 text-xs text-destructive">{obraForm.formState.errors.nombre.message}</p>
              )}
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
              <label className="block text-sm font-medium">Cliente</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Cliente interno"
                {...obraForm.register('cliente')}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar obra'}
              </button>
              {obras.length > 0 && (
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => setStep(2)}
                >
                  Continuar a tareas
                </button>
              )}
            </div>
          </form>
          {obras.length > 0 && (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {obras.map((obra) => (
                <li key={obra.id} className="rounded border border-dashed px-3 py-2">
                  {obra.nombre} · {obra.localizacion ?? 'Sin localización'}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">3. Registra tareas iniciales</h2>
          <p className="text-sm text-muted-foreground">
            Agrega tareas para planificar el avance de la obra.
          </p>
          {obras.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero necesitas crear una obra.
            </p>
          ) : (
            <form
              onSubmit={tareaForm.handleSubmit(handleTareaSubmit)}
              className="grid gap-4"
            >
              <div>
                <label className="block text-sm font-medium">Obra</label>
                <select
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  {...tareaForm.register('obra_id')}
                >
                  <option value="">Selecciona una obra</option>
                  {obraOptions.map((obra) => (
                    <option key={obra.value} value={obra.value}>
                      {obra.label}
                    </option>
                  ))}
                </select>
                {tareaForm.formState.errors.obra_id && (
                  <p className="mt-1 text-xs text-destructive">{tareaForm.formState.errors.obra_id.message}</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Tipo</label>
                  <input
                    className="mt-2 w-full rounded border border-border px-3 py-2"
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
                    className="mt-2 w-full rounded border border-border px-3 py-2"
                    rows={3}
                    placeholder="Describe la tarea"
                    {...tareaForm.register('descripcion')}
                  />
                  {tareaForm.formState.errors.descripcion && (
                    <p className="mt-1 text-xs text-destructive">{tareaForm.formState.errors.descripcion.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Estado inicial</label>
                <select
                  className="mt-2 w-full rounded border border-border px-3 py-2"
                  {...tareaForm.register('estado')}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_ejecucion">En ejecución</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="validado">Validado</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Agregar tarea'}
              </button>
            </form>
          )}
          {tareas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Tareas registradas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tareas.map((tarea) => (
                  <li key={tarea.id} className="rounded border border-dashed px-3 py-2">
                    <p className="font-medium text-foreground">{tarea.tipo}</p>
                    <p>{tarea.descripcion}</p>
                    <p className="text-xs">Estado: {tarea.estado}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                onClick={() => setStep(3)}
                disabled={tareas.length === 0}
              >
                Continuar a invitaciones
              </button>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">4. Invita a tus socios constructores</h2>
          <p className="text-sm text-muted-foreground">
            Enviaremos un email con enlace mágico para que puedan acceder y gestionar sus tareas.
          </p>
          <form
            onSubmit={inviteForm.handleSubmit(handleInviteSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="Ana Pérez"
                {...inviteForm.register('nombre')}
              />
              {inviteForm.formState.errors.nombre && (
                <p className="mt-1 text-xs text-destructive">{inviteForm.formState.errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Correo</label>
              <input
                className="mt-2 w-full rounded border border-border px-3 py-2"
                placeholder="socio@empresa.com"
                {...inviteForm.register('email')}
              />
              {inviteForm.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{inviteForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Rol</label>
              <select
                className="mt-2 w-full rounded border border-border px-3 py-2"
                {...inviteForm.register('rol')}
              >
                <option value="constructor">Socio constructor</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Enviando…' : 'Enviar invitación'}
              </button>
            </div>
          </form>

          {invites.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Invitaciones enviadas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {invites.map((invite) => (
                  <li key={invite.id} className="rounded border border-dashed px-3 py-2">
                    {invite.nombre} ({invite.email}) · {invite.rol} · {invite.status}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            onClick={finalizeOnboarding}
            disabled={saving || invites.length === 0}
          >
            {saving ? 'Finalizando…' : 'Finalizar onboarding'}
          </button>
        </section>
      )}
    </div>
  );
}
