'use client';

import React from 'react';
import {
  Trash2,
  Edit,
  Package,
  Layers,
  Calendar,
  Check
} from 'lucide-react';

interface Seleccion {
  subgrupo: string;
  elementoNombre: string;
  opcionId: string;
  opcionLabel: string;
  unidad?: string;
  duracionEstimadaDias?: number;
  tareasSugeridas?: string[];
  configuracionTecnica?: Record<string, any>;
}

interface ObraData {
  nombre: string;
  localizacion: string;
  estado: string;
  fecha_inicio: string;
  tipo_obra: string;
}

interface PasoResumenProps {
  obraData: ObraData;
  elementosSeleccionados: Seleccion[];
  onEditarCategoria: (categoria: string) => void;
}

export function PasoResumen({ obraData, elementosSeleccionados, onEditarCategoria }: PasoResumenProps) {
  const handleQuitarSeleccion = (opcionId: string) => {
    // Esta función se manejará en el componente padre
    console.log('Quitar selección:', opcionId);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Resumen de Selección</h3>
          <p className="text-gray-600">
            Revisa y confirma los elementos constructivos seleccionados para tu obra
          </p>
        </div>

        {/* Información de la Obra */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">Información de la Obra</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-700">Nombre:</label>
              <p className="text-blue-900">{obraData.nombre}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Ubicación:</label>
              <p className="text-blue-900">{obraData.localizacion}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Fecha de Inicio:</label>
              <p className="text-blue-900">{obraData.fecha_inicio || 'No especificada'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Tipo de Obra:</label>
              <p className="text-blue-900">{obraData.tipo_obra || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{elementosSeleccionados.length}</div>
            <div className="text-sm text-gray-600">Elementos</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {elementosSeleccionados.reduce((total, sel) => total + (sel.tareasSugeridas?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Tareas</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {elementosSeleccionados.reduce((total, sel) => total + (sel.duracionEstimadaDias || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Días</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(elementosSeleccionados.map(el => el.subgrupo)).size}
            </div>
            <div className="text-sm text-gray-600">Categorías</div>
          </div>
        </div>

        {/* Lista de elementos por categoría */}
        <div className="space-y-6">
          {Object.entries(
            elementosSeleccionados.reduce((acc, seleccion) => {
              if (!acc[seleccion.subgrupo]) acc[seleccion.subgrupo] = [];
              acc[seleccion.subgrupo].push(seleccion);
              return acc;
            }, {} as Record<string, Seleccion[]>)
          ).map(([subgrupo, selecciones]) => (
            <div key={subgrupo} className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-semibold text-gray-900">{subgrupo}</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {selecciones.length} elementos
                    </span>
                  </div>
                  <button
                    onClick={() => onEditarCategoria(subgrupo)}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>

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
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              {seleccion.opcionLabel}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <span>Unidad: <strong>{seleccion.unidad}</strong></span>
                            <span>Duración: <strong>{seleccion.duracionEstimadaDias} días</strong></span>
                            <span>Tareas: <strong>{seleccion.tareasSugeridas?.length || 0}</strong></span>
                          </div>

                          {seleccion.configuracionTecnica && (
                            <div className="mt-2">
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                  Ver configuración técnica
                                </summary>
                                <div className="mt-2 pl-4 border-l-2 border-blue-200">
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {JSON.stringify(seleccion.configuracionTecnica, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleQuitarSeleccion(seleccion.opcionId)}
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

        {elementosSeleccionados.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-semibold text-gray-500 mb-2">No hay elementos seleccionados</h4>
            <p className="text-gray-400">Ve a las etapas anteriores para seleccionar elementos constructivos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

