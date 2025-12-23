'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type GananciasResumen = {
  ganasteEsteMes: number;
  pendienteDeCobro: number;
  totalHistorico: number;
};

export default function GananciasPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [saldo, setSaldo] = useState<{ saldo_actual: number; saldo_pendiente: number; moneda: string } | null>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<GananciasResumen>({
    ganasteEsteMes: 0,
    pendienteDeCobro: 0,
    totalHistorico: 0,
  });
  const [calculando, setCalculando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        // Cargar saldo
        const saldoRes = await fetch('/api/wallet/saldo');
        if (saldoRes.ok) {
          const saldoData = await saldoRes.json();
          setSaldo({
            saldo_actual: saldoData.saldo_actual ?? 0,
            saldo_pendiente: saldoData.saldo_pendiente ?? 0,
            moneda: saldoData.moneda ?? 'ARS',
          });
        }

        // Cargar movimientos (200 para tener suficiente historial)
        const movRes = await fetch('/api/wallet/movimientos?limit=200&offset=0');
        if (movRes.ok) {
          const movData = await movRes.json();
          setMovimientos(movData.movimientos || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [currentUser]);

  useEffect(() => {
    const calcularGanancias = () => {
      if (!movimientos || movimientos.length === 0) {
        setResumen({
          ganasteEsteMes: 0,
          pendienteDeCobro: saldo?.saldo_pendiente || 0,
          totalHistorico: 0,
        });
        setCalculando(false);
        return;
      }

      // Calcular inicio del mes actual
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const inicioMesISO = inicioMes.toISOString();

      // Filtrar créditos del mes actual
      const creditosEsteMes = movimientos.filter((m) => {
        if (m.tipo !== 'CREDITO') return false;
        if (!m.created_at) return false;
        return new Date(m.created_at) >= inicioMes;
      });

      // Sumar ganaste este mes (usar monto_neto que es lo que realmente recibe el socio)
      const ganasteEsteMes = creditosEsteMes.reduce((sum, m) => {
        return sum + (m.monto_neto || m.monto_bruto || m.monto || 0);
      }, 0);

      // Sumar total histórico (todos los créditos)
      const creditosTotales = movimientos.filter((m) => m.tipo === 'CREDITO');
      const totalHistorico = creditosTotales.reduce((sum, m) => {
        return sum + (m.monto_neto || m.monto_bruto || m.monto || 0);
      }, 0);

      setResumen({
        ganasteEsteMes: Math.round(ganasteEsteMes * 100) / 100,
        pendienteDeCobro: saldo?.saldo_pendiente || 0,
        totalHistorico: Math.round(totalHistorico * 100) / 100,
      });
      setCalculando(false);
    };

    if (!loading && movimientos) {
      calcularGanancias();
    }
  }, [saldo, movimientos, loading]);

  const formatearMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  if (loading || calculando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#4A6FA5] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Ganancias</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Ganancias</h1>
            <p className="text-xs text-slate-500 mt-1">Resumen de tus ingresos</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Card principal */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Ganaste este mes */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ganaste este mes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatearMonto(resumen.ganasteEsteMes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pendiente de cobro */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendiente de cobro</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatearMonto(resumen.pendienteDeCobro)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total histórico */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total histórico</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatearMonto(resumen.totalHistorico)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

