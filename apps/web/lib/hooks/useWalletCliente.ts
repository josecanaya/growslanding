'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';

interface Saldo {
  saldo_disponible: number;
  saldo_reservado: number;
  moneda: string;
}

interface Movimiento {
  id: string;
  tipo:
    | 'CARGA_SALDO'
    | 'RESERVA_TAREA'
    | 'LIBERACION_PAGO'
    | 'DEVOLUCION_RESERVA'
    | 'COMISION_GROWS'
    | 'AJUSTE_MANUAL';
  monto: number;
  descripcion?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  estado: string;
  created_at: string;
}

interface MovimientosResponse {
  movimientos: Movimiento[];
  total: number;
  paginacion: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useWalletCliente() {
  const currentUser = useCurrentUser();
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaldo = useCallback(async () => {
    try {
      const response = await fetch('/api/cliente/wallet/saldo', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Error al obtener saldo');
      }
      const data = await response.json();
      const saldoData = data.saldo ?? data;
      setSaldo({
        saldo_disponible: saldoData.saldo_disponible ?? 0,
        saldo_reservado: saldoData.saldo_reservado ?? 0,
        moneda: saldoData.moneda ?? 'ARS',
      });
    } catch (err) {
      console.error('[useWalletCliente] Error obteniendo saldo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setSaldo({
        saldo_disponible: 0,
        saldo_reservado: 0,
        moneda: 'ARS',
      });
    }
  }, []);

  const fetchMovimientos = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await fetch(`/api/cliente/wallet/movimientos?limit=${limit}&offset=${offset}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Error al obtener movimientos');
      }
      const data: MovimientosResponse = await response.json();
      setMovimientos(data.movimientos || []);
    } catch (err) {
      console.error('[useWalletCliente] Error obteniendo movimientos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setMovimientos([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchSaldo(), fetchMovimientos()]);
    setLoading(false);
  }, [fetchSaldo, fetchMovimientos]);

  const cargarSaldoManual = useCallback(
    async (monto: number, descripcion?: string) => {
      const response = await fetch('/api/cliente/wallet/carga-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, descripcion }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'No se pudo cargar saldo');
      }
      await refresh();
      return data.saldo as Saldo;
    },
    [refresh],
  );

  const reconciliarValidadas = useCallback(async () => {
    const response = await fetch('/api/cliente/wallet/reconciliar-validadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 200 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'No se pudo aplicar la reconciliación');
    }
    await refresh();
    return data.resultado as {
      procesadas: number;
      ok: number;
      conError: number;
      resultados: Array<{ subtareaId: string; ok: boolean; error?: string }>;
    };
  }, [refresh]);

  useEffect(() => {
    if (currentUser) {
      refresh();
    }
  }, [currentUser, refresh]);

  return {
    saldo,
    movimientos,
    loading,
    error,
    refresh,
    cargarSaldoManual,
    reconciliarValidadas,
  };
}

















