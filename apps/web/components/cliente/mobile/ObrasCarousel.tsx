'use client';

import { ChevronRight } from 'lucide-react';

interface Obra {
  id: string;
  name: string;
  estado: string;
}

interface ObrasCarouselProps {
  obras: Obra[];
  obraSeleccionada: string;
  onObraSelect: (id: string) => void;
  onVerTodas: () => void;
}

export function ObrasCarousel({
  obras,
  obraSeleccionada,
  onObraSelect,
  onVerTodas,
}: ObrasCarouselProps) {
  // Ordenar: Activas primero, luego Pausadas, luego otras
  const obrasOrdenadas = [...obras].sort((a, b) => {
    const order: Record<string, number> = { ACTIVA: 0, PAUSADA: 1, FINALIZADA: 2, CANCELADA: 3 };
    return (order[a.estado] ?? 99) - (order[b.estado] ?? 99);
  });

  // Limitar a 3 obras
  const obrasMostrar = obrasOrdenadas.slice(0, 3);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return 'bg-emerald-500';
      case 'PAUSADA':
        return 'bg-amber-500';
      case 'FINALIZADA':
        return 'bg-blue-500';
      case 'CANCELADA':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return 'Activa';
      case 'PAUSADA':
        return 'Pausada';
      case 'FINALIZADA':
        return 'Terminada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Obra activa</h3>
        {obras.length > 3 && (
          <button
            onClick={onVerTodas}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 snap-x snap-mandatory">
        {obrasMostrar.map((obra) => {
          const isSelected = obraSeleccionada === obra.id;
          return (
            <button
              key={obra.id}
              onClick={() => onObraSelect(obra.id)}
              className={`
                flex-shrink-0 w-[calc(100vw-4rem)] max-w-[280px] 
                p-3 rounded-lg border text-left transition-all snap-start
                ${isSelected
                  ? 'border-blue-400 bg-blue-50/50 shadow-sm ring-1 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                }
              `}
            >
              <p
                className={`text-sm font-semibold mb-2 truncate leading-tight ${
                  isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}
              >
                {obra.name}
              </p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${getEstadoColor(obra.estado)}`} />
                <span className="text-xs font-medium text-gray-600">
                  {getEstadoTexto(obra.estado)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}




