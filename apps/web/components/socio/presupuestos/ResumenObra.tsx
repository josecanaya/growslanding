'use client';

import { useState } from 'react';
import { Building2, MapPin, Calendar, Layers, FileText } from 'lucide-react';
import { Button } from '@/components/ui/grows/Button';
import { cn } from '@/lib/utils';
import { ModalVerPlanos } from './ModalVerPlanos';

interface Obra {
  id: string;
  name: string;
  direccion_completa?: string | null;
  cantidad_plantas?: number | null;
  fecha_inicio?: string | null;
}

interface ResumenObraProps {
  obra: Obra;
  /** Card estilo Stitch (reforma) */
  stitchMode?: boolean;
}

export function ResumenObra({ obra, stitchMode = false }: ResumenObraProps) {
  const [modalPlanosOpen, setModalPlanosOpen] = useState(false);

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return null;
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  return (
    <>
      <div
        className={cn(
          'px-4 py-3 border-b',
          stitchMode
            ? 'border-stitch-primary/10 bg-stitch-surface-container-lowest shadow-sm'
            : 'border-slate-100 bg-white',
        )}
      >
        <div className="flex items-start gap-2 mb-2">
          <Building2
            className={cn(
              'h-4 w-4 mt-0.5 flex-shrink-0',
              stitchMode ? 'text-stitch-primary' : 'text-slate-600',
            )}
          />
          <h2
            className={cn(
              'text-base font-semibold',
              stitchMode ? 'font-stitch-headline text-stitch-primary' : 'text-slate-900',
            )}
          >
            {obra.name}
          </h2>
        </div>
        
        <div
          className={cn(
            'mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs',
            stitchMode ? 'text-stitch-on-surface/75' : 'text-slate-600',
          )}
        >
          {obra.direccion_completa && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{obra.direccion_completa}</span>
            </div>
          )}
          
          {obra.cantidad_plantas && (
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{obra.cantidad_plantas} {obra.cantidad_plantas === 1 ? 'planta' : 'plantas'}</span>
            </div>
          )}
          
          {obra.fecha_inicio && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatFecha(obra.fecha_inicio)}</span>
            </div>
          )}
        </div>

        {/* Botón Ver Planos */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setModalPlanosOpen(true)}
          className="mt-1"
        >
          <FileText className="h-3 w-3 mr-1.5" />
          Ver planos
        </Button>
      </div>

      <ModalVerPlanos
        open={modalPlanosOpen}
        onClose={() => setModalPlanosOpen(false)}
        obraId={obra.id}
      />
    </>
  );
}
