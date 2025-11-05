'use client';

import { CheckCircle, Layers, FileText, Settings } from 'lucide-react';

type ActivityItem = {
  id: string;
  tipo: 'tarea' | 'elemento' | 'documento' | 'configuracion';
  accion: string;
  usuario: string;
  planta?: string;
  categoria?: string;
  fecha: string;
  icon?: 'check' | 'brick' | 'file' | 'config';
};

type ActivityListProps = {
  items: ActivityItem[];
  maxItems?: number;
};

const iconMap = {
  check: CheckCircle,
  brick: Layers,
  file: FileText,
  config: Settings
};

const iconColors: Record<string, string> = {
  'tarea': '#10b981',
  'elemento': '#3b82f6',
  'documento': '#6366f1',
  'configuracion': '#f59e0b'
};

export default function ActivityList({ items, maxItems = 5 }: ActivityListProps) {
  const displayedItems = items.slice(0, maxItems);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {displayedItems.map((item) => {
          const IconComponent = iconMap[item.icon || 'check'] || CheckCircle;
          const color = iconColors[item.tipo] || '#6b7280';

          return (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <IconComponent className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.accion}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{item.usuario}</span>
                    {item.planta && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{item.planta}</span>
                      </>
                    )}
                    {item.categoria && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{item.categoria}</span>
                      </>
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{item.fecha}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No hay actividad reciente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

