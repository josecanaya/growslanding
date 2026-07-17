'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from './ui';

type Plano = { id: string; nombre: string; mime: string; url: string; sizeBytes: number };

/** m² + planos que ve quien presupuesta. Obligatorio antes de mandar el pedido. */
export function ObraDatosPedidoPanel({
  onReadyChange,
}: {
  onReadyChange?: (ready: boolean) => void;
}) {
  const [metros, setMetros] = useState('');
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  const m2Num = metros.trim() ? Number(metros.replace(',', '.')) : NaN;
  const m2Ok = Number.isFinite(m2Num) && m2Num > 0;
  const ready = m2Ok && planos.length > 0;

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  useEffect(() => {
    obraCheckApi
      .getObraDatos()
      .then((d) => {
        if (d.metrosCuadrados != null) setMetros(String(d.metrosCuadrados));
        setPlanos(d.planos);
      })
      .catch(() => {});
  }, []);

  async function saveM2() {
    if (!m2Ok) return;
    setBusy(true);
    setError(null);
    try {
      await obraCheckApi.saveMetrosCuadrados(m2Num);
      setSavedHint('m² guardados');
      setTimeout(() => setSavedHint(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (!m2Ok) {
        // Guardar m² si ya está escrito antes de subir.
        // (no bloquea el upload)
      } else {
        await obraCheckApi.saveMetrosCuadrados(m2Num);
      }
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
        Datos de la obra (los ve quien presupuesta)
      </p>
      <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
        Sin m² y planos el contratista no sabe de qué se trata. Completalos antes de generar el link.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <OCField label="Superficie (m²)" hint="Obligatorio">
            <input
              style={inputStyle}
              inputMode="decimal"
              value={metros}
              onChange={(e) => setMetros(e.target.value)}
              onBlur={() => void saveM2()}
              placeholder="Ej: 120"
            />
          </OCField>
        </div>
        <OCButton variant="secondary" onClick={() => void saveM2()} loading={busy} disabled={!m2Ok}>
          Guardar m²
        </OCButton>
      </div>
      {savedHint && (
        <p className="mt-1 text-xs" style={{ color: BRAND.green }}>
          {savedHint}
        </p>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold" style={{ color: BRAND.text }}>
          Planos / documentos (PDF o imagen)
        </p>
        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm font-medium"
          style={{ borderColor: BRAND.border, color: BRAND.blue, background: '#fff' }}
        >
          <Upload size={16} />
          {busy ? 'Subiendo…' : 'Adjuntar plano'}
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
          Falta {!m2Ok ? 'indicar m²' : ''}
          {!m2Ok && planos.length === 0 ? ' y ' : ''}
          {planos.length === 0 ? 'adjuntar al menos un plano' : ''}.
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
