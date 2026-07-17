'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { BRAND, OCCard } from '@/components/obra-check/ui';

type DetalleItem = {
  nombre: string;
  included: boolean;
  unidad?: string | null;
  cantidad?: number | null;
  dias?: number | null;
  precio?: number | null;
  inicio?: string | null;
  fin?: string | null;
};

type Respuesta = {
  id: string;
  contratista: string;
  telefono: string | null;
  email: string | null;
  detalle: DetalleItem[] | null;
  createdAt: string;
  viewToken: string | null;
  tipo: string;
  grupoNombre: string;
};

type InboxData = {
  email: string | null;
  empresa: string | null;
  tipoObra: string | null;
  planos: Array<{ id: string; nombre: string; url: string }>;
  respuestas: Respuesta[];
};

export function ObraCheckInboxView({ token }: { token: string }) {
  const [data, setData] = useState<InboxData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/obra-check/inbox/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error ?? 'No se pudo cargar');
        return j.data as InboxData;
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
        Cargando bandeja…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: BRAND.muted }}>
        Grows Obra Check · Bandeja del arquitecto
      </p>
      <h1 className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.blue }}>
        Respuestas de presupuesto
      </h1>
      <p className="mt-1 text-sm" style={{ color: BRAND.muted }}>
        {data.empresa ?? data.email ?? 'Tu obra'}
        {data.tipoObra ? ` · ${data.tipoObra}` : ''}
      </p>
      <p className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: '#ECFDF5', color: BRAND.green }}>
        Los contratistas cargan el formulario en su link. Acá aparecen solos — no hace falta que te
        reenvíen nada.
      </p>

      {data.planos.length > 0 && (
        <OCCard className="mt-4">
          <p className="mb-2 text-sm font-semibold">Planos del pedido</p>
          <ul className="space-y-1">
            {data.planos.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm"
                  style={{ color: BRAND.blueLight }}
                >
                  <FileText size={14} /> {p.nombre}
                </a>
              </li>
            ))}
          </ul>
        </OCCard>
      )}

      {data.respuestas.length === 0 ? (
        <OCCard className="mt-6">
          <p className="text-sm" style={{ color: BRAND.muted }}>
            Todavía no hay respuestas. Cuando un contratista complete el formulario, va a aparecer acá.
          </p>
        </OCCard>
      ) : (
        <div className="mt-6 space-y-4">
          {data.respuestas.map((r) => {
            const items = (Array.isArray(r.detalle) ? r.detalle : []).filter((t) => t.included);
            const total = items.reduce((s, t) => s + (typeof t.precio === 'number' ? t.precio : 0), 0);
            return (
              <OCCard key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: BRAND.muted }}>
                      {r.grupoNombre}
                    </p>
                    <p className="text-base font-bold" style={{ color: BRAND.text }}>
                      {r.contratista}
                    </p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>
                      {[r.telefono, r.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-[11px]" style={{ color: BRAND.muted }}>
                    {new Date(r.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead>
                      <tr style={{ color: BRAND.muted }}>
                        <th className="pb-1 font-bold">Tarea</th>
                        <th className="pb-1 font-bold">Unidad</th>
                        <th className="pb-1 font-bold">Días</th>
                        <th className="pb-1 font-bold">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((t, i) => (
                        <tr key={`${t.nombre}-${i}`} className="border-t" style={{ borderColor: BRAND.border }}>
                          <td className="py-1.5 pr-2 font-medium">{t.nombre}</td>
                          <td className="py-1.5 tabular-nums">
                            {t.cantidad != null ? `${t.cantidad} ` : ''}
                            {t.unidad === 'm2' || !t.unidad ? 'm²' : t.unidad}
                          </td>
                          <td className="py-1.5 tabular-nums">{t.dias ?? '—'}</td>
                          <td className="py-1.5 font-semibold tabular-nums">
                            {t.precio != null ? `$${Number(t.precio).toLocaleString('es-AR')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {total > 0 && (
                  <p className="mt-2 text-right text-sm font-extrabold" style={{ color: BRAND.blue }}>
                    Total: ${total.toLocaleString('es-AR')}
                  </p>
                )}

                {r.viewToken && (
                  <a
                    href={`/obra-check/r/${r.viewToken}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: BRAND.blueLight }}
                  >
                    Ver ficha <ExternalLink size={12} />
                  </a>
                )}
              </OCCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
