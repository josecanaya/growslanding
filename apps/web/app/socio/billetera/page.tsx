'use client';

import { useWallet } from '@/lib/hooks/useWallet';
import { SaldoCard } from '@/components/socio/billetera/SaldoCard';
import { MovimientosList } from '@/components/socio/billetera/MovimientosList';
import { Loader2 } from 'lucide-react';

export default function BilleteraPage() {
  const { saldo, movimientos, loading, error } = useWallet();

  if (loading && !saldo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#4A6FA5] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando billetera...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Mi Billetera</h1>
        <p className="text-xs text-slate-500 mt-1">
          Saldo disponible y movimientos de tu cuenta
        </p>
      </div>

      <div className="p-4 space-y-4">
        {saldo && (
          <SaldoCard
            saldo_actual={saldo.saldo_actual}
            saldo_pendiente={saldo.saldo_pendiente}
            moneda={saldo.moneda}
            loading={loading}
          />
        )}

        <MovimientosList
          movimientos={movimientos}
          loading={loading}
          moneda={saldo?.moneda || 'ARS'}
        />
      </div>
    </div>
  );
}

