'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';
import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';
import {
  MAX_OFERTORES_POR_PLIEGO,
  type OfertaPresupuestoBucket,
  type PliegoEstadoVisual,
  estadoVisualOferta,
  estadoVisualPliego,
  puedeResponderPresupuesto,
} from '@/lib/cliente/pliegoPresupuesto';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const shellClass: Record<PliegoEstadoVisual, string> = {
  aprobado: 'border-emerald-300 bg-emerald-50/90',
  pendiente: 'border-amber-400 bg-amber-50/95',
  mixto: 'border-amber-300 bg-gradient-to-br from-amber-50/80 to-emerald-50/50',
  otro: 'border-slate-200 bg-white',
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

function totalMonto(rows: { monto: number }[]): number {
  return rows.reduce((s, r) => s + (r.monto > 0 ? r.monto : 0), 0);
}

type Props = {
  pliegoNombre: string;
  ofertas: OfertaPresupuestoBucket[];
  maxOfertores?: number;
  busyOfertaKey?: string | null;
  onAprobarOferta: (oferta: OfertaPresupuestoBucket) => void;
  onRechazarOferta: (oferta: OfertaPresupuestoBucket) => void;
};

export function ClientePliegoPaqueteCard({
  pliegoNombre,
  ofertas,
  maxOfertores = MAX_OFERTORES_POR_PLIEGO,
  busyOfertaKey = null,
  onAprobarOferta,
  onRechazarOferta,
}: Props) {
  const [ofertasOpen, setOfertasOpen] = useState(false);
  const [detalleOfertaKey, setDetalleOfertaKey] = useState<string | null>(null);

  const pliegoVisual = estadoVisualPliego(ofertas);
  const ofertoresCount = Math.min(ofertas.length, maxOfertores);
  const partidasTotal = ofertas.reduce((s, o) => s + o.rows.length, 0);
  const propuestas = ofertas.filter((o) =>
    o.rows.some((r) => puedeResponderPresupuesto(r.estado) || r.monto > 0),
  ).length;

  const pliegoLabel =
    pliegoVisual === 'aprobado'
      ? 'Pliego adjudicado'
      : pliegoVisual === 'pendiente'
        ? 'Esperando adjudicación'
        : pliegoVisual === 'mixto'
          ? 'En comparación'
          : 'Pliego abierto';

  return (
    <div className={cn('rounded-xl border-2 shadow-sm', shellClass[pliegoVisual])}>
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{pliegoNombre}</h3>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  pliegoVisual === 'aprobado' && 'bg-emerald-200/80 text-emerald-900',
                  pliegoVisual === 'pendiente' && 'bg-amber-200 text-amber-950',
                  pliegoVisual === 'mixto' && 'bg-white/80 text-amber-900 ring-1 ring-amber-200',
                  pliegoVisual === 'otro' && 'bg-slate-100 text-slate-700',
                )}
              >
                {pliegoLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {partidasTotal} partida{partidasTotal === 1 ? '' : 's'} en el paquete ·{' '}
              {propuestas} propuesta{propuestas === 1 ? '' : 's'} recibida{propuestas === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOfertasOpen((v) => !v)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition',
              'border-[#163274]/25 bg-white shadow-sm hover:border-[#163274]/40 hover:bg-slate-50',
              ofertasOpen && 'ring-2 ring-[#163274]/20',
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#163274]/10 text-[#163274]">
              <Users className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ofertores
              </span>
              <span className="text-xl font-extrabold tabular-nums text-[#163274]">
                {ofertoresCount}/{maxOfertores}
              </span>
            </span>
            {ofertasOpen ? (
              <ChevronDown className="ml-1 h-5 w-5 text-slate-500" />
            ) : (
              <ChevronRight className="ml-1 h-5 w-5 text-slate-500" />
            )}
          </button>
        </div>

        {!ofertasOpen ? (
          <p className="mt-3 text-xs font-medium text-slate-600">
            Tocá el contador de ofertores para comparar presupuestos y adjudicar un paquete completo.
          </p>
        ) : null}
      </div>

      {ofertasOpen ? (
        <div className="space-y-3 border-t border-slate-200/80 bg-white/50 px-4 py-4">
          {ofertas.length === 0 ? (
            <p className="text-sm text-slate-600">Todavía no hay ofertores en este pliego.</p>
          ) : (
            ofertas.map((oferta, index) => {
              const visual = estadoVisualOferta(oferta.rows);
              const pendientes = oferta.rows.filter((r) => puedeResponderPresupuesto(r.estado));
              const puedeAdjudicar = pendientes.length > 0 && Boolean(oferta.socioId);
              const busy = busyOfertaKey === oferta.key;
              const total = totalMonto(oferta.rows);
              const detalleOpen = detalleOfertaKey === oferta.key;

              const ofertaShell =
                visual === 'aprobado'
                  ? 'border-emerald-300 bg-emerald-50/80'
                  : visual === 'pendiente'
                    ? 'border-amber-300 bg-amber-50/60'
                    : 'border-slate-200 bg-white';

              return (
                <div
                  key={oferta.key}
                  className={cn('overflow-hidden rounded-xl border-2', ofertaShell)}
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Oferta {index + 1}
                      </p>
                      <p className="text-base font-bold text-slate-900">{oferta.cuadrilla}</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {oferta.rows.length} partida{oferta.rows.length === 1 ? '' : 's'}
                        {total > 0 ? (
                          <>
                            {' '}
                            · Total: <span className="font-bold">{ars.format(total)}</span>
                          </>
                        ) : null}
                      </p>
                      <StatusBadge
                        label={
                          visual === 'aprobado'
                            ? 'Adjudicada'
                            : visual === 'pendiente'
                              ? 'Propuesta para comparar'
                              : 'En elaboración'
                        }
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {puedeAdjudicar ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => onAprobarOferta(oferta)}
                          >
                            {busy ? 'Procesando…' : 'Adjudicar esta oferta'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => onRechazarOferta(oferta)}
                          >
                            Rechazar oferta
                          </Button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDetalleOfertaKey(detalleOpen ? null : oferta.key)}
                        className="text-xs font-bold text-[#163274] underline-offset-2 hover:underline"
                      >
                        {detalleOpen ? 'Ocultar partidas' : 'Ver partidas'}
                      </button>
                    </div>
                  </div>
                  {detalleOpen ? (
                    <ul className="divide-y divide-slate-100 border-t border-slate-200/80 bg-white/70">
                      {oferta.rows.map((l) => {
                        const u = String(l.estado ?? '').toUpperCase();
                        const lineaAprobada = u === 'APROBADO' || u === 'ACEPTADO';
                        const lineaPendiente = u === 'ENVIADO' || u === 'PENDIENTE';
                        return (
                          <li
                            key={l.id}
                            className={cn(
                              'px-4 py-2.5',
                              lineaAprobada && 'bg-emerald-50/50',
                              lineaPendiente && 'bg-amber-50/30',
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-slate-900">{l.tareaTitulo}</span>
                              <span className="text-sm font-bold tabular-nums text-slate-800">
                                {l.monto > 0 ? ars.format(l.monto) : '—'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
