'use client';

import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button, Badge } from '@/components/ui/grows';
import { cn } from '@/lib/utils';

interface TareaSinPresupuesto {
  id: string;
  titulo: string;
  etapa: string | null;
  duracionEstimada?: number | null;
}

interface ListaTareasSinPresupuestoProps {
  tareas: TareaSinPresupuesto[];
  etapa: string;
  onSolicitarPresupuesto: (tareaIds: string[]) => void;
  disabled?: boolean;
}

export function ListaTareasSinPresupuesto({
  tareas,
  etapa,
  onSolicitarPresupuesto,
  disabled = false,
}: ListaTareasSinPresupuestoProps) {
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  const toggleSeleccion = (tareaId: string) => {
    setSeleccionadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(tareaId)) {
        nuevo.delete(tareaId);
      } else {
        nuevo.add(tareaId);
      }
      return nuevo;
    });
  };

  const seleccionarTodas = () => {
    if (seleccionadas.size === tareas.length) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(tareas.map((t) => t.id)));
    }
  };

  const handleSolicitar = () => {
    if (seleccionadas.size > 0) {
      onSolicitarPresupuesto(Array.from(seleccionadas));
      setSeleccionadas(new Set());
    }
  };

  if (tareas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Tareas sin presupuesto</h3>
          <p className="text-xs text-slate-500">
            {tareas.length} tarea{tareas.length === 1 ? '' : 's'} pendiente{tareas.length === 1 ? '' : 's'} de solicitar presupuesto
          </p>
        </div>
        <div className="flex gap-2">
          {tareas.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={seleccionarTodas}
              className="text-xs"
            >
              {seleccionadas.size === tareas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<Send className="h-3 w-3" />}
            onClick={handleSolicitar}
            disabled={disabled || seleccionadas.size === 0}
          >
            Solicitar presupuesto {seleccionadas.size > 0 && `(${seleccionadas.size})`}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {tareas.map((tarea) => {
          const estaSeleccionada = seleccionadas.has(tarea.id);
          return (
            <div
              key={tarea.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                estaSeleccionada
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <button
                type="button"
                onClick={() => toggleSeleccion(tarea.id)}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                  estaSeleccionada
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-slate-300 bg-white'
                )}
              >
                {estaSeleccionada && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{tarea.titulo}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="default" className="text-xs border-slate-300 bg-slate-50 text-slate-600">
                    Sin presupuesto
                  </Badge>
                  {tarea.duracionEstimada && (
                    <span>{tarea.duracionEstimada} días estimados</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

