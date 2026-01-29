'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp } from 'lucide-react';

interface SaldoCardProps {
  saldo_actual: number;
  saldo_pendiente: number;
  moneda: string;
  loading?: boolean;
}

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
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-6 bg-gray-100 rounded w-32 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo disponible</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatearMonto(saldo_actual)}
              </p>
            </div>
          </div>
          {saldo_pendiente > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">
                  {formatearMonto(saldo_pendiente)} pendiente
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

















