'use client';

import { Clock, Wallet } from 'lucide-react';
import { formatPesos, formatArgentineNumber } from '@/lib/utils/format';

/** Ref. bento superior de `presupuestos_responsive_budget_detail` (totales aproximados) */
export function PresupuestoStitchBento({
  titulo,
  totalMonto,
  totalDias,
}: {
  titulo: string;
  totalMonto: number;
  totalDias: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex min-h-[160px] flex-col justify-between rounded-xl bg-gradient-to-br from-stitch-primary to-stitch-primary-container p-6 text-stitch-on-primary shadow-xl shadow-stitch-primary/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total estimado</span>
          <div className="mt-1 font-stitch-headline text-4xl font-black tabular-nums">
            {formatPesos(totalMonto)}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 opacity-90">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-bold">Tiempo: {formatArgentineNumber(totalDias)} días</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-xl bg-stitch-surface-container-lowest p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stitch-on-surface/70">
          Alcance (demo)
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between font-medium text-stitch-on-surface/80">
            <span>Obra</span>
            <span className="line-clamp-1 max-w-[55%] text-right font-bold text-stitch-primary">
              {titulo}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stitch-on-surface/70">Partidas en etapa</span>
            <span className="font-bold text-stitch-primary">—</span>
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-lg bg-stitch-surface-container-low p-2 text-xs text-stitch-on-surface/70">
          <Wallet className="h-4 w-4 shrink-0 text-stitch-primary" />
          Valores editables abajo; envío en demo no guarda.
        </div>
      </div>
    </div>
  );
}
