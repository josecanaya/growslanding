'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';

interface PresupuestoCardProps {
  presupuesto: {
    obra_id: string;
    obra_name: string;
    direccion_completa?: string | null;
    fecha_inicio?: string | null;
    pendientes: number;
    enviados: number;
    aprobados: number;
    estado?: 'ENVIADO' | 'APROBADO' | 'RECHAZADO' | 'PENDIENTE';
    fecha_envio?: string;
    inicio_estimado?: string | null;
    cantidad_tareas?: number;
  };
}

export function PresupuestoCard({ presupuesto }: PresupuestoCardProps) {
  const router = useRouter();

  const getEstadoPrincipal = () => {
    // Priorizar estado explícito si existe
    if (presupuesto.estado) {
      switch (presupuesto.estado) {
        case 'APROBADO':
          return { texto: 'Aprobado', variant: 'success' as const };
        case 'ENVIADO':
          return { texto: 'Enviado, esperando respuesta', variant: 'warning' as const };
        case 'RECHAZADO':
          return { texto: 'Rechazado', variant: 'error' as const };
        case 'PENDIENTE':
          return { texto: 'Pendiente de envío', variant: 'info' as const };
      }
    }

    // Fallback a lógica anterior
    if (presupuesto.aprobados > 0) {
      return { texto: 'Aprobado', variant: 'success' as const };
    }
    if (presupuesto.enviados > 0) {
      return { texto: 'Enviado, esperando respuesta', variant: 'warning' as const };
    }
    if (presupuesto.pendientes > 0) {
      return { texto: 'Pendiente de envío', variant: 'info' as const };
    }
    return null;
  };

  const estado = getEstadoPrincipal();

  const handleClick = () => {
    router.push(`/socio/presupuestos?obra_id=${presupuesto.obra_id}`);
  };

  const formatFecha = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <Card
      className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900 text-sm">
                {presupuesto.obra_name}
              </h3>
            </div>
            {presupuesto.direccion_completa && (
              <p className="text-xs text-gray-600 line-clamp-1">
                {presupuesto.direccion_completa}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {estado && (
                <Badge variant={estado.variant} className="text-xs w-fit">
                  {estado.texto}
                </Badge>
              )}
              {presupuesto.cantidad_tareas && presupuesto.cantidad_tareas > 0 && (
                <span className="text-xs text-gray-500">
                  {presupuesto.cantidad_tareas} tareas
                </span>
              )}
              {presupuesto.inicio_estimado && (
                <span className="text-xs text-gray-500">
                  Inicio: {formatFecha(presupuesto.inicio_estimado)}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
