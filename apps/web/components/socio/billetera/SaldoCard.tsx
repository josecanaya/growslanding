'use client';

import { Wallet, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaldoCardProps {
  saldo_actual: number;
  saldo_pendiente: number;
  moneda: string;
  loading?: boolean;
}

/**
 * Cartelera saldo (ref. `stitch_socio/_08_billetera/billetera_responsive_main`):
 * gradiente primary / primary-container, tipografía Manrope.
 */
export function SaldoCard({ saldo_actual, saldo_pendiente, moneda, loading }: SaldoCardProps) {
  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="relative mb-2 overflow-hidden rounded-xl bg-stitch-surface-container-high p-6 shadow-inner animate-pulse">
        <div className="h-3 w-32 rounded bg-white/20" />
        <div className="mt-2 h-10 w-48 rounded bg-white/20" />
      </div>
    );
  }

  return (
    <section
      className={cn(
        'relative mb-2 overflow-hidden rounded-xl bg-gradient-to-br from-stitch-primary to-stitch-primary-container p-6 shadow-xl',
        'shadow-stitch-nav',
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-stitch-surface/10 blur-2xl" />
      <div className="relative z-10">
        <p className="mb-1 font-stitch-body text-[0.75rem] font-medium uppercase tracking-wider text-blue-200">
          Saldo disponible
        </p>
        <h1 className="mb-6 font-stitch-headline text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {formatearMonto(saldo_actual)}
        </h1>
        <div className="flex items-end justify-between border-t border-white/10 pt-4">
          <div>
            <p className="mb-0.5 font-stitch-body text-[0.7rem] font-medium uppercase tracking-wider text-blue-200/80">
              Saldo pendiente
            </p>
            <p className="font-stitch-headline text-lg font-bold text-white/90">
              {formatearMonto(saldo_pendiente)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        {saldo_pendiente > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-200/95">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Incluye pagos en revisión</span>
          </div>
        )}
      </div>
    </section>
  );
}
