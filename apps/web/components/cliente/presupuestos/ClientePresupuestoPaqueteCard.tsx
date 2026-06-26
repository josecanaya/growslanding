'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';
import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export type ClientePresupuestoLinea = {
  id: string;
  tareaTitulo: string;
  monto: number;
  estado: string | null;
  createdAt: string | null;
};

export type PaqueteEstadoVisual = 'aprobado' | 'pendiente' | 'mixto' | 'otro';

export function estadoVisualPaquete(lineas: { estado: string | null }[]): PaqueteEstadoVisual {
  let pendientes = 0;
  let aprobados = 0;
  for (const l of lineas) {
    const u = String(l.estado ?? '').toUpperCase();
    if (u === 'ENVIADO' || u === 'PENDIENTE') pendientes++;
    else if (u === 'APROBADO' || u === 'ACEPTADO') aprobados++;
  }
  if (pendientes > 0 && aprobados === 0) return 'pendiente';
  if (pendientes === 0 && aprobados > 0) return 'aprobado';
  if (pendientes > 0) return 'mixto';
  return 'otro';
}

function mapEstado(estado: string | null | undefined): string {
  if (!estado) return '—';
  const u = estado.toUpperCase();
  if (u === 'BORRADOR' || u === 'DRAFT') return 'Borrador interno';
  if (u === 'ENVIADO' || u === 'PENDIENTE') return 'Pendiente de respuesta';
  if (u === 'APROBADO' || u === 'ACEPTADO') return 'Aprobado';
  if (u === 'RECHAZADO') return 'Rechazado';
  return estado;
}

function resumenPaquete(lineas: ClientePresupuestoLinea[]) {
  let pendientes = 0;
  let aprobados = 0;
  let montoTotal = 0;
  for (const l of lineas) {
    const u = String(l.estado ?? '').toUpperCase();
    if (u === 'ENVIADO' || u === 'PENDIENTE') pendientes++;
    if (u === 'APROBADO' || u === 'ACEPTADO') aprobados++;
    if (typeof l.monto === 'number' && l.monto > 0) montoTotal += l.monto;
  }
  return { pendientes, aprobados, montoTotal, count: lineas.length };
}

const shellClass: Record<PaqueteEstadoVisual, string> = {
  aprobado: 'border-emerald-300 bg-emerald-50/90 shadow-emerald-100/50',
  pendiente: 'border-amber-400 bg-amber-50/95 shadow-amber-100/60',
  mixto: 'border-amber-300 bg-gradient-to-br from-amber-50/80 to-emerald-50/50',
  otro: 'border-slate-200 bg-white',
};

type Props = {
  paqueteNombre: string;
  cuadrilla: string;
  lineas: ClientePresupuestoLinea[];
  estadoVisual: PaqueteEstadoVisual;
  defaultOpen?: boolean;
  busy?: boolean;
  puedeAprobarPaquete?: boolean;
  onAprobarPaquete?: () => void;
  onRechazarPaquete?: () => void;
};

export function ClientePresupuestoPaqueteCard({
  paqueteNombre,
  cuadrilla,
  lineas,
  estadoVisual,
  defaultOpen = false,
  busy = false,
  puedeAprobarPaquete = false,
  onAprobarPaquete,
  onRechazarPaquete,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const res = resumenPaquete(lineas);

  const estadoLabel =
    estadoVisual === 'aprobado'
      ? 'Aprobado'
      : estadoVisual === 'pendiente'
        ? 'Esperando tu aprobación'
        : estadoVisual === 'mixto'
          ? 'Parcialmente aprobado'
          : 'En revisión';

  return (
    <div className={cn('rounded-xl border-2 shadow-sm transition-colors', shellClass[estadoVisual])}>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{paqueteNombre}</h3>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                estadoVisual === 'aprobado' && 'bg-emerald-200/80 text-emerald-900',
                estadoVisual === 'pendiente' && 'bg-amber-200 text-amber-950',
                estadoVisual === 'mixto' && 'bg-white/80 text-amber-900 ring-1 ring-amber-200',
                estadoVisual === 'otro' && 'bg-slate-100 text-slate-700',
              )}
            >
              {estadoLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{cuadrilla}</p>
          <p className="mt-2 text-xs text-slate-600">
            {res.count} partidas · {res.aprobados} aprobada{res.aprobados === 1 ? '' : 's'}
            {res.pendientes > 0 ? (
              <>
                {' '}
                · <span className="font-semibold text-amber-900">{res.pendientes} pendiente(s)</span>
              </>
            ) : null}
            {res.montoTotal > 0 ? (
              <>
                {' '}
                · Total: <span className="font-semibold text-slate-900">{ars.format(res.montoTotal)}</span>
              </>
            ) : null}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
            {open ? 'Ocultar detalle' : 'Ver partidas'}
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </p>
        </button>
        {puedeAprobarPaquete && onAprobarPaquete ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button type="button" size="sm" disabled={busy} onClick={onAprobarPaquete}>
              {busy ? 'Procesando…' : 'Aprobar paquete'}
            </Button>
            {onRechazarPaquete ? (
              <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onRechazarPaquete}>
                Rechazar paquete
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {open ? (
        <ul className="divide-y divide-slate-200/80 border-t border-slate-200/80 bg-white/60">
          {lineas.map((l) => {
            const u = String(l.estado ?? '').toUpperCase();
            const lineaAprobada = u === 'APROBADO' || u === 'ACEPTADO';
            const lineaPendiente = u === 'ENVIADO' || u === 'PENDIENTE';
            return (
              <li
                key={l.id}
                className={cn(
                  'px-5 py-3',
                  lineaAprobada && 'bg-emerald-50/50',
                  lineaPendiente && 'bg-amber-50/40',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{l.tareaTitulo}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {l.monto > 0 ? ars.format(l.monto) : '—'}
                    </p>
                  </div>
                  <StatusBadge label={mapEstado(l.estado)} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
