'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Calendar, Clock, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/grows/Badge';
import { getUrgenciaStyle } from '@/lib/mocks/socioMockData';

interface SolicitudCardProps {
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

export function SolicitudCard({ solicitud }: SolicitudCardProps) {
  const router = useRouter();

  // Formato corto de fecha: "1 ene"
  const formatFechaCorta = (fechaISO: string | null) => {
    if (!fechaISO) return null;
    try {
      const date = new Date(fechaISO);
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return null;
    }
  };

  // Formato corto de duración: "30 d"
  const formatDuracionCorta = (dias: number | null) => {
    if (!dias) return null;
    return `${dias} d`;
  };

  // Click en toda la fila navega a oportunidades
  const handleClick = () => {
    router.push(`/socio/oportunidades?obra_id=${solicitud.obra_id}`);
  };

  const getEstadoBadge = () => {
    if (solicitud.estado_solicitud === 'PRESUPUESTO_ENVIADO') {
      return (
        <Badge variant="warning" size="sm" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
          Enviado
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm" className="text-xs bg-green-100 text-green-800 border-green-300">
        Recibiendo
      </Badge>
    );
  };

  // Obtener estilo de urgencia con colores más vibrantes
  const urgenciaStyle = solicitud.urgencia
    ? getUrgenciaStyle(solicitud.urgencia)
    : { borderColor: 'border-gray-200', badgeVariant: 'default' as const, badgeText: '' };

  // Ajustar colores de badges según urgencia
  const getUrgenciaBadgeColor = () => {
    if (solicitud.urgencia === 'ALTA') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    if (solicitud.urgencia === 'MEDIA') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return '';
  };

  // Limpiar título: quitar repeticiones
  const getTituloLimpio = () => {
    let titulo = solicitud.tipo_trabajo;
    // Si el título ya contiene la etapa, no duplicar
    if (solicitud.etapa && !titulo.toLowerCase().includes(solicitud.etapa.toLowerCase())) {
      titulo = `${titulo} · ${solicitud.etapa}`;
    }
    return titulo;
  };

  const fechaCorta = formatFechaCorta(solicitud.fecha_inicio_estimada);
  const duracionCorta = formatDuracionCorta(solicitud.duracion_estimada_dias);

  return (
    <div
      onClick={handleClick}
      className={`
        border-l-4 ${urgenciaStyle.borderColor} 
        bg-white 
        px-4 py-3 
        cursor-pointer 
        hover:bg-gray-50 
        transition-colors
        active:bg-gray-100
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Línea 1: Título limpio */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {getTituloLimpio()}
          </h3>

          {/* Línea 2: Zona */}
          <p className="text-xs text-gray-600 leading-tight">
            {solicitud.zona}
          </p>

          {/* Línea 3: Info con iconos */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {fechaCorta && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fechaCorta}
              </span>
            )}
            {duracionCorta && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duracionCorta}
              </span>
            )}
            {solicitud.cantidad_tareas && solicitud.cantidad_tareas > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {solicitud.cantidad_tareas}
              </span>
            )}
          </div>
        </div>

        {/* Badges a la derecha */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
            {urgenciaStyle.badgeText && (
              <Badge 
                variant={urgenciaStyle.badgeVariant} 
                size="sm" 
                className={`text-xs ${getUrgenciaBadgeColor()}`}
              >
                {urgenciaStyle.badgeText}
              </Badge>
            )}
            {getEstadoBadge()}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
        </div>
      </div>
    </div>
  );
}
