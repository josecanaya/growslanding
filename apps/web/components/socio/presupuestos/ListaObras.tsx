'use client';

import { Building2, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows/Button';
import { Badge } from '@/components/ui/grows/Badge';

interface ObraConPresupuestos {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
}

interface ListaObrasProps {
  obras: ObraConPresupuestos[];
  loading?: boolean;
}

export function ListaObras({ obras, loading }: ListaObrasProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No hay presupuestos pendientes
        </h3>
        <p className="text-sm text-slate-500">
          Cuando recibas solicitudes de presupuesto, aparecerán acá.
        </p>
      </div>
    );
  }

  return (
    <div>
      {obras.map((obra) => {
        return (
          <div
            key={obra.obra_id}
            className="bg-white border-b border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
            onClick={() => router.push(`/socio/presupuestos?obra_id=${obra.obra_id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {obra.obra_name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                  {obra.direccion_completa && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{obra.direccion_completa}</span>
                    </div>
                  )}
                  {obra.fecha_inicio && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{obra.fecha_inicio}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {obra.pendientes > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      {obra.pendientes} Pendiente{obra.pendientes !== 1 ? 's' : ''}
                    </span>
                  )}
                  {obra.enviados > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {obra.enviados} Enviado{obra.enviados !== 1 ? 's' : ''}
                    </span>
                  )}
                  {obra.aprobados > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      {obra.aprobados} Aprobado{obra.aprobados !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

