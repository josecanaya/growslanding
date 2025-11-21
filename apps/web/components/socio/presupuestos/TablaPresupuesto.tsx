'use client';

import React, { useMemo } from 'react';
import { FilaPresupuesto } from './FilaPresupuesto';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
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

interface TablaPresupuestoProps {
  presupuestos: PresupuestoItem[];
  onFieldChange: (tareaId: string, field: 'dias_reales' | 'monto', value: number | null) => void;
  editing: Map<string, { dias_reales: number | null; monto: number | null }>;
  isMobile?: boolean;
}

export function TablaPresupuesto({
  presupuestos,
  onFieldChange,
  editing,
  isMobile = false,
}: TablaPresupuestoProps) {
  // Agrupar por etapa
  const presupuestosPorEtapa = useMemo(() => {
    const grupos: Record<string, PresupuestoItem[]> = {
      ESTRUCTURA: [],
      OBRA_GRIS: [],
      TERMINACIONES: [],
      OTROS: [],
    };

    presupuestos.forEach((p) => {
      const etapa = p.tarea?.etapa?.toUpperCase() || 'OTROS';
      if (etapa.includes('ESTRUCTURA')) {
        grupos.ESTRUCTURA.push(p);
      } else if (etapa.includes('GRIS') || etapa.includes('OBRA_GRIS')) {
        grupos.OBRA_GRIS.push(p);
      } else if (etapa.includes('TERMINACION')) {
        grupos.TERMINACIONES.push(p);
      } else {
        grupos.OTROS.push(p);
      }
    });

    return grupos;
  }, [presupuestos]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {Object.entries(presupuestosPorEtapa).map(([etapa, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={etapa} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {etapa}
              </h3>
              {items.map((presupuesto) => (
                <FilaPresupuesto
                  key={presupuesto.id}
                  presupuesto={presupuesto}
                  onFieldChange={(field, value) => onFieldChange(presupuesto.tarea_id, field, value)}
                  editing={editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null }}
                  isMobile={true}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Tarea
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Duración sugerida
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Días reales
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Monto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Etapa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Planta / Altura
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(presupuestosPorEtapa).map(([etapa, items]) => {
              if (items.length === 0) return null;
              return (
                <React.Fragment key={etapa}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {etapa}
                    </td>
                  </tr>
                  {items.map((presupuesto) => (
                    <FilaPresupuesto
                      key={presupuesto.id}
                      presupuesto={presupuesto}
                      onFieldChange={(field, value) => onFieldChange(presupuesto.tarea_id, field, value)}
                      editing={editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null }}
                      isMobile={false}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

