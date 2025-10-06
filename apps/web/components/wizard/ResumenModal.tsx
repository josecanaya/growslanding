'use client';

import { useState } from 'react';
import { X, Edit, Trash2, Download, Check } from 'lucide-react';
import { Seleccion } from './SubgrupoAccordion';

interface ResumenModalProps {
  elementosSeleccionados: Seleccion[];
  onClose: () => void;
  onQuitarSeleccion: (opcionId: string) => void;
}

export function ResumenModal({ 
  elementosSeleccionados, 
  onClose, 
  onQuitarSeleccion 
}: ResumenModalProps) {
  const [mostrarDetalles, setMostrarDetalles] = useState(true);

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

  const handleExportar = () => {
    // Crear contenido para exportar
    const contenido = elementosSeleccionados.map(sel => 
      `${sel.subgrupo} - ${sel.elementoNombre}: ${sel.opcionLabel}`
    ).join('\n');
    
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementos-constructivos.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Resumen de Elementos Constructivos
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configuración técnica detallada de la obra
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportar}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{elementosSeleccionados.length}</div>
              <div className="text-sm text-gray-600">Elementos</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalTareas}</div>
              <div className="text-sm text-gray-600">Tareas</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{duracionTotal}</div>
              <div className="text-sm text-gray-600">Días</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(seleccionesPorSubgrupo).length}
              </div>
              <div className="text-sm text-gray-600">Categorías</div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {elementosSeleccionados.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
                <p className="text-yellow-800 font-medium">
                  No hay elementos seleccionados
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Comienza seleccionando elementos en las etapas del wizard
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(seleccionesPorSubgrupo).map(([subgrupo, selecciones]) => (
                <div key={subgrupo} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  {/* Header del subgrupo */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{subgrupo}</h4>
                        <p className="text-sm text-gray-600">
                          {selecciones.length} elemento(s) configurado(s)
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                        {selecciones.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Lista de elementos */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {selecciones.map((seleccion) => (
                        <div
                          key={seleccion.opcionId}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold text-gray-900">
                                  {seleccion.elementoNombre}
                                </h5>
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                              
                              {mostrarDetalles && (
                                <div className="mb-3">
                                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Configuración técnica:</span>
                                    </p>
                                    <p className="text-sm text-gray-800 mt-1">
                                      {seleccion.opcionLabel}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                <span>Unidad: <strong>{seleccion.unidad}</strong></span>
                                <span>Duración: <strong>{seleccion.duracionEstimadaDias} días</strong></span>
                                <span>Tareas: <strong>{seleccion.tareasSugeridas?.length || 0}</strong></span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => onQuitarSeleccion(seleccion.opcionId)}
                              className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMostrarDetalles(!mostrarDetalles)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <Edit className="h-4 w-4" />
                <span>
                  {mostrarDetalles ? 'Ocultar detalles' : 'Mostrar detalles'}
                </span>
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
              >
                Cerrar
              </button>
              {elementosSeleccionados.length > 0 && (
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirmar Selección</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
