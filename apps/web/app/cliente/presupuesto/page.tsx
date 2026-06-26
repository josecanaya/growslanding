'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ClientePliegoPaqueteCard } from '@/components/cliente/presupuestos/ClientePliegoPaqueteCard';
import { SolicitudesCambioPresupuestoPanel } from '@/components/cliente/presupuestos/SolicitudesCambioPresupuestoPanel';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import {
  groupPliegosEnObra,
  puedeResponderPresupuesto,
  type OfertaPresupuestoBucket,
  type PresupuestoRowMin,
} from '@/lib/cliente/pliegoPresupuesto';

type Row = PresupuestoRowMin & {
  obraId: string | null;
  obraNombre: string;
};

type ObraBucket = {
  key: string;
  obraId: string | null;
  obraNombre: string;
  rows: Row[];
};

function resumenObra(rows: Row[]) {
  let pendientes = 0;
  let aprobados = 0;
  let montoAprobado = 0;
  const pliegos = groupPliegosEnObra(rows);
  let pliegosConPendientes = 0;
  for (const pliego of pliegos) {
    const hayPend = pliego.ofertas.some((o) =>
      o.rows.some((r) => puedeResponderPresupuesto(r.estado)),
    );
    if (hayPend) pliegosConPendientes++;
  }
  for (const r of rows) {
    const est = String(r.estado ?? '').toUpperCase();
    if (est === 'ENVIADO' || est === 'PENDIENTE') pendientes++;
    else if (est === 'APROBADO' || est === 'ACEPTADO') {
      aprobados++;
      if (r.monto > 0) montoAprobado += r.monto;
    }
  }
  return {
    pendientes,
    aprobados,
    montoAprobado,
    pliegosCount: pliegos.length,
    pliegosConPendientes,
    ofertoresTotal: new Set(rows.map((r) => r.socioId).filter(Boolean)).size,
  };
}

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ClientePresupuestoPage() {
  const user = useCurrentUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyOfertaKey, setBusyOfertaKey] = useState<string | null>(null);
  const [obraSeleccionadaKey, setObraSeleccionadaKey] = useState<string | null>(null);

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

  const buckets = useMemo(() => {
    const m = new Map<string, ObraBucket>();
    for (const p of rows) {
      const key = p.obraId ?? '__sin_obra__';
      let b = m.get(key);
      if (!b) {
        b = {
          key,
          obraId: p.obraId,
          obraNombre: p.obraNombre?.trim() ? p.obraNombre : 'Obra sin nombre',
          rows: [],
        };
        m.set(key, b);
      }
      b.rows.push(p);
    }
    return [...m.values()].sort((a, b) =>
      a.obraNombre.localeCompare(b.obraNombre, 'es', { sensitivity: 'base' }),
    );
  }, [rows]);

  const obraActiva = useMemo(
    () => buckets.find((b) => b.key === obraSeleccionadaKey) ?? null,
    [buckets, obraSeleccionadaKey],
  );

  const aprobarOferta = async (oferta: OfertaPresupuestoBucket, obraId: string | null) => {
    if (busyOfertaKey) return;
    const pendientes = oferta.rows.filter((p) => puedeResponderPresupuesto(p.estado));
    if (pendientes.length === 0) return;
    const total = pendientes.reduce((s, p) => s + (p.monto > 0 ? p.monto : 0), 0);
    const msg = `¿Adjudicás la oferta de «${oferta.cuadrilla}»?\n\nSe aprobarán ${pendientes.length} partida(s) del paquete${total > 0 ? ` por ${ars.format(total)}` : ''}. Las demás ofertas del mismo pliego quedarán descartadas en cada tarea.`;
    if (!window.confirm(msg)) return;

    setBusyOfertaKey(oferta.key);
    setErr(null);
    try {
      const res = await fetch('/api/cliente/presupuestos/aprobar-paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presupuesto_ids: pendientes.map((p) => p.id) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo adjudicar la oferta');
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al adjudicar');
    } finally {
      setBusyOfertaKey(null);
    }
  };

  const rechazarOferta = async (oferta: OfertaPresupuestoBucket, obraId: string | null) => {
    if (busyOfertaKey) return;
    const pendientes = oferta.rows.filter((p) => puedeResponderPresupuesto(p.estado));
    if (pendientes.length === 0) return;
    if (!oferta.socioId || !obraId) {
      setErr('Faltan datos del socio u obra para rechazar.');
      return;
    }
    const comentario = window.prompt(`Motivo del rechazo de la oferta de ${oferta.cuadrilla} (opcional):`) ?? '';
    setBusyOfertaKey(oferta.key);
    setErr(null);
    try {
      const res = await fetch('/api/presupuestos/rechazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socio_id: oferta.socioId,
          obra_id: obraId,
          tarea_ids: pendientes.map((p) => p.tareaId),
          comentario: comentario.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo rechazar la oferta');
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al rechazar');
    } finally {
      setBusyOfertaKey(null);
    }
  };

  const listadoObras = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {buckets.map((bucket) => {
        const res = resumenObra(bucket.rows);
        const tienePendientes = res.pliegosConPendientes > 0;
        return (
          <button
            key={bucket.key}
            type="button"
            onClick={() => setObraSeleccionadaKey(bucket.key)}
            className={cn(
              'flex w-full flex-col rounded-xl border-2 p-5 text-left shadow-sm transition hover:shadow-md',
              tienePendientes
                ? 'border-amber-300 bg-amber-50/90 hover:border-amber-400'
                : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    tienePendientes ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800',
                  )}
                >
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-snug text-slate-900">{bucket.obraNombre}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tienePendientes ? 'Pliegos con ofertas pendientes' : 'Pliegos al día'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
            <p className="mt-4 text-sm text-slate-700">
              {res.pliegosCount} pliego{res.pliegosCount === 1 ? '' : 's'} · hasta 6 ofertores c/u
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Pendientes: <strong className="text-amber-900">{res.pendientes}</strong> · Aprobadas:{' '}
              <strong className="text-emerald-800">{res.aprobados}</strong>
            </p>
          </button>
        );
      })}
    </div>
  );

  const detalleObra =
    obraActiva &&
    (() => {
      const res = resumenObra(obraActiva.rows);
      const pliegos = groupPliegosEnObra(obraActiva.rows);
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => setObraSeleccionadaKey(null)}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Todas las obras
              </button>
              <h2 className="text-2xl font-semibold text-slate-900">{obraActiva.obraNombre}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {pliegos.length} pliego{pliegos.length === 1 ? '' : 's'} · {res.pendientes} partida
                {res.pendientes === 1 ? '' : 's'} pendiente{res.pendientes === 1 ? '' : 's'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-950">
                  Pliego en comparación (ámbar)
                </span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900">
                  Pliego adjudicado (verde)
                </span>
              </div>
            </div>
            {obraActiva.obraId ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/cliente/tareas/${encodeURIComponent(obraActiva.obraId)}/editor` as Route}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Abrir canvas
                </Link>
                <Link
                  href={`/cliente/obras/${encodeURIComponent(obraActiva.obraId)}` as Route}
                  className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Ver obra
                </Link>
              </div>
            ) : null}
          </div>
          <div className="space-y-5">
            {pliegos.map((pliego) => (
              <ClientePliegoPaqueteCard
                key={pliego.key}
                pliegoNombre={pliego.pliegoNombre}
                ofertas={pliego.ofertas}
                busyOfertaKey={busyOfertaKey}
                onAprobarOferta={(oferta) => void aprobarOferta(oferta, obraActiva.obraId)}
                onRechazarOferta={(oferta) => void rechazarOferta(oferta, obraActiva.obraId)}
              />
            ))}
          </div>
        </div>
      );
    })();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Compras"
        title="Presupuestos"
        description={
          obraSeleccionadaKey
            ? 'Cada paquete es un pliego: compará ofertores (hasta 6) y adjudicá una oferta completa.'
            : 'Elegí una obra para ver los pliegos y ofertas de presupuesto.'
        }
      />
      <SolicitudesCambioPresupuestoPanel onResponded={() => void load()} />
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
      ) : obraSeleccionadaKey ? (
        detalleObra
      ) : (
        listadoObras
      )}
    </div>
  );
}
