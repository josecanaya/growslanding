'use client';

import { useState } from 'react';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from '@/components/obra-check/ui';

/** Desbloqueo de bandeja por email del arquitecto (sin depender del contratista). */
export default function ObraCheckBandejaUnlockPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bandejas, setBandejas] = useState<
    Array<{ inboxUrl: string; empresa: string | null; tipoObra: string | null; createdAt: string }>
  >([]);
  const [emailed, setEmailed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/obra-check/inbox/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error ?? 'Error');
      setBandejas(j.data.bandejas ?? []);
      setEmailed(Boolean(j.data.emailed));
      setMessage(j.data.message ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#F5F6F7' }}>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold" style={{ color: BRAND.blue }}>
          Abrir mi bandeja
        </h1>
        <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
          Ingresá el mismo email con el que empezaste Obra Check. Vas a ver los presupuestos que
          cargaron los contratistas — sin que te los reenvíen.
        </p>

        <OCCard className="mt-6">
          <form onSubmit={submit} className="space-y-3">
            <OCField label="Tu email">
              <input
                style={inputStyle}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arquitecto@estudio.com"
              />
            </OCField>
            {error && (
              <p className="text-sm" style={{ color: BRAND.error }}>
                {error}
              </p>
            )}
            <OCButton type="submit" loading={busy} className="w-full">
              Desbloquear bandeja
            </OCButton>
          </form>
        </OCCard>

        {message && (
          <p className="mt-4 text-sm" style={{ color: BRAND.muted }}>
            {message}
          </p>
        )}

        {emailed && (
          <p className="mt-3 text-sm font-medium" style={{ color: BRAND.green }}>
            Te mandamos los links por email.
          </p>
        )}

        {bandejas.length > 0 && (
          <div className="mt-4 space-y-2">
            {bandejas.map((b) => (
              <a
                key={b.inboxUrl}
                href={b.inboxUrl}
                className="block rounded-xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: BRAND.border, background: '#fff', color: BRAND.blue }}
              >
                Abrir bandeja
                <span className="mt-0.5 block text-xs font-normal" style={{ color: BRAND.muted }}>
                  {b.empresa || b.tipoObra || 'Obra Check'} ·{' '}
                  {new Date(b.createdAt).toLocaleDateString('es-AR')}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
