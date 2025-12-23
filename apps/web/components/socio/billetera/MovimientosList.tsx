'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Cargando movimientos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (movimientos.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No hay movimientos registrados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Movimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {movimientos.map((movimiento) => (
            <div
              key={movimiento.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
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
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {movimiento.concepto}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
      </CardContent>
    </Card>
  );
}












