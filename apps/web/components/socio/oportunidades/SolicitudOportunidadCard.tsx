'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/grows/Badge';
import { Button } from '@/components/ui/button';
import { getUrgenciaStyle } from '@/lib/mocks/socioMockData';

interface SolicitudOportunidadCardProps {
  solicitud: {
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
  };
}

export function SolicitudOportunidadCard({ solicitud }: SolicitudOportunidadCardProps) {
  const router = useRouter();

  // Formato corto de fecha: "1 ene" en lugar de "1 de enero de 2026"
  const formatFechaCorta = (fechaISO: string | null) => {
    if (!fechaISO) return 'No definida';
    try {
      const date = new Date(fechaISO);
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDuracion = (dias: number | null) => {
    if (!dias) return null;
    if (dias === 1) return '1 día';
    return `${dias} días`;
  };

  const handleEnviarPresupuesto = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se propague el click del contenedor
    router.push(`/socio/presupuestos?obra_id=${solicitud.obra_id}`);
  };

  const handleVerDetalles = () => {
    router.push(`/socio/presupuestos?obra_id=${solicitud.obra_id}`);
  };

  const getEstadoBadge = () => {
    if (solicitud.estado_solicitud === 'PRESUPUESTO_ENVIADO') {
      return (
        <Badge variant="warning" size="sm" className="text-xs">
          Presupuesto enviado
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm" className="text-xs">
        Recibiendo presupuestos
      </Badge>
    );
  };

  // Obtener estilo de urgencia
  const urgenciaStyle = solicitud.urgencia
    ? getUrgenciaStyle(solicitud.urgencia)
    : { borderColor: 'border-gray-200', badgeVariant: 'default' as const, badgeText: '' };

  // Construir línea de información compacta
  const infoParts: string[] = [];
  if (solicitud.fecha_inicio_estimada) {
    infoParts.push(`Inicio: ${formatFechaCorta(solicitud.fecha_inicio_estimada)}`);
  }
  const duracion = formatDuracion(solicitud.duracion_estimada_dias);
  if (duracion) {
    infoParts.push(duracion);
  }
  if (solicitud.cantidad_tareas && solicitud.cantidad_tareas > 0) {
    infoParts.push(`${solicitud.cantidad_tareas} tareas`);
  }

  return (
    <div
      className={`
        border-l-4 ${urgenciaStyle.borderColor} 
        bg-white 
        px-4 py-4
      `}
    >
      <div className="space-y-3">
        {/* Información principal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Línea 1: Tipo de trabajo + etapa */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {solicitud.tipo_trabajo}
                {solicitud.etapa && (
                  <span className="text-gray-500 font-normal"> · {solicitud.etapa}</span>
                )}
              </h3>
            </div>

            {/* Línea 2: Zona */}
            <p className="text-xs text-gray-600 leading-tight">
              {solicitud.zona}
            </p>

            {/* Línea 3: Info compacta */}
            {infoParts.length > 0 && (
              <p className="text-xs text-gray-500 leading-tight">
                {infoParts.join(' · ')}
              </p>
            )}
          </div>

          {/* Badges a la derecha */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {urgenciaStyle.badgeText && (
              <Badge variant={urgenciaStyle.badgeVariant} size="sm" className="text-xs">
                {urgenciaStyle.badgeText}
              </Badge>
            )}
            {getEstadoBadge()}
          </div>
        </div>

        {/* CTA: Enviar presupuesto */}
        {solicitud.estado_solicitud === 'RECIBIENDO_PRESUPUESTOS' ? (
          <Button
            onClick={handleEnviarPresupuesto}
            className="w-full bg-[#276EF1] hover:bg-[#1E56D9] text-white"
            size="default"
          >
            Enviar presupuesto
          </Button>
        ) : (
          <Button
            onClick={handleVerDetalles}
            variant="outline"
            className="w-full"
            size="default"
          >
            Ver estado del presupuesto
          </Button>
        )}
      </div>
    </div>
  );
}


