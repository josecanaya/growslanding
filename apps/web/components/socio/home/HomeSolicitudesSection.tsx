'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SolicitudCard } from './SolicitudCard';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  type MockSolicitud,
} from '@/lib/mocks/socioMockData';

interface Solicitud {
  obra_id: string;
  obra_name: string;
  direccion_completa: string;
  zona: string;
  fecha_inicio_estimada: string | null;
  duracion_estimada_dias: number | null;
  tipo_trabajo: string;
  etapa: string | null;
  estado_solicitud: 'RECIBIENDO_PRESUPUESTOS' | 'PRESUPUESTO_ENVIADO';
  tiene_presupuesto_socio: boolean;
  urgencia?: 'ALTA' | 'MEDIA' | 'BAJA';
  cantidad_tareas?: number;
}

const MAX_EN_HOME = 2;

function mapApiToSolicitud(s: Record<string, unknown>): Solicitud {
  return {
    obra_id: String(s.obra_id ?? s.id ?? ''),
    obra_name: String(s.obra_name ?? ''),
    direccion_completa: String(s.direccion_completa ?? ''),
    zona: String(s.zona ?? ''),
    fecha_inicio_estimada: (s.fecha_inicio_estimada as string | null) ?? null,
    duracion_estimada_dias:
      s.duracion_estimada_dias !== undefined && s.duracion_estimada_dias !== null
        ? Number(s.duracion_estimada_dias)
        : null,
    tipo_trabajo: String(s.tipo_trabajo ?? ''),
    etapa: (s.etapa as string | null) ?? null,
    estado_solicitud:
      s.estado_solicitud === 'PRESUPUESTO_ENVIADO'
        ? 'PRESUPUESTO_ENVIADO'
        : 'RECIBIENDO_PRESUPUESTOS',
    tiene_presupuesto_socio: Boolean(s.tiene_presupuesto_socio),
    urgencia: (s.urgencia as Solicitud['urgencia']) || undefined,
    cantidad_tareas: s.cantidad_tareas !== undefined ? Number(s.cantidad_tareas) : undefined,
  };
}

function mapMockToSolicitud(m: MockSolicitud): Solicitud {
  return {
    obra_id: m.obra_id,
    obra_name: m.obra_name,
    direccion_completa: m.direccion_completa,
    zona: m.zona,
    fecha_inicio_estimada: m.fecha_inicio_estimada,
    duracion_estimada_dias: m.duracion_estimada_dias,
    tipo_trabajo: m.tipo_trabajo,
    etapa: m.etapa,
    estado_solicitud:
      m.estado === 'PRESUPUESTO_ENVIADO' ? 'PRESUPUESTO_ENVIADO' : 'RECIBIENDO_PRESUPUESTOS',
    tiene_presupuesto_socio: m.socio_ya_presupuesto,
    urgencia: m.urgencia,
    cantidad_tareas: m.cantidad_tareas,
  };
}

export function HomeSolicitudesSection() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() =>
    USE_MOCK_DATA
      ? MOCK_SOLICITUDES.slice(0, MAX_EN_HOME).map(mapMockToSolicitud)
      : [],
  );
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [error, setError] = useState<string | null>(null);
  const [hayMasSolicitudes, setHayMasSolicitudes] = useState(
    USE_MOCK_DATA && MOCK_SOLICITUDES.length > MAX_EN_HOME,
  );

  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }

    const fetchSolicitudes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/socio/solicitudes');
        if (!response.ok) {
          throw new Error('Error al cargar solicitudes');
        }

        const data = await response.json();
        const todas: Record<string, unknown>[] = data.solicitudes || [];
        const mapped = todas.map(mapApiToSolicitud);
        setSolicitudes(mapped.slice(0, MAX_EN_HOME));
        setHayMasSolicitudes(mapped.length > MAX_EN_HOME);
      } catch {
        setError('No se pudieron cargar las solicitudes');
      } finally {
        setLoading(false);
      }
    };

    void fetchSolicitudes();
  }, []);

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline">
            Oportunidades
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl bg-stitch-surface-container-high/80"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline">
            Oportunidades
          </h2>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/90 p-4">
          <p className="text-sm text-red-800">{error}. Intentá nuevamente.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline">
          Oportunidades
        </h2>
        <button
          type="button"
          onClick={() => router.push('/socio/oportunidades')}
          className="text-xs font-bold text-stitch-primary"
        >
          Ver todo
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stitch-outline/30 bg-stitch-surface-container-lowest py-8 text-center text-sm text-stitch-outline">
          No hay oportunidades nuevas. Revisá en otro momento o en la lista completa.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {solicitudes.map((solicitud) => (
              <SolicitudCard key={solicitud.obra_id} solicitud={solicitud} />
            ))}
          </div>
          {hayMasSolicitudes && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => router.push('/socio/oportunidades')}
                className="text-sm font-semibold text-stitch-primary"
              >
                Ver más →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
