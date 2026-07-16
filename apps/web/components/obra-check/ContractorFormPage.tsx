'use client';

import { useEffect, useState } from 'react';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from '@/components/obra-check/ui';

type FormData = {
  tipo: string;
  alreadyResponded: boolean;
  bloqueNombre: string;
  rubro: string | null;
  empresa: string | null;
  tipoObra: string | null;
  contactoSugerido: string | null;
  tareas: Array<{ nombre: string; duracionDias: number | null }>;
};

export function ContractorFormPage({ token }: { token: string }) {
  const [data, setData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmWa, setConfirmWa] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    rubro: '',
    empresa: '',
    mensaje: '',
    aceptaContacto: true,
  });

  useEffect(() => {
    fetch(`/api/obra-check/form/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error ?? 'No se pudo cargar');
        return j.data as FormData;
      })
      .then((d) => {
        setData(d);
        setForm((f) => ({
          ...f,
          nombre: d.contactoSugerido ?? '',
          rubro: d.rubro ?? '',
        }));
        if (d.alreadyResponded) setDone(true);
      })
      .catch((e) => setError((e as Error).message));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/obra-check/form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          rubro: form.rubro.trim() || null,
          empresa: form.empresa.trim() || null,
          mensaje: form.mensaje.trim() || null,
          aceptaContacto: form.aceptaContacto,
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

  const isPedido = data.tipo === 'pedido_presupuesto';

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <OCCard>
          <h1 className="text-xl font-bold" style={{ color: BRAND.blue }}>
            Datos registrados ✓
          </h1>
          <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
            El estudio ya puede contactarte por WhatsApp con tu número real. Gracias.
          </p>
          {confirmWa && (
            <div className="mt-4">
              <OCButton onClick={() => window.open(confirmWa, '_blank', 'noopener')}>
                Guardar confirmación en WhatsApp
              </OCButton>
              <p className="mt-2 text-[11px]" style={{ color: BRAND.muted }}>
                Opcional: te abre WhatsApp con un resumen para vos o para reenviar.
              </p>
            </div>
          )}
          <div className="mt-6 rounded-lg p-3 text-xs" style={{ background: BRAND.gray, color: BRAND.muted }}>
            Armado con Grows Obra Check — gestión de obra para estudios y contratistas.
          </div>
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
        <p className="mb-2 text-xs font-semibold" style={{ color: BRAND.text }}>
          Alcance ({data.tareas.length} tareas)
        </p>
        <ol className="max-h-48 space-y-1 overflow-y-auto text-sm" style={{ color: BRAND.text }}>
          {data.tareas.map((t, i) => (
            <li key={i} className="flex justify-between gap-2 border-b py-1" style={{ borderColor: BRAND.border }}>
              <span>
                {i + 1}. {t.nombre}
              </span>
              {t.duracionDias != null && (
                <span className="shrink-0 text-xs" style={{ color: BRAND.muted }}>
                  {t.duracionDias}d
                </span>
              )}
            </li>
          ))}
        </ol>
      </OCCard>

      <OCCard>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Tus datos de contacto
        </p>
        <p className="mb-4 text-xs" style={{ color: BRAND.muted }}>
          Completá el formulario para que el estudio te escriba. Sin esto no saben a qué WhatsApp
          llegaste.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <OCField label="Nombre y apellido">
            <input
              style={inputStyle}
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Juan Pérez"
            />
          </OCField>
          <OCField label="WhatsApp" hint="Con código de país si podés (ej. 54911…)">
            <input
              style={inputStyle}
              required
              inputMode="tel"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="54911…"
            />
          </OCField>
          <OCField label="Email (opcional)">
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </OCField>
          <div className="grid grid-cols-2 gap-2">
            <OCField label="Rubro">
              <input
                style={inputStyle}
                value={form.rubro}
                onChange={(e) => setForm((f) => ({ ...f, rubro: e.target.value }))}
                placeholder="Electricista"
              />
            </OCField>
            <OCField label="Empresa">
              <input
                style={inputStyle}
                value={form.empresa}
                onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              />
            </OCField>
          </div>
          <OCField label={isPedido ? 'Tu cotización / comentario' : 'Comentario (opcional)'}>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.mensaje}
              onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
              placeholder={isPedido ? 'Monto estimado, plazos…' : 'Dudas o disponibilidad'}
            />
          </OCField>
          <label className="flex items-start gap-2 text-xs" style={{ color: BRAND.muted }}>
            <input
              type="checkbox"
              checked={form.aceptaContacto}
              onChange={(e) => setForm((f) => ({ ...f, aceptaContacto: e.target.checked }))}
              className="mt-0.5"
            />
            Acepto que el estudio me contacte por WhatsApp / email sobre este trabajo.
          </label>
          {error && (
            <p className="text-sm" style={{ color: BRAND.error }}>
              {error}
            </p>
          )}
          <OCButton type="submit" loading={busy} disabled={!form.nombre.trim() || !form.telefono.trim()}>
            Enviar mis datos
          </OCButton>
        </form>
      </OCCard>

      <p className="mt-6 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Formulario de Grows Obra Check
      </p>
    </div>
  );
}
