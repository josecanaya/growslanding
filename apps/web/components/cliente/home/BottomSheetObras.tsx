'use client';

import { X } from 'lucide-react';

interface Obra {
  id: string;
  name: string;
  estado: string;
}

interface BottomSheetObrasProps {
  isOpen: boolean;
  onClose: () => void;
  obras: Obra[];
  obraSeleccionada: string;
  onSelectObra: (id: string) => void;
}

export function BottomSheetObras({
  isOpen,
  onClose,
  obras,
  obraSeleccionada,
  onSelectObra,
}: BottomSheetObrasProps) {
  if (!isOpen) return null;

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

  const handleSelect = (id: string) => {
    onSelectObra(id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[65]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[66] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Seleccionar obra</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Lista de obras */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {obras.map((obra) => {
            const isSelected = obraSeleccionada === obra.id;
            return (
              <button
                key={obra.id}
                onClick={() => handleSelect(obra.id)}
                className={`
                  w-full text-left p-3 rounded-xl border transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`
                        text-sm font-semibold mb-1 truncate
                        ${isSelected ? 'text-gray-900' : 'text-gray-800'}
                      `}
                    >
                      {obra.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getEstadoColor(obra.estado)}`} />
                      <span className="text-xs text-gray-600">
                        {getEstadoTexto(obra.estado)}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}




