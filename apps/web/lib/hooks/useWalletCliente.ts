'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';

interface Saldo {
  saldo_actual: number;
  saldo_pendiente: number;
  moneda: string;
}

interface Movimiento {
  id: string;
  owner_tipo: 'SOCIO' | 'ORG';
  owner_id: string;
  tipo: 'CREDITO' | 'DEBITO';
  monto: number;
  concepto: string;
  tarea_id?: string | null;
  presupuesto_id?: string | null;
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
      const response = await fetch('/api/wallet/saldo');
      if (!response.ok) {
        throw new Error('Error al obtener saldo');
      }
      const data = await response.json();
      setSaldo({
        saldo_actual: data.saldo_actual ?? 0,
        saldo_pendiente: data.saldo_pendiente ?? 0,
        moneda: data.moneda ?? 'ARS',
      });
    } catch (err) {
      console.error('[useWalletCliente] Error obteniendo saldo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setSaldo({
        saldo_actual: 0,
        saldo_pendiente: 0,
        moneda: 'ARS',
      });
    }
  }, []);

  const fetchMovimientos = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await fetch(`/api/wallet/movimientos?limit=${limit}&offset=${offset}`);
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
  };
}

