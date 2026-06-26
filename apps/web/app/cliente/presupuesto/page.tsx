'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import {
  ClientePresupuestoPaqueteCard,
  estadoVisualPaquete,
} from '@/components/cliente/presupuestos/ClientePresupuestoPaqueteCard';
import { SolicitudesCambioPresupuestoPanel } from '@/components/cliente/presupuestos/SolicitudesCambioPresupuestoPanel';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

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
  budgetGroupId: string | null;
  budgetGroupName: string | null;
};

function puedeResponder(estado: string | null | undefined): boolean {
  const u = (estado ?? '').toUpperCase();
  return u === 'ENVIADO' || u === 'PENDIENTE';
}

type PaqueteBucket = {
  key: string;
  budgetGroupId: string | null;
  budgetGroupName: string;
  socioId: string | null;
  cuadrilla: string;
  rows: Row[];
};

function groupPaquetesEnObra(rows: Row[]): PaqueteBucket[] {
  const m = new Map<string, PaqueteBucket>();
  for (const r of rows) {
    const pkgId = r.budgetGroupId ?? '__sin_paquete__';
    const socioKey = r.socioId ?? '__sin_socio__';
    const key = `${pkgId}::${socioKey}`;
    let b = m.get(key);
    if (!b) {
      b = {
        key,
        budgetGroupId: r.budgetGroupId,
        budgetGroupName: r.budgetGroupName?.trim()
          ? r.budgetGroupName
          : r.budgetGroupId
            ? 'Paquete de trabajo'
            : 'Partidas sueltas',
        socioId: r.socioId,
        cuadrilla: r.cuadrilla,
        rows: [],
      };
      m.set(key, b);
    }
    b.rows.push(r);
  }
  return [...m.values()].sort((a, b) => {
    const va = estadoVisualPaquete(a.rows);
    const vb = estadoVisualPaquete(b.rows);
    const order = (v: string) => (v === 'pendiente' ? 0 : v === 'mixto' ? 1 : 2);
    if (order(va) !== order(vb)) return order(va) - order(vb);
    return a.budgetGroupName.localeCompare(b.budgetGroupName, 'es', { sensitivity: 'base' });
  });
}

type ObraBucket = {
  key: string;
  obraId: string | null;
  obraNombre: string;
  rows: Row[];
};

function resumenObra(rows: Row[]) {
  const u = (e: string | null | undefined) => String(e ?? '').toUpperCase();
  let pendientes = 0;
  let aprobados = 0;
  let montoAprobado = 0;
  const paquetes = groupPaquetesEnObra(rows);
  let paquetesPendientes = 0;
  for (const pkg of paquetes) {
    const ev = estadoVisualPaquete(pkg.rows);
    if (ev === 'pendiente' || ev === 'mixto') paquetesPendientes++;
  }
  for (const r of rows) {
    const est = u(r.estado);
    if (est === 'ENVIADO' || est === 'PENDIENTE') pendientes++;
    else if (est === 'APROBADO' || est === 'ACEPTADO') {
      aprobados++;
      if (typeof r.monto === 'number' && r.monto > 0) montoAprobado += r.monto;
    }
  }
  return { pendientes, aprobados, montoAprobado, paquetesCount: paquetes.length, paquetesPendientes };
}

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ClientePresupuestoPage() {
  const user = useCurrentUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
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

  const aprobarPaquete = async (pkg: PaqueteBucket, obraId: string | null) => {
    if (busyKey) return;
    const pendientes = pkg.rows.filter((p) => puedeResponder(p.estado));
    if (pendientes.length === 0) return;
    const total = pendientes.reduce((s, p) => s + (p.monto > 0 ? p.monto : 0), 0);
    const msg = `¿Aprobás el paquete «${pkg.budgetGroupName}» de ${pkg.cuadrilla}?\n\nSe aprobarán ${pendientes.length} partida(s)${total > 0 ? ` por un total de ${ars.format(total)}` : ''} y se asignarán al socio.`;
    if (!window.confirm(msg)) return;

    setBusyKey(pkg.key);
    setErr(null);
    try {
      const res = await fetch('/api/cliente/presupuestos/aprobar-paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presupuesto_ids: pendientes.map((p) => p.id) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo aprobar el paquete');
        if (json.omitidos?.length) {
          console.warn('[aprobar-paquete] omitidos', json.omitidos);
        }
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al aprobar el paquete');
    } finally {
      setBusyKey(null);
    }
  };

  const rechazarPaquete = async (pkg: PaqueteBucket, obraId: string | null) => {
    if (busyKey) return;
    const pendientes = pkg.rows.filter((p) => puedeResponder(p.estado));
    if (pendientes.length === 0) return;
    if (!pkg.socioId || !obraId) {
      setErr('Faltan datos del socio u obra para rechazar el paquete.');
      return;
    }
    const comentario = window.prompt('Motivo del rechazo del paquete (opcional):') ?? '';
    setBusyKey(pkg.key);
    setErr(null);
    try {
      const res = await fetch('/api/presupuestos/rechazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socio_id: pkg.socioId,
          obra_id: obraId,
          tarea_ids: pendientes.map((p) => p.tareaId),
          comentario: comentario.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo rechazar el paquete');
        return;
      }
      await load();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grows:presupuesto-respondido'));
      }
    } catch {
      setErr('Error de red al rechazar');
    } finally {
      setBusyKey(null);
    }
  };

  const listadoObras = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {buckets.map((bucket) => {
        const res = resumenObra(bucket.rows);
        const tienePendientes = res.paquetesPendientes > 0;
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
                    {tienePendientes ? 'Con paquetes pendientes' : 'Todo al día'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
            <p className="mt-4 text-sm text-slate-700">
              {res.paquetesCount} paquete{res.paquetesCount === 1 ? '' : 's'} · {bucket.rows.length} partidas
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Pendientes: <strong className="text-amber-900">{res.pendientes}</strong> · Aprobadas:{' '}
              <strong className="text-emerald-800">{res.aprobados}</strong>
              {res.montoAprobado > 0 ? (
                <>
                  {' '}
                  · {ars.format(res.montoAprobado)} aprobado
                </>
              ) : null}
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
      const paquetes = groupPaquetesEnObra(obraActiva.rows);
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
                {paquetes.length} paquete{paquetes.length === 1 ? '' : 's'} · {res.pendientes} partida
                {res.pendientes === 1 ? '' : 's'} pendiente{res.pendientes === 1 ? '' : 's'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-950">
                  Amarillo = esperando aprobación
                </span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900">
                  Verde = paquete aprobado
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
          <div className="space-y-4">
            {paquetes.map((pkg) => {
              const visual = estadoVisualPaquete(pkg.rows);
              const pendientes = pkg.rows.filter((p) => puedeResponder(p.estado));
              const puedeAprobar = pendientes.length > 0 && Boolean(pkg.socioId);
              return (
                <ClientePresupuestoPaqueteCard
                  key={pkg.key}
                  paqueteNombre={pkg.budgetGroupName}
                  cuadrilla={pkg.cuadrilla}
                  estadoVisual={visual}
                  lineas={pkg.rows.map((p) => ({
                    id: p.id,
                    tareaTitulo: p.tareaTitulo,
                    monto: p.monto,
                    estado: p.estado,
                    createdAt: p.createdAt,
                  }))}
                  busy={busyKey === pkg.key}
                  puedeAprobarPaquete={puedeAprobar}
                  onAprobarPaquete={() => void aprobarPaquete(pkg, obraActiva.obraId)}
                  onRechazarPaquete={
                    puedeAprobar ? () => void rechazarPaquete(pkg, obraActiva.obraId) : undefined
                  }
                />
              );
            })}
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
            ? 'Paquetes de trabajo de la obra seleccionada. Podés aprobar o rechazar el paquete completo.'
            : 'Elegí una obra para ver y responder los presupuestos por paquete.'
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
