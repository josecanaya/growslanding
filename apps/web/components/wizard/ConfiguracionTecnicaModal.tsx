'use client';

import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Seleccion } from './SubgrupoAccordion';
import { CONFIGURACIONES_TECNICAS } from './config/configuracionesTecnicas';
import type { ConfiguracionTecnicaCampo } from './config/configuracionesTecnicas';

interface ConfiguracionTecnicaModalProps {
  elemento: any;
  subgrupo: string;
  onClose: () => void;
  onAgregar: (seleccion: Seleccion) => void;
  elementosSeleccionados: Seleccion[];
}


export function ConfiguracionTecnicaModal({ 
  elemento, 
  subgrupo, 
  onClose, 
  onAgregar,
  elementosSeleccionados 
}: ConfiguracionTecnicaModalProps) {
  const [configuracion, setConfiguracion] = useState<{ [key: string]: any }>({});
  
  const configuraciones: Record<string, ConfiguracionTecnicaCampo> =
    CONFIGURACIONES_TECNICAS[elemento.nombre] || {};
  
  const handleInputChange = (key: string, value: any) => {
    setConfiguracion(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAgregar = () => {
    // Crear descripción técnica detallada
    const descripcionTecnica = Object.entries(configuracion)
      .map(([key, value]) => {
        const config = configuraciones[key];
        if (!config) return '';
        return `${config.label}: ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    const seleccion: Seleccion = {
      subgrupo,
      elementoNombre: elemento.nombre,
      opcionId: `${elemento.nombre}-${Date.now()}`,
      opcionLabel: descripcionTecnica || elemento.nombre,
      unidad: 'm²',
      duracionEstimadaDias: ([...elemento.fases.estructura, ...elemento.fases.obra_gris, ...elemento.fases.terminaciones].length) * 2,
      tareasSugeridas: [...elemento.fases.estructura, ...elemento.fases.obra_gris, ...elemento.fases.terminaciones]
    };

    onAgregar(seleccion);
    onClose();
  };

  const yaSeleccionado = elementosSeleccionados.some(s => 
    s.subgrupo === subgrupo && s.elementoNombre === elemento.nombre
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Configuración Técnica
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {elemento.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(configuraciones).map(([key, config]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.label}
                </label>
                
                {config.type === 'select' && (
                  <select
                    value={configuracion[key] || config.default || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {config.options?.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                
                {config.type === 'number' && (
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    defaultValue={typeof config.default === 'number' ? config.default : undefined}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                
                {config.type === 'text' && (
                  <input
                    type="text"
                    placeholder={config.placeholder}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                
                {config.type === 'checkbox' && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      onChange={(e) => handleInputChange(key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{config.label}</span>
                  </label>
                )}
              </div>
            ))}
            
            {Object.keys(configuraciones).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay configuraciones técnicas específicas para este elemento.</p>
                <p className="text-sm mt-1">Se agregará con configuración estándar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {yaSeleccionado && (
                <span className="text-orange-600 font-medium">
                  ⚠️ Ya existe una configuración para este elemento
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregar}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Elemento</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
