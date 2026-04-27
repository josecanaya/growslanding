'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { EtapasTimelineWrapper } from '@/components/cliente/EtapasTimelineWrapper';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { apiTareaToObraTimelineTask, type ApiTareaRow } from '@/lib/mappers/tarea-api-to-ui';
import type { ObraTimelineTask } from '@/types/obras';

interface ObraHeader {
  id: string;
  nombre: string;
  cliente?: string;
  localizacion?: string;
}

export default function ObraTimelinePage() {
  const params = useParams();
  const obraId = params.obraId as string;
  const user = useCurrentUser();
  const [obra, setObra] = useState<ObraHeader | null>(null);
  const [tareas, setTareas] = useState<ObraTimelineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    setError(null);
    try {
      const tUrl =
        user?.orgId != null
          ? `/api/tareas?obra_id=${encodeURIComponent(obraId)}&org_id=${encodeURIComponent(user.orgId)}`
          : `/api/tareas?obra_id=${encodeURIComponent(obraId)}`;
      const [rO, rT] = await Promise.all([
        fetch(`/api/obras/${encodeURIComponent(obraId)}`, { cache: 'no-store' }),
        fetch(tUrl, { cache: 'no-store' }),
      ]);
      const jO = await rO.json().catch(() => ({}));
      const jT = await rT.json().catch(() => ({}));

      if (rO.ok && jO?.data) {
        setObra({
          id: obraId,
          nombre: jO.data.name || 'Obra',
          cliente: jO.data.propietario || undefined,
          localizacion: jO.data.address || undefined,
        });
      } else {
        setObra({ id: obraId, nombre: 'Obra' });
      }

      if (!rT.ok) {
        setError(jT.error || 'No se pudieron cargar las tareas');
        setTareas([]);
        return;
      }
      const raw: ApiTareaRow[] = Array.isArray(jT.data) ? jT.data : [];
      setTareas(raw.map((t) => apiTareaToObraTimelineTask(t, obraId)));
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [obraId, user?.orgId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Cargando timeline de la obra…</p>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Obra no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </div>
        {error ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>
        ) : null}
        <EtapasTimelineWrapper obra={obra} tareas={tareas} />
        {tareas.length === 0 && !error ? (
          <p className="mt-4 text-center text-sm text-gray-500">
            No hay tareas en esta obra. Creá tareas desde el detalle de obra o el flujo de líder.
          </p>
        ) : null}
      </div>
    </div>
  );
}
