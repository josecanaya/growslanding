'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Badge } from '@/components/ui/grows/Badge';
import { Button } from '@/components/ui/button';
import { getUrgenciaStyle, USE_MOCK_DATA } from '@/lib/mocks/socioMockData';
import { ChevronRight } from 'lucide-react';

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

/**
 * Fila estilo `oportunidades_responsive_lista` (Stitch): título, subtítulo, CTA bajo.
 */
export function SolicitudOportunidadCard({ solicitud }: SolicitudOportunidadCardProps) {
  const router = useRouter();
  const demoPresupuestoRoute = '/socio/presupuestos/ejemplo' as Route;

  const formatFechaCorta = (fechaISO: string | null) => {
    if (!fechaISO) return 'No definida';
    try {
      const date = new Date(fechaISO);
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
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
    e.stopPropagation();
    if (USE_MOCK_DATA) {
      router.push(demoPresupuestoRoute);
      return;
    }
    router.push(`/socio/presupuestos?obra_id=${solicitud.obra_id}` as Route);
  };

  const handleVerDetalles = () => {
    if (USE_MOCK_DATA) {
      router.push(demoPresupuestoRoute);
      return;
    }
    router.push(`/socio/presupuestos?obra_id=${solicitud.obra_id}` as Route);
  };

  const getEstadoBadge = () => {
    if (solicitud.estado_solicitud === 'PRESUPUESTO_ENVIADO') {
      return (
        <Badge variant="warning" size="sm" className="text-[10px]">
          Enviado
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm" className="text-[10px]">
        Recibiendo
      </Badge>
    );
  };

  const urgenciaStyle = solicitud.urgencia
    ? getUrgenciaStyle(solicitud.urgencia)
    : { borderColor: 'border-stitch-surface-container', badgeVariant: 'default' as const, badgeText: '' };

  const subLineParts: string[] = [solicitud.zona];
  const d = formatDuracion(solicitud.duracion_estimada_dias);
  if (d) subLineParts.push(d);
  if (solicitud.fecha_inicio_estimada) {
    subLineParts.push(`Inicio ${formatFechaCorta(solicitud.fecha_inicio_estimada)}`);
  }
  const subLine = subLineParts.filter(Boolean).join(' · ');

  return (
    <div className="bg-white p-4 transition-colors hover:bg-stitch-primary/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-stitch-headline text-[15px] font-bold text-stitch-on-surface">
              {solicitud.tipo_trabajo}
            </h3>
            {solicitud.urgencia === 'ALTA' && (
              <span className="inline-block rounded bg-stitch-error/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-stitch-error">
                Urgente
              </span>
            )}
          </div>
          {solicitud.etapa && (
            <p className="text-xs text-stitch-on-surface/60">{solicitud.etapa}</p>
          )}
          <p className="mt-0.5 text-xs font-medium text-stitch-on-surface/65">{subLine}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {getEstadoBadge()}
          {urgenciaStyle.badgeText ? (
            <Badge variant={urgenciaStyle.badgeVariant} size="sm" className="text-[10px]">
              {urgenciaStyle.badgeText}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {solicitud.estado_solicitud === 'RECIBIENDO_PRESUPUESTOS' ? (
          <Button
            type="button"
            onClick={handleEnviarPresupuesto}
            size="sm"
            className="h-9 flex-1 bg-stitch-primary text-white hover:bg-stitch-primary-container"
          >
            Presupuestar
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleVerDetalles}
            size="sm"
            variant="outline"
            className="h-9 flex-1 border-stitch-surface-container"
          >
            Ver estado
          </Button>
        )}
        <span className="ml-2 text-stitch-outline" aria-hidden>
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
