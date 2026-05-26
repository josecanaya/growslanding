'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ApiTareaRow } from '@/lib/mappers/tarea-api-to-ui';
import {
  buildClienteHomeTareasKpis,
  type ClienteHomeTareasKpis,
} from '@/lib/cliente/home/kpisFromTareas';

/**
 * GET /api/tareas?obra_id=&org_id= — misma fuente que `ObrasListContainer` / detalle.
 */
export function useClienteObraTareasResumen(obraId: string | null, orgId: string | null) {
  const [tareas, setTareas] = useState<ApiTareaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!obraId || !orgId) {
      setTareas([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/tareas?obra_id=${encodeURIComponent(obraId)}&org_id=${encodeURIComponent(orgId)}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setTareas([]);
          setError(typeof json.error === 'string' ? json.error : 'No se pudieron cargar las tareas');
          return;
        }
        setTareas(Array.isArray(json.data) ? json.data : []);
      } catch {
        if (active) {
          setTareas([]);
          setError('Error de red al cargar las tareas');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [obraId, orgId]);

  const kpis: ClienteHomeTareasKpis = useMemo(
    () => buildClienteHomeTareasKpis(tareas),
    [tareas],
  );

  return { tareas, loading, error, kpis };
}
