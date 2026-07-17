'use client';

import { useEffect, useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { BRAND, OCCard } from '@/components/obra-check/ui';

type DetalleItem = {
  nombre: string;
  included: boolean;
  dias?: number | null;
  precio?: number | null;
  inicio?: string | null;
  fin?: string | null;
};

type RespuestaData = {
  grupoNombre: string;
  tipo: string;
  metrosCuadrados: number | null;
  tipoObra: string | null;
  empresa: string | null;
  contratista: { nombre: string; telefono: string | null; email: string | null };
  detalle: DetalleItem[] | null;
  mensaje: string | null;
  createdAt: string;
  planos: Array<{ id: string; nombre: string; url: string; mime: string }>;
};

export function ObraCheckRespuestaView({ token }: { token: string }) {
  const [data, setData] = useState<RespuestaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/obra-check/respuesta/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error ?? 'No se pudo cargar');
        return j.data as RespuestaData;
      })
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, [token]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold" style={{ color: BRAND.error }}>
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm" style={{ color: BRAND.muted }}>
        Cargando respuesta…
      </div>
    );
  }

  const items = (Array.isArray(data.detalle) ? data.detalle : []).filter((t) => t.included);
  const total = items.reduce((s, t) => s + (typeof t.precio === 'number' ? t.precio : 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: BRAND.muted }}>
        Grows Obra Check
      </p>
      <h1 className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.blue }}>
        Respuesta completa
      </h1>
      <p className="mt-1 text-sm" style={{ color: BRAND.muted }}>
        {data.grupoNombre}
        {data.metrosCuadrados != null ? ` · ${data.metrosCuadrados} m²` : ''}
        {data.tipoObra ? ` · ${data.tipoObra}` : ''}
      </p>

      <OCCard className="mt-6">
        <p className="text-xs font-bold uppercase" style={{ color: BRAND.muted }}>
          Contratista
        </p>
        <p className="mt-1 text-lg font-bold" style={{ color: BRAND.text }}>
          {data.contratista.nombre}
        </p>
        <p className="text-sm" style={{ color: BRAND.muted }}>
          {[data.contratista.telefono, data.contratista.email].filter(Boolean).join(' · ') || 'Sin contacto'}
        </p>
      </OCCard>

      <OCCard className="mt-4">
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Detalle presupuestado
        </p>
        <div className="space-y-2">
          {items.map((t, i) => (
            <div
              key={`${t.nombre}-${i}`}
              className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
              style={{ background: BRAND.gray }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: BRAND.text }}>
                  {t.nombre}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  {t.dias != null ? `${t.dias} días` : ''}
                  {t.inicio && t.fin ? ` · ${t.inicio} → ${t.fin}` : ''}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums" style={{ color: BRAND.blue }}>
                {t.precio != null ? `$${Number(t.precio).toLocaleString('es-AR')}` : '—'}
              </p>
            </div>
          ))}
        </div>
        {total > 0 && (
          <p className="mt-3 text-right text-base font-extrabold" style={{ color: BRAND.blue }}>
            Total indicado: ${total.toLocaleString('es-AR')}
          </p>
        )}
      </OCCard>

      {data.planos.length > 0 && (
        <OCCard className="mt-4">
          <p className="mb-2 text-sm font-semibold" style={{ color: BRAND.text }}>
            Planos del pedido
          </p>
          <ul className="space-y-2">
            {data.planos.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: BRAND.blueLight }}
                >
                  <FileText size={16} />
                  {p.nombre}
                  <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </OCCard>
      )}

      <p className="mt-6 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Recibido el {new Date(data.createdAt).toLocaleString('es-AR')}
      </p>
    </div>
  );
}
