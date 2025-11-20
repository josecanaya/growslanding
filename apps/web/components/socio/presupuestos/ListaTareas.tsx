'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TareaItem } from './TareaItem';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
  } | null;
}

interface ListaTareasProps {
  presupuestos: PresupuestoItem[];
  onFieldChange: (tareaId: string, field: 'dias_reales' | 'monto', value: number | null) => void;
  editing: Map<string, { dias_reales: number | null; monto: number | null }>;
}

export function ListaTareas({
  presupuestos,
  onFieldChange,
  editing,
}: ListaTareasProps) {
  // Agrupar por etapa
  const grupos = {
    ESTRUCTURA: presupuestos.filter(p => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      return etapa.includes('ESTRUCTURA');
    }),
    OBRA_GRIS: presupuestos.filter(p => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      return etapa.includes('GRIS') || etapa.includes('OBRA_GRIS');
    }),
    TERMINACIONES: presupuestos.filter(p => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      return etapa.includes('TERMINACION');
    }),
    OTROS: presupuestos.filter(p => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      return !etapa.includes('ESTRUCTURA') && !etapa.includes('GRIS') && !etapa.includes('TERMINACION');
    }),
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    ESTRUCTURA: true,
    OBRA_GRIS: true,
    TERMINACIONES: true,
    OTROS: true,
  });

  const toggleGrupo = (grupo: string) => {
    setExpanded(prev => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  const getEtapaLabel = (etapa: string) => {
    if (etapa === 'ESTRUCTURA') return 'Estructura';
    if (etapa === 'OBRA_GRIS') return 'Obra Gris';
    if (etapa === 'TERMINACIONES') return 'Terminaciones';
    return 'Otros';
  };


  return (
    <div className="pb-24">
      {Object.entries(grupos).map(([etapa, items]) => {
        if (items.length === 0) return null;
        const isExpanded = expanded[etapa];

        return (
          <div key={etapa} className="border-b border-slate-100 last:border-b-0">
            {/* Header del grupo */}
            <button
              onClick={() => toggleGrupo(etapa)}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {getEtapaLabel(etapa)}
                </span>
                <span className="text-xs text-slate-500">
                  ({items.length} {items.length === 1 ? 'tarea' : 'tareas'})
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* Tareas del grupo */}
            {isExpanded && (
              <div>
                {items.map((presupuesto) => {
                  const editData = editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null };
                  
                  return (
                    <TareaItem
                      key={presupuesto.id}
                      presupuesto={presupuesto}
                      editing={editData}
                      onFieldChange={(field, value) => onFieldChange(presupuesto.tarea_id, field, value)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

