'use client';

import { useEffect, useState } from 'react';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from '@/components/obra-check/ui';

type TaskItem = { nombre: string; duracionDias: number | null };

type TaskResponse = {
  included: boolean;
  dias: string;
  precio: string;
  inicio: string;
  fin: string;
};

type FormData = {
  tipo: string;
  alreadyResponded: boolean;
  bloqueNombre: string;
  rubro: string | null;
  empresa: string | null;
  tipoObra: string | null;
  tareas: TaskItem[];
};

type ContactMode = 'telefono' | 'email';

export function ContractorFormPage({ token }: { token: string }) {
  const [data, setData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmWa, setConfirmWa] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contactMode, setContactMode] = useState<ContactMode>('telefono');
  const [contacto, setContacto] = useState('');
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [aceptaContacto, setAceptaContacto] = useState(true);

  useEffect(() => {
    fetch(`/api/obra-check/form/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error ?? 'No se pudo cargar');
        return j.data as FormData;
      })
      .then((d) => {
        setData(d);
        setTaskResponses(
          d.tareas.map((t) => ({
            included: true,
            dias: t.duracionDias != null ? String(t.duracionDias) : '',
            precio: '',
            inicio: '',
            fin: '',
          })),
        );
        if (d.alreadyResponded) setDone(true);
      })
      .catch((e) => setError((e as Error).message));
  }, [token]);

  function updateTask(idx: number, patch: Partial<TaskResponse>) {
    setTaskResponses((curr) => curr.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  const isPedido = data?.tipo === 'pedido_presupuesto';
  const contactOk =
    contactMode === 'telefono'
      ? contacto.replace(/[^\d+]/g, '').length >= 6
      : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contacto);

  const tasksOk = isPedido
    ? taskResponses.some((r) => r.included)
    : taskResponses.some((r) => r.included && r.inicio && r.fin);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactOk || !tasksOk) return;
    setBusy(true);
    setError(null);
    try {
      const detalle = taskResponses.map((r, i) => ({
        nombre: data!.tareas[i].nombre,
        included: r.included,
        ...(isPedido
          ? { dias: r.dias ? Number(r.dias) : null, precio: r.precio ? Number(r.precio) : null }
          : { inicio: r.inicio || null, fin: r.fin || null }),
      }));

      const res = await fetch(`/api/obra-check/form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: contactMode === 'telefono' ? contacto.trim() : '',
          email: contactMode === 'email' ? contacto.trim() : '',
          detalle,
          aceptaContacto,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error ?? 'Error al enviar');
      setConfirmWa(j.data.confirmWaLink ?? null);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-semibold" style={{ color: BRAND.error }}>
          {error}
        </p>
        <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
          Pedile al estudio un link nuevo.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm" style={{ color: BRAND.muted }}>
        Cargando…
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <OCCard>
          <h1 className="text-xl font-bold" style={{ color: BRAND.blue }}>
            {isPedido ? 'Presupuesto enviado ✓' : 'Disponibilidad registrada ✓'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
            El estudio ya tiene tus datos y puede contactarte. Gracias.
          </p>
          {confirmWa && (
            <div className="mt-4">
              <OCButton onClick={() => window.open(confirmWa, '_blank', 'noopener')}>
                Guardar confirmación en WhatsApp
              </OCButton>
            </div>
          )}
        </OCCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND.blueLight }}>
          {data.empresa ? data.empresa : 'Pedido de obra'}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.blue }}>
          {isPedido ? 'Pedido de presupuesto' : 'Orden de trabajo'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: BRAND.muted }}>
          {data.bloqueNombre}
          {data.tipoObra ? ` · ${data.tipoObra}` : ''}
        </p>
      </div>

      <OCCard className="mb-4">
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          {isPedido ? 'Marcá las tareas que presupuestás' : 'Marcá las tareas que podés hacer y cuándo'}
        </p>
        <div className="space-y-3">
          {data.tareas.map((t, i) => {
            const r = taskResponses[i];
            if (!r) return null;
            return (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{
                  background: r.included ? '#FFFDF5' : BRAND.gray,
                  border: `1px solid ${r.included ? BRAND.gold : BRAND.border}`,
                }}
              >
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={r.included}
                    onChange={(e) => updateTask(i, { included: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                      {t.nombre}
                    </p>
                    {t.duracionDias != null && (
                      <p className="text-xs" style={{ color: BRAND.muted }}>
                        Estimado: {t.duracionDias} día(s)
                      </p>
                    )}
                  </div>
                </label>
                {r.included && isPedido && (
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-6">
                    <OCField label="Días">
                      <input
                        style={inputStyle}
                        inputMode="numeric"
                        value={r.dias}
                        onChange={(e) => updateTask(i, { dias: e.target.value })}
                        placeholder="Ej: 5"
                      />
                    </OCField>
                    <OCField label="Precio ($)">
                      <input
                        style={inputStyle}
                        inputMode="decimal"
                        value={r.precio}
                        onChange={(e) => updateTask(i, { precio: e.target.value })}
                        placeholder="Ej: 150000"
                      />
                    </OCField>
                  </div>
                )}
                {r.included && !isPedido && (
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-6">
                    <OCField label="Inicio">
                      <input
                        style={inputStyle}
                        type="date"
                        value={r.inicio}
                        onChange={(e) => updateTask(i, { inicio: e.target.value })}
                      />
                    </OCField>
                    <OCField label="Fin">
                      <input
                        style={inputStyle}
                        type="date"
                        value={r.fin}
                        onChange={(e) => updateTask(i, { fin: e.target.value })}
                        min={r.inicio || undefined}
                      />
                    </OCField>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </OCCard>

      <OCCard>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          ¿Cómo te contactamos?
        </p>
        <p className="mb-3 text-xs" style={{ color: BRAND.muted }}>
          Solo necesitamos un dato para que el estudio te responda.
        </p>

        <div className="mb-3 flex gap-2">
          {(['telefono', 'email'] as ContactMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setContactMode(mode);
                setContacto('');
              }}
              className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{
                background: contactMode === mode ? BRAND.blue : '#fff',
                color: contactMode === mode ? '#fff' : BRAND.muted,
                border: `1px solid ${contactMode === mode ? BRAND.blue : BRAND.border}`,
              }}
            >
              {mode === 'telefono' ? 'WhatsApp / Teléfono' : 'Email'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {contactMode === 'telefono' ? (
            <OCField label="WhatsApp / Teléfono" hint="Con código de país (ej. 54911…)">
              <input
                style={inputStyle}
                required
                inputMode="tel"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="54911…"
              />
            </OCField>
          ) : (
            <OCField label="Email">
              <input
                style={inputStyle}
                type="email"
                required
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="vos@mail.com"
              />
            </OCField>
          )}

          <label className="flex items-start gap-2 text-xs" style={{ color: BRAND.muted }}>
            <input
              type="checkbox"
              checked={aceptaContacto}
              onChange={(e) => setAceptaContacto(e.target.checked)}
              className="mt-0.5"
            />
            Acepto que el estudio me contacte sobre este trabajo.
          </label>

          {error && (
            <p className="text-sm" style={{ color: BRAND.error }}>
              {error}
            </p>
          )}

          <OCButton type="submit" loading={busy} disabled={!contactOk || !tasksOk} className="w-full">
            {isPedido ? 'Enviar presupuesto' : 'Confirmar disponibilidad'}
          </OCButton>
        </form>
      </OCCard>

      <p className="mt-6 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Formulario de Grows Obra Check
      </p>
    </div>
  );
}
