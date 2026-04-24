'use client';

import { Badge } from '@/components/ui/grows/Badge';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { StitchSectionLabel } from '@/components/socio/stitch/socioStitchUi';

interface Movimiento {
  id: string;
  tipo: 'CREDITO' | 'DEBITO';
  monto: number;
  concepto: string;
  created_at: string;
  tarea_id?: string | null;
  estado: string;
}

interface MovimientosListProps {
  movimientos: Movimiento[];
  loading?: boolean;
  moneda?: string;
}

export function MovimientosList({ movimientos, loading, moneda = 'ARS' }: MovimientosListProps) {
  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <StitchSectionLabel>Actividad reciente</StitchSectionLabel>
        <div className="flex items-center justify-center gap-2 rounded-xl border border-stitch-surface-container py-8">
          <Loader2 className="h-5 w-5 animate-spin text-stitch-primary" />
          <span className="text-sm text-stitch-on-surface/70">Cargando movimientos…</span>
        </div>
      </section>
    );
  }

  if (movimientos.length === 0) {
    return (
      <section className="space-y-3">
        <StitchSectionLabel>Actividad reciente</StitchSectionLabel>
        <div className="rounded-xl border border-dashed border-stitch-outline/30 bg-stitch-surface-container-lowest py-8 text-center text-sm text-stitch-on-surface/60">
          No hay movimientos registrados
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <StitchSectionLabel>Actividad reciente</StitchSectionLabel>
      <div className="space-y-2">
        {movimientos.map((movimiento) => (
          <div
            key={movimiento.id}
            className="flex gap-3 rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest p-4 shadow-sm transition hover:bg-stitch-surface-container-low"
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                movimiento.tipo === 'CREDITO' ? 'bg-emerald-100' : 'bg-red-100'
              }`}
            >
              {movimiento.tipo === 'CREDITO' ? (
                <ArrowUpCircle className="h-5 w-5 text-emerald-700" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stitch-on-surface leading-tight">
                {movimiento.concepto}
              </p>
              <p className="mt-0.5 truncate whitespace-nowrap text-xs text-stitch-on-surface/55">
                {formatearFecha(movimiento.created_at)}
              </p>
              <div className="mt-1.5">
                <Badge
                  variant={movimiento.estado === 'completado' ? 'success' : 'warning'}
                  className="text-[10px]"
                >
                  {movimiento.estado}
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p
                className={`whitespace-nowrap text-base font-bold ${
                  movimiento.tipo === 'CREDITO' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {movimiento.tipo === 'CREDITO' ? '+' : '-'}
                {formatearMonto(movimiento.monto)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
