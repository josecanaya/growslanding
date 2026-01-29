'use client';

interface Obra {
  id: string;
  name: string;
  estado: string;
}

interface ObraActivaCardProps {
  obra: Obra | null;
  tareasEstaSemana?: number;
  presupuestoEstaSemana?: number;
  avance?: number;
  formatCurrency: (v: number) => string;
  onCambiarObra: (e?: React.MouseEvent) => void;
}

export function ObraActivaCard({
  obra,
  tareasEstaSemana = 0,
  presupuestoEstaSemana = 0,
  avance = 0,
  formatCurrency,
  onCambiarObra,
}: ObraActivaCardProps) {
  if (!obra) return null;

  const getEstadoConfig = (estado: string) => {
    const estadoUpper = estado?.toUpperCase() || '';
    switch (estadoUpper) {
      case 'ACTIVA':
        return {
          bg: 'bg-emerald-50',
          dot: 'bg-emerald-500',
          text: 'text-emerald-700',
          label: 'Activa',
        };
      case 'PAUSADA':
        return {
          bg: 'bg-amber-50',
          dot: 'bg-amber-500',
          text: 'text-amber-700',
          label: 'Pausada',
        };
      case 'FINALIZADA':
        return {
          bg: 'bg-blue-50',
          dot: 'bg-blue-500',
          text: 'text-blue-700',
          label: 'Terminada',
        };
      case 'CANCELADA':
        return {
          bg: 'bg-red-50',
          dot: 'bg-red-500',
          text: 'text-red-700',
          label: 'Cancelada',
        };
      case 'PENDIENTE':
        return {
          bg: 'bg-gray-50',
          dot: 'bg-gray-400',
          text: 'text-gray-600',
          label: 'Pendiente',
        };
      default:
        return {
          bg: 'bg-gray-50',
          dot: 'bg-gray-400',
          text: 'text-gray-600',
          label: estado || 'Pendiente',
        };
    }
  };

  const estadoConfig = getEstadoConfig(obra.estado);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Nombre */}
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-2">
            {obra.name}
          </h3>

          {/* Chip estado + Mini-métricas en una línea */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chip estado */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${estadoConfig.bg} flex-shrink-0`}>
              <div className={`w-1.5 h-1.5 rounded-full ${estadoConfig.dot}`} />
              <span className={`text-xs font-medium ${estadoConfig.text}`}>
                {estadoConfig.label}
              </span>
            </div>
            
            {/* Mini-métricas */}
            <div className="text-xs text-gray-500 whitespace-nowrap">
              Semana: {tareasEstaSemana} tareas · {formatCurrency(presupuestoEstaSemana)} · {avance}% avance
            </div>
          </div>
        </div>

        {/* Botón cambiar (pill pequeño) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCambiarObra(e);
          }}
          className="flex-shrink-0 text-xs font-medium text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded-full border border-gray-200 bg-transparent hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}

