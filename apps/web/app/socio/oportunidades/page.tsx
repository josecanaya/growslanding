'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SolicitudOportunidadCard } from '@/components/socio/oportunidades/SolicitudOportunidadCard';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  ordenarSolicitudesPorPrioridad,
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

function OportunidadesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraIdHighlight = searchParams.get('obra_id');
  
  // Estado separado para oportunidades (listado completo)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          // Usar mocks - mostrar todas ordenadas por prioridad
          const ordenadas = ordenarSolicitudesPorPrioridad(MOCK_SOLICITUDES);
          
          // Convertir mocks a formato de interfaz
          const solicitudesFormateadas: Solicitud[] = ordenadas.map((mock) => ({
            obra_id: mock.obra_id,
            obra_name: mock.obra_name,
            direccion_completa: mock.direccion_completa,
            zona: mock.zona,
            fecha_inicio_estimada: mock.fecha_inicio_estimada,
            duracion_estimada_dias: mock.duracion_estimada_dias,
            tipo_trabajo: mock.tipo_trabajo,
            etapa: mock.etapa,
            estado_solicitud: mock.estado,
            tiene_presupuesto_socio: mock.socio_ya_presupuesto,
            urgencia: mock.urgencia,
            cantidad_tareas: mock.cantidad_tareas,
          }));

          setSolicitudes(solicitudesFormateadas);
        } else {
          // Usar datos reales
          const response = await fetch('/api/socio/solicitudes');
          if (!response.ok) {
            throw new Error('Error al cargar solicitudes');
          }

          const data = await response.json();
          const todasSolicitudes = data.solicitudes || [];
          
          // Ordenar por prioridad
          const ordenadas = ordenarSolicitudesPorPrioridad(
            todasSolicitudes.map((s: any) => ({
              ...s,
              urgencia: 'MEDIA' as const, // Por defecto si no viene del backend
              cantidad_tareas: 0,
            }))
          );

          setSolicitudes(ordenadas as any);
        }
      } catch (err) {
        setError('No se pudieron cargar las oportunidades');
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-[70px] z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/socio')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Oportunidades de trabajo</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Solicitudes disponibles para presupuestar
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="px-4 py-3 space-y-2 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-[70px] z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/socio')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Oportunidades de trabajo</h1>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}. Intentá nuevamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-[70px] z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/socio')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Oportunidades de trabajo</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Solicitudes disponibles para presupuestar
            </p>
          </div>
        </div>
      </div>

      {/* Listado completo */}
      <div className="p-4">
        {solicitudes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
            <p className="text-sm">No hay oportunidades disponibles en este momento.</p>
            <p className="text-xs text-gray-400 mt-2">Revisá más tarde.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
            {solicitudes.map((solicitud) => (
              <div
                key={solicitud.obra_id}
                className={obraIdHighlight === solicitud.obra_id ? 'bg-blue-50' : ''}
              >
                <SolicitudOportunidadCard solicitud={solicitud} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OportunidadesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <OportunidadesContent />
    </Suspense>
  );
}

