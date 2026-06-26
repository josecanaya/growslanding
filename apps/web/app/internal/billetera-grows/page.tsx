'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type ResumenGrows = {
  orgId: string;
  saldo_actual: number;
  moneda: string;
  totalMovimientos: number;
  ultimosMovimientos: Array<{
    id: string;
    concepto: string;
    monto: number;
    tipo: string;
    created_at: string;
  }>;
};

function formatArs(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BilleteraGrowsPage() {
  const [data, setData] = useState<ResumenGrows | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/internal/grows-wallet', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message || 'No se pudo cargar la billetera GROWS');
        }
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    void cargar();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billetera GROWS</h1>
        <p className="mt-1 text-sm text-slate-600">
          Comisiones acumuladas por validaciones de bloques (plataforma).
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando…
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saldo de comisiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-700">{formatArs(data.saldo_actual)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Org plataforma: <code className="rounded bg-slate-100 px-1">{data.orgId}</code>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Configurá <code>GROWS_PLATFORM_ORG_ID</code> en el entorno si el saldo no coincide.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos movimientos ({data.totalMovimientos})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.ultimosMovimientos.length === 0 ? (
                <p className="text-sm text-slate-500">Sin movimientos todavía.</p>
              ) : (
                data.ultimosMovimientos.map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{mov.concepto}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(mov.created_at).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-700">+{formatArs(Number(mov.monto))}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
