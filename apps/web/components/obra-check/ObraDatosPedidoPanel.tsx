'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard } from './ui';

type Plano = { id: string; nombre: string; mime: string; url: string; sizeBytes: number };

/** Planos del pedido (m² van por tarea). */
export function ObraDatosPedidoPanel({
  onReadyChange,
}: {
  onReadyChange?: (ready: boolean) => void;
}) {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = planos.length > 0;

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  useEffect(() => {
    obraCheckApi
      .getObraDatos()
      .then((d) => setPlanos(d.planos))
      .catch(() => {});
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await obraCheckApi.uploadPlano(file);
      setPlanos((p) => [...p, uploaded]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removePlano(id: string) {
    setBusy(true);
    try {
      await obraCheckApi.deletePlano(id);
      setPlanos((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OCCard className="mb-4" style={{ borderColor: ready ? BRAND.green : BRAND.gold, background: '#FFFDF5' }}>
      <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
        Planos del pedido
      </p>
      <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
        Adjuntá planos para que el contratista entienda el alcance. Las cantidades (m²) se cargan por
        tarea abajo.
      </p>

      <div className="mt-3">
        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm font-medium"
          style={{ borderColor: BRAND.border, color: BRAND.blue, background: '#fff' }}
        >
          <Upload size={16} />
          {busy ? 'Subiendo…' : 'Adjuntar plano (PDF o imagen)'}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => void onFile(e)}
          />
        </label>
        {planos.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {planos.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs"
                style={{ background: '#fff', border: `1px solid ${BRAND.border}` }}
              >
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-1.5 font-medium"
                  style={{ color: BRAND.blueLight }}
                >
                  <FileText size={14} />
                  <span className="truncate">{p.nombre}</span>
                </a>
                <button
                  type="button"
                  onClick={() => void removePlano(p.id)}
                  style={{ color: BRAND.muted }}
                  title="Quitar"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!ready && (
        <p className="mt-3 text-xs font-medium" style={{ color: '#A16207' }}>
          Adjuntá al menos un plano antes de generar el link.
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs" style={{ color: BRAND.error }}>
          {error}
        </p>
      )}
    </OCCard>
  );
}
