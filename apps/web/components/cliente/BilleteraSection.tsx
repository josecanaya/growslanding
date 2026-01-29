'use client';

import { useWalletCliente } from '@/lib/hooks/useWalletCliente';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { SectionLayout } from '@/components/ui/grows';

export function BilleteraSection() {
  const { saldo, movimientos, loading, error } = useWalletCliente();

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: saldo?.moneda || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SectionLayout
      title="Billetera"
      subtitle="Gestión de ingresos y comisiones de GROWS"
    >
      <div className="space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-800">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Card de Saldo */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Saldo disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !saldo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Cargando saldo...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Saldo actual</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {saldo ? formatearMonto(saldo.saldo_actual) : formatearMonto(0)}
                  </p>
                </div>
                {saldo && saldo.saldo_pendiente > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">
                      {formatearMonto(saldo.saldo_pendiente)} pendiente
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Movimientos */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && movimientos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Cargando movimientos...</span>
              </div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movimientos.map((movimiento) => (
                  <div
                    key={movimiento.id}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          movimiento.tipo === 'CREDITO'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {movimiento.tipo === 'CREDITO' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {movimiento.concepto}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatearFecha(movimiento.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className={`text-lg font-semibold ${
                          movimiento.tipo === 'CREDITO'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {movimiento.tipo === 'CREDITO' ? '+' : '-'}
                        {formatearMonto(movimiento.monto)}
                      </p>
                      <Badge
                        variant={movimiento.estado === 'completado' ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {movimiento.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SectionLayout>
  );
}

















