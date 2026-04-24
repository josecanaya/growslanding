'use client';

import { useRouter } from 'next/navigation';
import { Zap, Droplets, Clock, MapPin, AlertTriangle } from 'lucide-react';

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

/** Tarjeta estilo `panel_responsive_home` (oportunidades con borde izquierdo e icono). */
export function SolicitudCard({ solicitud }: SolicitudCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/socio/oportunidades?obra_id=${solicitud.obra_id}`);
  };

  const getTituloLimpio = () => {
    let titulo = solicitud.tipo_trabajo;
    if (solicitud.etapa && !titulo.toLowerCase().includes(solicitud.etapa.toLowerCase())) {
      titulo = `${titulo} · ${solicitud.etapa}`;
    }
    return titulo;
  };

  const u = solicitud.urgencia;
  const borderClass =
    u === 'ALTA'
      ? 'border-l-stitch-error'
      : u === 'MEDIA'
        ? 'border-l-stitch-tertiary'
        : 'border-l-stitch-primary';

  const iconWrapClass =
    u === 'ALTA'
      ? 'bg-red-50 text-stitch-error'
      : u === 'MEDIA'
        ? 'bg-stitch-surface-container text-stitch-tertiary'
        : 'bg-stitch-surface-container text-stitch-primary';

  const MainIcon = u === 'ALTA' ? Zap : u === 'MEDIA' ? Droplets : Clock;

  const RightIcon = u === 'ALTA' ? AlertTriangle : Clock;
  const rightIconClass =
    u === 'ALTA' ? 'text-stitch-error animate-pulse' : 'text-stitch-tertiary';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border border-stitch-surface-container/70 border-l-4 bg-stitch-surface-container-lowest p-4 text-left shadow-sm transition hover:bg-stitch-surface-container-low ${borderClass}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
          <MainIcon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="font-stitch-headline text-sm font-bold leading-tight text-stitch-on-surface">
            {getTituloLimpio()}
          </p>
          <div className="mt-0.5 flex items-center gap-1 opacity-70">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate text-[11px] font-medium text-stitch-on-surface">
              {solicitud.zona || solicitud.direccion_completa}
            </span>
          </div>
        </div>
      </div>
      <RightIcon className={`h-5 w-5 flex-shrink-0 ${rightIconClass}`} strokeWidth={2} />
    </button>
  );
}
