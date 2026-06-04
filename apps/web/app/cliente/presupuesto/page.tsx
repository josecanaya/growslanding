'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { PresupuestoCard } from '@/components/cliente/PresupuestoCard';
import { SolicitudesCambioPresupuestoPanel } from '@/components/cliente/presupuestos/SolicitudesCambioPresupuestoPanel';
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
  let otros = 0;
  let montoAprobado = 0;
  const socios = new Set<string>();
  for (const r of rows) {
    const est = u(r.estado);
    if (est === 'ENVIADO' || est === 'PENDIENTE') pendientes++;
    else if (est === 'APROBADO' || est === 'ACEPTADO') {
      aprobados++;
      if (typeof r.monto === 'number' && r.monto > 0) montoAprobado += r.monto;
    } else otros++;
    if (r.cuadrilla && r.cuadrilla !== '—') socios.add(r.cuadrilla);
  }
  return { pendientes, aprobados, otros, montoAprobado, sociosCount: socios.size };
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
      ) : (
        <div className="space-y-12">
          {buckets.map((bucket) => {
            const res = resumenObra(bucket.rows);
            return (
              <section key={bucket.key} className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{bucket.obraNombre}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {bucket.rows.length} presupuesto{bucket.rows.length === 1 ? '' : 's'} · Pendientes de respuesta:{' '}
                      <strong>{res.pendientes}</strong> · Aprobados: <strong>{res.aprobados}</strong>
                      {res.montoAprobado > 0 ? (
                        <>
                          {' '}
                          · Total aprobado:{' '}
                          <strong>
                            {new Intl.NumberFormat('es-AR', {
                              style: 'currency',
                              currency: 'ARS',
                              maximumFractionDigits: 0,
                            }).format(res.montoAprobado)}
                          </strong>
                        </>
                      ) : null}
                      {res.sociosCount > 0 ? (
                        <>
                          {' '}
                          · Socios (cuadrillas distintas): <strong>{res.sociosCount}</strong>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bucket.obraId ? (
                      <>
                        <Link
                          href={`/cliente/tareas/${encodeURIComponent(bucket.obraId)}/editor` as Route}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Abrir canvas
                        </Link>
                        <Link
                          href={`/cliente/obras/${encodeURIComponent(bucket.obraId)}` as Route}
                          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Ver obra
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bucket.rows.map((p) => {
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
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === p.id}
                            onClick={() => void rechazar(p)}
                          >
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
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
