'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SolicitudCard } from './SolicitudCard';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  limitarSolicitudes,
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

export function HomeSolicitudesSection() {
  const router = useRouter();
  // Estado separado para solicitudes (no compartido)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hayMasSolicitudes, setHayMasSolicitudes] = useState(false);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          // Usar mocks - Home muestra máximo 2 solicitudes destacadas
          const { solicitudes: limitadas, hayMas } = limitarSolicitudes(MOCK_SOLICITUDES, 2);
          
          // Convertir mocks a formato de interfaz
          const solicitudesFormateadas: Solicitud[] = limitadas.map((mock) => ({
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
          setHayMasSolicitudes(hayMas);
        } else {
          // Usar datos reales
          const response = await fetch('/api/socio/solicitudes');
          if (!response.ok) {
            throw new Error('Error al cargar solicitudes');
          }

          const data = await response.json();
          const todasSolicitudes = data.solicitudes || [];
          
          // Limitar a 2 también en datos reales (Home = resumen)
          // Convertir a MockSolicitud para usar limitarSolicitudes
          const mockSolicitudes: MockSolicitud[] = todasSolicitudes.map((s: any) => ({
            id: s.obra_id || s.id || '',
            obra_id: s.obra_id || '',
            tipo_trabajo: s.tipo_trabajo || '',
            zona: s.zona || '',
            inicio_estimado_dias: s.inicio_estimado_dias || 0,
            duracion_estimada_dias: s.duracion_estimada_dias || 0,
            urgencia: 'MEDIA' as const,
            cantidad_tareas: 0,
            estado: s.estado_solicitud === 'PRESUPUESTO_ENVIADO' ? 'PRESUPUESTO_ENVIADO' : 'RECIBIENDO_PRESUPUESTOS',
            socio_ya_presupuesto: s.tiene_presupuesto_socio || false,
            obra_name: s.obra_name || '',
            direccion_completa: s.direccion_completa || '',
            fecha_inicio_estimada: s.fecha_inicio_estimada || null,
            etapa: s.etapa || null,
          }));
          
          const { solicitudes: limitadas, hayMas } = limitarSolicitudes(mockSolicitudes, 2);

          // Convertir de vuelta a Solicitud para setSolicitudes
          const solicitudesFormateadas: Solicitud[] = limitadas.map((mock) => ({
            obra_id: mock.obra_id,
            obra_name: mock.obra_name,
            direccion_completa: mock.direccion_completa,
            zona: mock.zona,
            fecha_inicio_estimada: mock.fecha_inicio_estimada,
            duracion_estimada_dias: mock.duracion_estimada_dias,
            tipo_trabajo: mock.tipo_trabajo,
            etapa: mock.etapa,
            estado_solicitud: mock.estado === 'PRESUPUESTO_ENVIADO' ? 'PRESUPUESTO_ENVIADO' : 'RECIBIENDO_PRESUPUESTOS',
            tiene_presupuesto_socio: mock.socio_ya_presupuesto,
            urgencia: mock.urgencia,
            cantidad_tareas: mock.cantidad_tareas,
          }));

          setSolicitudes(solicitudesFormateadas);
          setHayMasSolicitudes(hayMas);
        }
      } catch (err) {
        setError('No se pudieron cargar las solicitudes');
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Solicitudes de trabajo
          </h2>
          <p className="text-sm text-gray-600">
            Oportunidades disponibles para presupuestar
          </p>
        </div>
        <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
          {[1, 2].map((i) => (
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
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Solicitudes de trabajo
          </h2>
          <p className="text-sm text-gray-600">
            Oportunidades disponibles para presupuestar
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}. Intentá nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Solicitudes de trabajo
        </h2>
        <p className="text-sm text-gray-600">
          Oportunidades disponibles para presupuestar
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-sm">No hay solicitudes nuevas. Revisá más tarde.</p>
        </div>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
            {solicitudes.map((solicitud) => (
              <SolicitudCard key={solicitud.obra_id} solicitud={solicitud} />
            ))}
          </div>
          {(hayMasSolicitudes || solicitudes.length > 0) && (
            <div className="text-center py-3">
              <button
                onClick={() => router.push('/socio/oportunidades')}
                className="text-sm text-[#276EF1] hover:text-[#1E56D9] font-medium"
              >
                Ver más →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
