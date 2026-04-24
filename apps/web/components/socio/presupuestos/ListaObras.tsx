'use client';

import { Building2, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows/Button';
import { Badge } from '@/components/ui/grows/Badge';
import { cn } from '@/lib/utils';

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
  stitchMode?: boolean;
}

export function ListaObras({ obras, loading, stitchMode = false }: ListaObrasProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse rounded-2xl border p-4',
              stitchMode
                ? 'border-stitch-primary/10 bg-stitch-surface-container-lowest'
                : 'rounded-lg border-slate-200 bg-white',
            )}
          >
            <div className="mb-2 h-6 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div
        className={cn(
          'border p-8 text-center',
          stitchMode
            ? 'rounded-2xl border-stitch-primary/10 bg-stitch-surface-container-lowest shadow-stitch-nav'
            : 'rounded-lg border-slate-200 bg-white',
        )}
      >
        <Building2
          className={cn('mx-auto mb-4 h-12 w-12', stitchMode ? 'text-stitch-primary/40' : 'text-slate-400')}
        />
        <h3
          className={cn(
            'mb-2 text-lg font-semibold',
            stitchMode ? 'font-stitch-headline text-stitch-primary' : 'text-slate-900',
          )}
        >
          No hay presupuestos pendientes
        </h3>
        <p className={cn('text-sm', stitchMode ? 'text-stitch-on-surface/70' : 'text-slate-500')}>
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
            className={cn(
              'cursor-pointer border px-4 py-3 transition-colors active:scale-[0.99]',
              stitchMode
                ? 'mb-3 rounded-2xl border-stitch-primary/10 bg-stitch-surface-container-lowest shadow-stitch-nav hover:border-stitch-primary/25'
                : 'border-b border-slate-100 bg-white hover:bg-slate-50 active:bg-slate-100',
            )}
            onClick={() => router.push(`/socio/presupuestos?obra_id=${obra.obra_id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Building2
                    className={cn('h-4 w-4 flex-shrink-0', stitchMode ? 'text-stitch-primary' : 'text-slate-600')}
                  />
                  <h3
                    className={cn(
                      'truncate text-sm font-semibold',
                      stitchMode ? 'font-stitch-headline text-stitch-on-surface' : 'text-slate-900',
                    )}
                  >
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

              <ArrowRight
                className={cn('h-5 w-5 flex-shrink-0', stitchMode ? 'text-stitch-primary/50' : 'text-slate-400')}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

