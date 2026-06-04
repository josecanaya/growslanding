'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Loader2, Scale, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/grows';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type SolicitudRow = {
  id: string;
  presupuesto_id: string;
  socio_nombre: string | null;
  monto_actual: number;
  monto_propuesto: number;
  motivo: string;
  tarea_titulo: string | null;
  obra_nombre: string | null;
  created_at: string;
};

function formatArs(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type Props = {
  onResponded?: () => void;
};

export function SolicitudesCambioPresupuestoPanel({ onResponded }: Props) {
  const user = useCurrentUser();
  const [items, setItems] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.orgId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const q = `?org_id=${encodeURIComponent(user.orgId)}`;
      const res = await fetch(`/api/cliente/presupuestos/solicitudes-cambio${q}`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudieron cargar las solicitudes');
        setItems([]);
        return;
      }
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setErr('Error de red');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const responder = async (item: SolicitudRow, accion: 'aceptar' | 'rechazar') => {
    if (busyId) return;

    const diff = item.monto_propuesto - item.monto_actual;
    const pct =
      item.monto_actual > 0 ? Math.round((Math.abs(diff) / item.monto_actual) * 100) : 0;

    if (accion === 'aceptar') {
      const ok = window.confirm(
        `¿Aceptás el nuevo monto de ${formatArs(item.monto_propuesto)} para «${item.tarea_titulo ?? 'la tarea'}»? (antes: ${formatArs(item.monto_actual)}${pct > 0 ? `, ${diff > 0 ? '+' : ''}${pct}%` : ''})`,
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        `¿Rechazás la solicitud? El monto aprobado se mantiene en ${formatArs(item.monto_actual)}.`,
      );
      if (!ok) return;
    }

    const respuesta =
      accion === 'rechazar'
        ? (window.prompt('Comentario para el socio (opcional):') ?? '').trim() || null
        : (window.prompt('Comentario de confirmación (opcional):') ?? '').trim() || null;

    setBusyId(item.id);
    setErr(null);
    try {
      const res = await fetch(
        `/api/cliente/presupuestos/solicitudes-cambio/${encodeURIComponent(item.id)}/responder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion, respuesta_cliente: respuesta }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo registrar la respuesta');
        return;
      }
      await load();
      onResponded?.();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-cambio-respondido'));
      }
    } catch {
      setErr('Error de red');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Revisando solicitudes de cambio de precio…
      </p>
    );
  }

  if (!user?.orgId) return null;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Revisiones de precio ({items.length})
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Un socio pidió cambiar el monto de un presupuesto ya aprobado. Aceptá para actualizar el
            valor contractual o rechazá para mantener el monto vigente.
          </p>
        </div>
      </div>

      {err ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => {
          const diff = item.monto_propuesto - item.monto_actual;
          return (
            <li
              key={item.id}
              className="rounded-lg border border-white/80 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-slate-900">
                    {item.tarea_titulo ?? 'Tarea sin título'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.obra_nombre ?? 'Obra'} · {item.socio_nombre ?? 'Socio'} ·{' '}
                    {formatFecha(item.created_at)}
                  </p>
                  <p className="text-sm text-slate-800">
                    <span className="text-slate-500">Monto aprobado:</span>{' '}
                    {formatArs(item.monto_actual)}
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="font-medium text-slate-900">
                      {formatArs(item.monto_propuesto)}
                    </span>
                    {diff !== 0 ? (
                      <span
                        className={`ml-2 text-xs font-semibold ${diff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                      >
                        ({diff > 0 ? '+' : ''}
                        {formatArs(diff)})
                      </span>
                    ) : null}
                  </p>
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">Motivo del socio: </span>
                    {item.motivo}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyId === item.id}
                    icon={
                      busyId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )
                    }
                    onClick={() => void responder(item, 'aceptar')}
                  >
                    Aceptar monto
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === item.id}
                    className="text-red-700 hover:bg-red-50"
                    icon={<XCircle className="h-4 w-4 text-red-600" />}
                    onClick={() => void responder(item, 'rechazar')}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
