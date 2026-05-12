'use client';

import { useState } from 'react';
import { useWalletCliente } from '@/lib/hooks/useWalletCliente';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import { Wallet, LockKeyhole, ArrowDownCircle, ArrowUpCircle, Loader2, PlusCircle } from 'lucide-react';
import { SectionLayout } from '@/components/ui/grows';

export function BilleteraSection() {
  const { saldo, movimientos, loading, error, cargarSaldoManual, reconciliarValidadas } = useWalletCliente();
  const [operacion, setOperacion] = useState<string | null>(null);
  const [operando, setOperando] = useState(false);

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

  const handleCargaManual = async () => {
    if (operando) return;
    setOperando(true);
    setOperacion(null);
    try {
      await cargarSaldoManual(100000, 'Carga manual MVP desde panel cliente');
      setOperacion('Carga manual confirmada por $100.000.');
    } catch (err) {
      setOperacion(err instanceof Error ? err.message : 'No se pudo cargar saldo');
    } finally {
      setOperando(false);
    }
  };

  const handleReconciliar = async () => {
    if (operando) return;
    setOperando(true);
    setOperacion(null);
    try {
      const resultado = await reconciliarValidadas();
      setOperacion(
        `Reconciliación aplicada: ${resultado.ok}/${resultado.procesadas} bloques validados procesados${
          resultado.conError > 0 ? ` (${resultado.conError} con error)` : ''
        }.`,
      );
    } catch (err) {
      setOperacion(err instanceof Error ? err.message : 'No se pudo aplicar retroactivo');
    } finally {
      setOperando(false);
    }
  };

  return (
    <SectionLayout
      title="Billetera"
      subtitle="Saldo interno de la organización para reservar y liberar pagos"
    >
      <div className="space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-800">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {operacion && (
          <Card className="border border-sky-200 bg-sky-50">
            <CardContent className="p-4">
              <p className="text-sm text-sky-900">{operacion}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
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
                    {saldo ? formatearMonto(saldo.saldo_disponible) : formatearMonto(0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCargaManual}
                  disabled={operando}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {operando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Cargar saldo de prueba
                </button>
                <button
                  type="button"
                  onClick={handleReconciliar}
                  disabled={operando}
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-900 px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {operando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownCircle className="h-4 w-4" />}
                  Aplicar retroactivo
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" />
              Saldo reservado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !saldo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500 mb-1">Reservas para tareas</p>
                <p className="text-3xl font-bold text-slate-900">
                  {saldo ? formatearMonto(saldo.saldo_reservado) : formatearMonto(0)}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Este saldo queda bloqueado hasta liberar el pago o devolver la reserva.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

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
                          ['CARGA_SALDO', 'DEVOLUCION_RESERVA', 'AJUSTE_MANUAL'].includes(movimiento.tipo)
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {['CARGA_SALDO', 'DEVOLUCION_RESERVA', 'AJUSTE_MANUAL'].includes(movimiento.tipo) ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {movimiento.descripcion || movimiento.tipo}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatearFecha(movimiento.created_at)}
                          {movimiento.referencia_id ? ` · ${movimiento.referencia_tipo ?? 'ref'} ${movimiento.referencia_id.slice(0, 8)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className={`text-lg font-semibold ${
                          ['CARGA_SALDO', 'DEVOLUCION_RESERVA', 'AJUSTE_MANUAL'].includes(movimiento.tipo)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {['CARGA_SALDO', 'DEVOLUCION_RESERVA', 'AJUSTE_MANUAL'].includes(movimiento.tipo) ? '+' : '-'}
                        {formatearMonto(movimiento.monto)}
                      </p>
                      <Badge
                        variant={movimiento.estado === 'confirmado' ? 'success' : 'warning'}
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

















