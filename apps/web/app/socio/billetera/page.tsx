'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/hooks/useWallet';
import { SaldoCard } from '@/components/socio/billetera/SaldoCard';
import { MovimientosList } from '@/components/socio/billetera/MovimientosList';
import { MetodosRetiroSection } from '@/components/socio/billetera/MetodosRetiroSection';
import { Loader2, TrendingUp, History, ArrowDownToLine } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { USE_MOCK_DATA } from '@/lib/mocks/socioMockData';
import { STITCH_INNER, StitchH2Page } from '@/components/socio/stitch/socioStitchUi';
export default function BilleteraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { saldo, movimientos, loading, error } = useWallet();

  const handleRetirarGanancias = () => {
    if (USE_MOCK_DATA) {
      toast({
        title: 'Retiro (demo)',
        description: 'En modo demo no se realizan retiros reales. El saldo mostrado es simulado.',
      });
      return;
    }
    const el = document.getElementById('metodos-retiro-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    toast({
      title: 'Configurá un método de retiro',
      description:
        'Cargá tu CVU/CBU/Alias en "Métodos de retiro". La transferencia se procesará en breve.',
    });
  };

  if (loading && !saldo) {
    return (
      <div className={STITCH_INNER + ' flex min-h-[50vh] items-center justify-center'}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-stitch-primary" />
          <p className="text-sm text-stitch-on-surface/70">Cargando billetera…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={STITCH_INNER}>
        <div className="rounded-lg border border-red-200 bg-red-50/90 p-4">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={STITCH_INNER + ' space-y-6 font-stitch-body'}>
      <StitchH2Page
        kicker="Operaciones"
        title="Mi billetera"
        description="Saldo disponible, pendiente e historial de movimientos."
      />

      {saldo && (
        <>
          <SaldoCard
            saldo_actual={saldo.saldo_actual}
            saldo_pendiente={saldo.saldo_pendiente}
            moneda={saldo.moneda}
            loading={loading}
          />

          {saldo.saldo_actual > 0 && (
            <button
              type="button"
              onClick={handleRetirarGanancias}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 font-stitch-body text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Retirar fondos
            </button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push('/socio/ganancias')}
              className="group flex flex-col items-start rounded-xl bg-stitch-surface-container-lowest p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100">
                <TrendingUp className="h-5 w-5 text-stitch-primary" />
              </div>
              <span className="font-stitch-headline text-sm font-bold text-stitch-on-surface">Ver ganancias</span>
              <span className="text-xs text-stitch-on-surface/60">Resumen e histórico</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('movimientos-billetera');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex flex-col items-start rounded-xl bg-stitch-surface-container-lowest p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100">
                <History className="h-5 w-5 text-stitch-primary" />
              </div>
              <span className="font-stitch-headline text-sm font-bold text-stitch-on-surface">Movimientos</span>
              <span className="text-xs text-stitch-on-surface/60">Historial completo</span>
            </button>
          </div>
        </>
      )}

      <div id="metodos-retiro-section" className="scroll-mt-24">
        <MetodosRetiroSection />
      </div>

      <div id="movimientos-billetera">
        <MovimientosList
          movimientos={movimientos}
          loading={loading}
          moneda={saldo?.moneda || 'ARS'}
        />
      </div>
    </div>
  );
}
