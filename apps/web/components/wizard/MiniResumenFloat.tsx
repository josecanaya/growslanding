'use client';

import { useState } from 'react';
import { Package, X } from 'lucide-react';
import { Seleccion } from './SubgrupoAccordion';

interface MiniResumenFloatProps {
  elementosSeleccionados: Seleccion[];
  onQuitarSeleccion: (opcionId: string) => void;
}

export function MiniResumenFloat({ 
  elementosSeleccionados, 
  onQuitarSeleccion 
}: MiniResumenFloatProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (elementosSeleccionados.length === 0) {
    return null;
  }

  // Agrupar selecciones por subgrupo
  const seleccionesPorSubgrupo = elementosSeleccionados.reduce((acc, seleccion) => {
    if (!acc[seleccion.subgrupo]) {
      acc[seleccion.subgrupo] = [];
    }
    acc[seleccion.subgrupo].push(seleccion);
    return acc;
  }, {} as Record<string, Seleccion[]>);

  const totalTareas = elementosSeleccionados.reduce((total, sel) => 
    total + (sel.tareasSugeridas?.length || 0), 0
  );

  const duracionTotal = elementosSeleccionados.reduce((total, sel) => 
    total + (sel.duracionEstimadaDias || 0), 0
  );

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <Package className="h-5 w-5" />
          <span className="font-semibold text-sm">
            {elementosSeleccionados.length}
          </span>
        </button>
      </div>

      {/* Modal de resumen */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Resumen de Selección
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {elementosSeleccionados.length}
                  </div>
                  <div className="text-xs text-gray-600">Elementos</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalTareas}
                  </div>
                  <div className="text-xs text-gray-600">Tareas</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {duracionTotal}
                  </div>
                  <div className="text-xs text-gray-600">Días</div>
                </div>
              </div>

              {/* Lista detallada */}
              <div className="space-y-4">
                {Object.entries(seleccionesPorSubgrupo).map(([subgrupo, selecciones]) => (
                  <div key={subgrupo} className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2">{subgrupo}</h4>
                    <div className="space-y-2">
                      {selecciones.map((seleccion) => (
                        <div
                          key={seleccion.opcionId}
                          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {seleccion.elementoNombre}
                            </div>
                            <div className="text-xs text-gray-600">
                              {seleccion.opcionLabel} • {seleccion.unidad} • {seleccion.duracionEstimadaDias}d
                            </div>
                          </div>
                          <button
                            onClick={() => onQuitarSeleccion(seleccion.opcionId)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: {elementosSeleccionados.length} elementos seleccionados
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
