'use client';

import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { ElementoConstructivo, OpcionElemento, ConfiguracionTecnica } from './catalogo-elementos';

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

interface ConfiguracionTecnicaModalProps {
  elemento: ElementoConstructivo;
  opcion: OpcionElemento;
  subgrupo: string;
  onClose: () => void;
  onAgregar: (elemento: ElementoConstructivo, opcion: OpcionElemento, configuracion: Record<string, any>) => void;
  elementosSeleccionados: Seleccion[];
}

export function ConfiguracionTecnicaModal({
  elemento,
  opcion,
  subgrupo,
  onClose,
  onAgregar,
  elementosSeleccionados
}: ConfiguracionTecnicaModalProps) {
  const [configuracion, setConfiguracion] = useState<Record<string, any>>({});

  const handleInputChange = (configId: string, value: any) => {
    setConfiguracion(prev => ({
      ...prev,
      [configId]: value
    }));
  };

  const handleSubmit = () => {
    // Validar que todas las configuraciones requeridas estén completas
    const configuracionesRequeridas = opcion.configuraciones.filter(config => config.requerido);
    const configuracionesCompletas = configuracionesRequeridas.every(config => 
      configuracion[config.id] !== undefined && configuracion[config.id] !== ''
    );

    if (configuracionesCompletas) {
      onAgregar(elemento, opcion, configuracion);
    }
  };

  const renderInput = (config: ConfiguracionTecnica) => {
    switch (config.tipo) {
      case 'select':
        return (
          <select
            value={configuracion[config.id] || ''}
            onChange={(e) => handleInputChange(config.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={config.requerido}
          >
            <option value="">Selecciona una opción</option>
            {config.opciones?.map((opcion) => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            min={config.min}
            max={config.max}
            value={configuracion[config.id] || ''}
            onChange={(e) => handleInputChange(config.id, parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={config.requerido}
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={configuracion[config.id] || ''}
            onChange={(e) => handleInputChange(config.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={config.requerido}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={configuracion[config.id] || false}
              onChange={(e) => handleInputChange(config.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{config.nombre}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Configuración Técnica</h3>
            <p className="text-sm text-gray-600">{elemento.nombre} - {opcion.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">{elemento.icono}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{opcion.nombre}</h4>
                <p className="text-sm text-gray-600">{opcion.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Configuraciones */}
          <div className="space-y-6">
            <h5 className="font-medium text-gray-900">Especificaciones Técnicas</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opcion.configuraciones.map((config) => (
                <div key={config.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.nombre}
                    {config.requerido && <span className="text-red-500 ml-1">*</span>}
                    {config.unidad && <span className="text-gray-500 ml-1">({config.unidad})</span>}
                  </label>
                  {renderInput(config)}
                  {config.min !== undefined && config.max !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      Rango: {config.min} - {config.max} {config.unidad || ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Configuración */}
          {Object.keys(configuracion).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h6 className="font-medium text-gray-900 mb-2">Resumen de Configuración:</h6>
              <div className="text-sm text-gray-600 space-y-1">
                {Object.entries(configuracion).map(([key, value]) => {
                  const config = opcion.configuraciones.find(c => c.id === key);
                  return (
                    <div key={key}>
                      <span className="font-medium">{config?.nombre}:</span> {value}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Elemento</span>
          </button>
        </div>
      </div>
    </div>
  );
}
