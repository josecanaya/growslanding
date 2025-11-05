'use client';

import { useState } from 'react';
import { 
  Check, 
  Edit, 
  Trash2, 
  Package, 
  Calendar, 
  Layers,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import type { Seleccion } from '@/components/cliente/SubgrupoAccordion';

interface PasoResumenSeleccionProps {
  elementosSeleccionados: Seleccion[];
  onElementosChange: (elementos: Seleccion[]) => void;
  onEditarCategoria: (categoria: string) => void;
  onConfirmar: () => void;
}

export function PasoResumenSeleccion({ 
  elementosSeleccionados, 
  onElementosChange, 
  onEditarCategoria,
  onConfirmar
}: PasoResumenSeleccionProps) {
  const handleQuitarSeleccion = (opcionId: string) => {
    onElementosChange(elementosSeleccionados.filter(s => s.opcionId !== opcionId));
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

        {/* Botón de confirmación */}
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <Check className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-green-900 mb-2">
              ¡Listo para continuar!
            </h4>
            <p className="text-green-700 mb-4">
              Has seleccionado {elementosSeleccionados.length} elementos constructivos que generarán{' '}
              {elementosSeleccionados.reduce((total, sel) => total + (sel.tareasSugeridas?.length || 0), 0)} tareas con una duración total de{' '}
              {elementosSeleccionados.reduce((total, sel) => total + (sel.duracionEstimadaDias || 0), 0)} días.
            </p>
            <button
              onClick={onConfirmar}
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Confirmar y continuar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

