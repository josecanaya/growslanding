'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { PresupuestoCard } from '@/components/cliente/PresupuestoCard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Button } from '@/components/ui/grows';

type Row = {
  id: string;
  monto: number;
  estado: string | null;
  createdAt: string | null;
  tareaId: string;
  socioId: string | null;
  tareaTitulo: string;
  obraId: string | null;
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

function puedeResponder(estado: string | null | undefined): boolean {
  const u = (estado ?? '').toUpperCase();
  return u === 'ENVIADO' || u === 'PENDIENTE';
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
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const aprobar = async (p: Row) => {
    if (!puedeResponder(p.estado) || busyId) return;
    if (!window.confirm(`¿Aprobá el presupuesto de «${p.tareaTitulo}» por ${p.monto ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p.monto) : 'el monto indicado'}? Se asignará la tarea al socio.`)) {
      return;
    }
    setBusyId(p.id);
    setErr(null);
    try {
      const res = await fetch(`/api/cliente/presupuestos/${encodeURIComponent(p.id)}/aprobar`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo aprobar');
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al aprobar');
    } finally {
      setBusyId(null);
    }
  };

  const rechazar = async (p: Row) => {
    if (!puedeResponder(p.estado) || busyId) return;
    if (!p.socioId) {
      setErr('Falta identificar al socio para rechazar.');
      return;
    }
    if (!p.obraId) {
      setErr('Falta la obra asociada para rechazar.');
      return;
    }
    const comentario = window.prompt('Motivo del rechazo (opcional):') ?? '';
    setBusyId(p.id);
    setErr(null);
    try {
      const res = await fetch('/api/presupuestos/rechazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socio_id: p.socioId,
          obra_id: p.obraId,
          tarea_ids: [p.tareaId],
          comentario: comentario.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo rechazar');
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al rechazar');
    } finally {
      setBusyId(null);
    }
  };

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
          {rows.map((p) => {
            const actions =
              puedeResponder(p.estado) && p.socioId ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => void aprobar(p)}
                  >
                    {busyId === p.id ? 'Procesando…' : 'Aprobar'}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={busyId === p.id} onClick={() => void rechazar(p)}>
                    Rechazar
                  </Button>
                </>
              ) : null;
            return (
              <div key={p.id}>
                <PresupuestoCard
                  titulo={p.tareaTitulo}
                  cuadrilla={p.cuadrilla}
                  estado={mapEstadoPresupuesto(p.estado)}
                  monto={p.monto}
                  enviado={formatEnviado(p.createdAt)}
                  actions={actions}
                />
                <p className="mt-2 text-xs text-slate-500">Obra: {p.obraNombre}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
