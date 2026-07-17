'use client';

import { useEffect, useMemo, useState } from 'react';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from '@/components/obra-check/ui';

type TaskItem = {
  id?: string;
  nombre: string;
  duracionDias: number | null;
  unidad: string | null;
  cantidad: number | null;
};

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
  planos: Array<{ id: string; nombre: string; url: string; mime: string }>;
  tareas: TaskItem[];
};

type ContactMode = 'telefono' | 'email';

function formatUnidad(unidad: string | null | undefined): string {
  const u = (unidad || 'm2').toLowerCase();
  if (u === 'm2' || u === 'm²') return 'm²';
  if (u === 'ml') return 'ml';
  if (u === 'gl') return 'gl';
  if (u === 'un' || u === 'u') return 'un';
  return u;
}

export function ContractorFormPage({ token }: { token: string }) {
  const [data, setData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
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

  const totalPrecio = useMemo(() => {
    return taskResponses.reduce((s, r, i) => {
      if (!r.included || !data?.tareas[i]) return s;
      const n = Number(r.precio);
      return s + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [taskResponses, data]);

  const contactOk =
    contactMode === 'telefono'
      ? contacto.replace(/[^\d+]/g, '').length >= 6
      : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contacto);

  const tasksOk = isPedido
    ? taskResponses.some((r) => r.included && r.dias.trim() !== '' && r.precio.trim() !== '')
    : taskResponses.some((r) => r.included && r.inicio && r.fin);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactOk || !tasksOk) return;
    setBusy(true);
    setError(null);
    try {
      const detalle = taskResponses.map((r, i) => {
        const t = data!.tareas[i]!;
        return {
          taskId: t.id ?? null,
          nombre: t.nombre,
          included: r.included,
          unidad: t.unidad ?? 'm2',
          cantidad: t.cantidad,
          ...(isPedido
            ? { dias: r.dias ? Number(r.dias) : null, precio: r.precio ? Number(r.precio) : null }
            : { inicio: r.inicio || null, fin: r.fin || null }),
        };
      });

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
            {isPedido ? 'Presupuesto cargado ✓' : 'Disponibilidad registrada ✓'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
            Listo. Los datos ya quedaron en Grows para el estudio/arquitecto. No tenés que reenviar nada
            por WhatsApp: ellos los ven automáticamente en su bandeja.
          </p>
        </OCCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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

      {(data.planos?.length ?? 0) > 0 && (
        <OCCard className="mb-4" style={{ background: '#EFF6FF', borderColor: '#93C5FD' }}>
          <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
            Planos del pedido
          </p>
          <ul className="mt-2 space-y-1">
            {data.planos.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline"
                  style={{ color: BRAND.blueLight }}
                >
                  {p.nombre}
                </a>
              </li>
            ))}
          </ul>
        </OCCard>
      )}

      <OCCard className="mb-4 !p-0 overflow-hidden">
        <div className="border-b px-3 py-2" style={{ borderColor: BRAND.border, background: BRAND.gray }}>
          <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
            {isPedido
              ? 'Completá días y precio por tarea (la unidad ya viene del pedido)'
              : 'Marcá tareas y fechas'}
          </p>
        </div>

        {/* Header tabla */}
        <div
          className="hidden grid-cols-[1fr_90px_72px_100px] gap-2 border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wide sm:grid"
          style={{ borderColor: BRAND.border, color: BRAND.muted }}
        >
          <span>Tarea</span>
          <span>Unidad</span>
          <span>{isPedido ? 'Días' : 'Inicio'}</span>
          <span>{isPedido ? 'Precio' : 'Fin'}</span>
        </div>

        <div className="divide-y" style={{ borderColor: BRAND.border }}>
          {data.tareas.map((t, i) => {
            const r = taskResponses[i];
            if (!r) return null;
            const unidadLabel = formatUnidad(t.unidad);
            const cant =
              t.cantidad != null && Number.isFinite(t.cantidad)
                ? `${t.cantidad} ${unidadLabel}`
                : `— ${unidadLabel}`;

            return (
              <div
                key={t.id ?? i}
                className="px-3 py-3"
                style={{ background: r.included ? '#fff' : BRAND.gray, opacity: r.included ? 1 : 0.65 }}
              >
                <label className="mb-2 flex items-start gap-2 sm:mb-0">
                  <input
                    type="checkbox"
                    checked={r.included}
                    onChange={(e) => updateTask(i, { included: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm font-semibold" style={{ color: BRAND.text }}>
                    {t.nombre}
                  </span>
                </label>

                {r.included && isPedido && (
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_90px_72px_100px] sm:pl-6">
                    <div className="col-span-3 sm:col-span-1 sm:hidden">
                      <p className="text-[10px] font-bold uppercase" style={{ color: BRAND.muted }}>
                        Unidad
                      </p>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: BRAND.blue }}>
                        {cant}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold tabular-nums" style={{ color: BRAND.blue }}>
                        {cant}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-bold uppercase sm:hidden" style={{ color: BRAND.muted }}>
                        Días
                      </p>
                      <input
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.875rem' }}
                        inputMode="numeric"
                        value={r.dias}
                        onChange={(e) => updateTask(i, { dias: e.target.value })}
                        placeholder="días"
                        aria-label={`Días ${t.nombre}`}
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-bold uppercase sm:hidden" style={{ color: BRAND.muted }}>
                        Precio
                      </p>
                      <input
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.875rem' }}
                        inputMode="decimal"
                        value={r.precio}
                        onChange={(e) => updateTask(i, { precio: e.target.value })}
                        placeholder="$"
                        aria-label={`Precio ${t.nombre}`}
                      />
                    </div>
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

        {isPedido && totalPrecio > 0 && (
          <div
            className="flex justify-between border-t px-3 py-2 text-sm font-bold"
            style={{ borderColor: BRAND.border, color: BRAND.blue }}
          >
            <span>Total</span>
            <span className="tabular-nums">${totalPrecio.toLocaleString('es-AR')}</span>
          </div>
        )}
      </OCCard>

      <OCCard>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          ¿Cómo te contactamos?
        </p>
        <p className="mb-3 text-xs" style={{ color: BRAND.muted }}>
          Al enviar, el estudio recibe tu presupuesto automáticamente. No hace falta reenviarlo.
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
            {isPedido ? 'Enviar presupuesto al estudio' : 'Confirmar disponibilidad'}
          </OCButton>
        </form>
      </OCCard>

      <p className="mt-6 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Formulario de Grows Obra Check · La respuesta queda en la bandeja del arquitecto
      </p>
    </div>
  );
}
