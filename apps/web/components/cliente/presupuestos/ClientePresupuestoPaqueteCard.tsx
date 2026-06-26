'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export type ClientePresupuestoLinea = {
  id: string;
  tareaTitulo: string;
  monto: number;
  estado: string | null;
  createdAt: string | null;
  actions?: ReactNode;
};

type Props = {
  paqueteNombre: string;
  cuadrilla: string;
  lineas: ClientePresupuestoLinea[];
  defaultOpen?: boolean;
};

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
  let montoTotal = 0;
  for (const l of lineas) {
    const u = String(l.estado ?? '').toUpperCase();
    if (u === 'ENVIADO' || u === 'PENDIENTE') pendientes++;
    if (typeof l.monto === 'number' && l.monto > 0) montoTotal += l.monto;
  }
  return { pendientes, montoTotal, count: lineas.length };
}

export function ClientePresupuestoPaqueteCard({
  paqueteNombre,
  cuadrilla,
  lineas,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const res = resumenPaquete(lineas);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">{paqueteNombre}</h3>
          <p className="mt-1 text-sm text-slate-600">{cuadrilla}</p>
          <p className="mt-2 text-xs text-slate-500">
            {res.count} {res.count === 1 ? 'partida' : 'partidas'}
            {res.pendientes > 0 ? (
              <>
                {' '}
                · <span className="font-semibold text-amber-800">{res.pendientes} pendiente(s)</span>
              </>
            ) : null}
            {res.montoTotal > 0 ? (
              <>
                {' '}
                · Total: <span className="font-semibold text-slate-800">{ars.format(res.montoTotal)}</span>
              </>
            ) : null}
          </p>
        </div>
        {open ? (
          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>
      {open ? (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {lineas.map((l) => (
            <li key={l.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{l.tareaTitulo}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {l.monto > 0 ? ars.format(l.monto) : '—'}
                  </p>
                </div>
                <StatusBadge label={mapEstado(l.estado)} />
              </div>
              {l.actions ? <div className="mt-3 flex flex-wrap gap-2">{l.actions}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
