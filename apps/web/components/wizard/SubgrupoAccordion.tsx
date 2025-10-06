'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ElementoCard } from './ElementoCard';

interface SubgrupoAccordionProps {
  subgrupo: string;
  icono: string;
  elementos: any[];
  elementosSeleccionados: Seleccion[];
  onElementoSeleccionado: (seleccion: Seleccion) => void;
}

export interface Seleccion {
  subgrupo: string;
  elementoNombre: string;
  opcionId: string;
  opcionLabel: string;
  unidad?: string;
  duracionEstimadaDias?: number;
  tareasSugeridas?: string[];
}

export function SubgrupoAccordion({ 
  subgrupo, 
  icono, 
  elementos, 
  elementosSeleccionados,
  onElementoSeleccionado 
}: SubgrupoAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Contar elementos seleccionados en este subgrupo
  const seleccionesEnSubgrupo = elementosSeleccionados.filter(s => s.subgrupo === subgrupo);
  const badgeCount = seleccionesEnSubgrupo.length;

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200 rounded-xl"
        data-state={isOpen ? "open" : "closed"}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icono}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{subgrupo}</h3>
            <p className="text-sm text-gray-600">
              {elementos.length} elementos disponibles
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {badgeCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {badgeCount}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elementos.map((elemento) => (
                <ElementoCard
                  key={elemento.nombre}
                  elemento={elemento}
                  subgrupo={subgrupo}
                  elementosSeleccionados={elementosSeleccionados}
                  onElementoSeleccionado={onElementoSeleccionado}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

