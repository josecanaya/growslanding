'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Info, Loader2 } from 'lucide-react';

type RetiroInfo = {
  retiro_disponible: number;
  limites: {
    montoMinimo: number;
    montoMaximoPorOperacion: number;
    montoMaximoDiario: number;
    montoRetiradoHoy: number;
    montoDisponibleHoy: number;
  };
  liquidacion: {
    diasCiclo: number;
    proxima_liquidacion_at: string | null;
    dias_hasta_proxima: number | null;
  };
  tiene_metodo_retiro: boolean;
};

function formatArs(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  onRetirar: (monto: number) => Promise<void>;
  operando?: boolean;
};

export function RetiroSocioPanel({ onRetirar, operando = false }: Props) {
  const [info, setInfo] = useState<RetiroInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/socio/wallet/retiro', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || 'No se pudo cargar info de retiros');
      }
      setInfo(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const handleSubmit = async () => {
    if (!info || operando) return;
    const parsed = Number(monto.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    setError(null);
    try {
      await onRetirar(parsed);
      setMonto('');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo solicitar el retiro');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando límites de retiro…
      </div>
    );
  }

  if (!info) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <Info className="h-5 w-5 text-stitch-primary" />
        </div>
        <div>
          <h3 className="font-stitch-headline text-sm font-bold text-stitch-on-surface">Retiros y liquidación</h3>
          <p className="mt-1 text-xs text-stitch-on-surface/65">
            Podés retirar manualmente dentro de los límites. Cada {info.liquidacion.diasCiclo} días el saldo restante
            se transfiere automáticamente a tu cuenta principal (control legal de movimientos).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">Disponible para retirar ahora</p>
          <p className="mt-1 text-base font-bold text-slate-900">{formatArs(info.retiro_disponible)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1 text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            Próxima liquidación auto.
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {info.liquidacion.dias_hasta_proxima != null
              ? `En ${info.liquidacion.dias_hasta_proxima} días`
              : 'Próximamente'}
          </p>
        </div>
      </div>

      <ul className="space-y-1 text-[11px] text-slate-500">
        <li>Mínimo por retiro: {formatArs(info.limites.montoMinimo)}</li>
        <li>Máximo por operación: {formatArs(info.limites.montoMaximoPorOperacion)}</li>
        <li>Tope diario: {formatArs(info.limites.montoMaximoDiario)} (usado hoy: {formatArs(info.limites.montoRetiradoHoy)})</li>
      </ul>

      {!info.tiene_metodo_retiro ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Cargá un método de retiro (CVU/CBU/Alias) más abajo para habilitar retiros y la liquidación quincenal.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min={info.limites.montoMinimo}
            max={info.retiro_disponible}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={`Monto (mín. ${formatArs(info.limites.montoMinimo)})`}
            className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            disabled={operando || info.retiro_disponible < info.limites.montoMinimo}
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              operando ||
              info.retiro_disponible < info.limites.montoMinimo ||
              !monto.trim()
            }
            className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {operando ? 'Procesando…' : 'Solicitar retiro'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
