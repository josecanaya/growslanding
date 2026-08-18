'use client';

import { useCallback, useEffect, useState } from 'react';

/** Igual forma que consume `app/cliente/obras/page.tsx` desde GET /api/obras */
export type ClienteObraListaItem = {
  id: string;
  orgId: string;
  name: string;
  address: string | null;
  estado: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  _count?: { tareas?: number };
  graphMode?: string | null;
};

export async function fetchClienteObras(signal?: AbortSignal): Promise<ClienteObraListaItem[]> {
  const res = await fetch('/api/obras', { cache: 'no-store', signal });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof json.message === 'string'
        ? json.message
        : typeof json.error === 'string'
          ? json.error
          : 'Error al cargar obras';
    throw new Error(msg);
  }
  return Array.isArray(json.data) ? json.data : [];
}

export function useClienteObras() {
  const [obras, setObras] = useState<ClienteObraListaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClienteObras();
      setObras(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setObras([]);
      setError(e instanceof Error ? e.message : 'Error al cargar obras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClienteObras(ac.signal);
        if (active) setObras(data);
      } catch (e) {
        if (!active) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setObras([]);
        setError(e instanceof Error ? e.message : 'Error al cargar obras');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      ac.abort();
    };
  }, []);

  return { obras, loading, error, refresh };
}
