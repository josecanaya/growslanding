'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { PresupuestoCard } from '@/components/cliente/PresupuestoCard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type Row = {
  id: string;
  monto: number;
  estado: string | null;
  createdAt: string | null;
  tareaTitulo: string;
  obraNombre: string;
  cuadrilla: string;
};

function mapEstadoPresupuesto(estado: string | null | undefined): string {
  if (!estado) return '—';
  const u = estado.toUpperCase();
  if (u === 'BORRADOR' || u === 'DRAFT') return 'Borrador interno';
  if (u === 'ENVIADO' || u === 'PENDIENTE') return 'Pendiente de respuesta';
  if (u === 'APROBADO' || u === 'ACEPTADO') return 'Aprobado';
  if (u === 'RECHAZADO') return 'Rechazado';
  return estado;
}

function formatEnviado(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-AR');
  } catch {
    return iso;
  }
}

export default function ClientePresupuestoPage() {
  const user = useCurrentUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.orgId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const q = user.orgId ? `?org_id=${encodeURIComponent(user.orgId)}` : '';
      const res = await fetch(`/api/cliente/presupuestos${q}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudieron cargar los presupuestos');
        setRows([]);
        return;
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch {
      setErr('Error de red');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Compras"
        title="Presupuestos"
        description="Solicitudes y respuestas asociadas a tareas, según lo registrado en la base de datos."
      />
      {err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{err}</p>
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-600">Cargando…</p>
      ) : !user?.orgId ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Necesitás una organización en la sesión para ver presupuestos.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No hay presupuestos de tareas todavía.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <div key={p.id}>
              <PresupuestoCard
                titulo={p.tareaTitulo}
                cuadrilla={p.cuadrilla}
                estado={mapEstadoPresupuesto(p.estado)}
                monto={p.monto}
                enviado={formatEnviado(p.createdAt)}
              />
              <p className="mt-2 text-xs text-slate-500">Obra: {p.obraNombre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
