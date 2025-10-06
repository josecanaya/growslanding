'use client';

import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Seleccion } from './SubgrupoAccordion';

interface ConfiguracionTecnicaModalProps {
  elemento: any;
  subgrupo: string;
  onClose: () => void;
  onAgregar: (seleccion: Seleccion) => void;
  elementosSeleccionados: Seleccion[];
}

// Configuraciones técnicas específicas por tipo de elemento
const CONFIGURACIONES_TECNICAS: { [key: string]: any } = {
  // FUNDACIONES
  'Cimiento corrido': {
    tipo: { label: 'Tipo de fundación', type: 'select', options: ['Superficial', 'Profunda'] },
    profundidad: { label: 'Profundidad (cm)', type: 'number', min: 40, max: 200, default: 80 },
    ancho: { label: 'Ancho (cm)', type: 'number', min: 20, max: 60, default: 40 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8', 'Ø10', 'Ø12'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21', 'H30'] },
    recubrimiento: { label: 'Recubrimiento (cm)', type: 'number', min: 2, max: 5, default: 3 }
  },
  'Base aislada': {
    tipo: { label: 'Tipo de base', type: 'select', options: ['Superficial', 'Profunda'] },
    dimensiones: { label: 'Dimensiones (m)', type: 'text', placeholder: 'Ej: 2.5x2.5' },
    profundidad: { label: 'Profundidad (cm)', type: 'number', min: 60, max: 300, default: 120 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8', 'Ø10', 'Ø12', 'Ø16'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21', 'H30'] }
  },
  'Columna hormigón armado': {
    seccion: { label: 'Sección (cm)', type: 'select', options: ['15x15', '20x20', '25x25', '30x30'] },
    altura: { label: 'Altura (m)', type: 'number', min: 2.5, max: 4, default: 3 },
    acero: { label: 'Acero longitudinal', type: 'select', options: ['4Ø12', '4Ø16', '6Ø16', '8Ø16'] },
    estribos: { label: 'Estribos', type: 'select', options: ['Ø6@15', 'Ø6@20', 'Ø8@15', 'Ø8@20'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30', 'H35'] }
  },

  // MUROS
  'Muro común 15 cm': {
    espesor: { label: 'Espesor', type: 'select', options: ['15 cm', '20 cm', '30 cm'], default: '15 cm' },
    material: { label: 'Material', type: 'select', options: ['Ladrillo común', 'Cerámico hueco', 'Bloque de hormigón'] },
    aislacion: { label: 'Aislación', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana mineral'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque grueso', 'Revoque fino', 'Pintura', 'Piedra'] }
  },
  'Muro común 30 cm (doble muro portante)': {
    tipo: { label: 'Tipo de muro', type: 'select', options: ['Doble muro', 'Muro portante simple'] },
    material: { label: 'Material', type: 'select', options: ['Ladrillo común', 'Cerámico hueco', 'Bloque de hormigón'] },
    camara: { label: 'Cámara de aire', type: 'checkbox', label: 'Incluir cámara de aire' },
    aislacion: { label: 'Aislación', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm'] },
    terminacion: { label: 'Terminación exterior', type: 'select', options: ['Revoque', 'Piedra', 'Ladrillo visto'] }
  },
  'Muro de Retak': {
    espesor: { label: 'Espesor', type: 'select', options: ['15 cm', '20 cm', '30 cm'] },
    tipo: { label: 'Tipo Retak', type: 'select', options: ['Retak 15', 'Retak 20', 'Retak 30'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque grueso', 'Revoque fino', 'Pintura'] }
  },

  // PISOS
  'Losa de hormigón armado': {
    tipo: { label: 'Tipo de losa', type: 'select', options: ['Maciza', 'Alivianada', 'Pretensada'] },
    espesor: { label: 'Espesor (cm)', type: 'number', min: 10, max: 25, default: 15 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8@20', 'Ø10@20', 'Ø12@15', 'Ø12@20'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30', 'H35'] }
  },
  'Contrapiso de hormigón': {
    espesor: { label: 'Espesor (cm)', type: 'number', min: 5, max: 15, default: 8 },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Alisado', 'Fratazado', 'Pulido'] }
  },
  'Piso de cerámica': {
    tipo: { label: 'Tipo de cerámica', type: 'select', options: ['Cerámica común', 'Porcelanato', 'Gres porcelánico'] },
    dimensiones: { label: 'Dimensiones', type: 'select', options: ['30x30 cm', '45x45 cm', '60x60 cm', '30x60 cm'] },
    acabado: { label: 'Acabado', type: 'select', options: ['Mate', 'Brillante', 'Rústico', 'Pulido'] }
  },

  // CUBIERTAS
  'Losa de techo': {
    tipo: { label: 'Tipo de losa', type: 'select', options: ['Maciza', 'Alivianada', 'Pretensada'] },
    espesor: { label: 'Espesor (cm)', type: 'number', min: 12, max: 25, default: 18 },
    aislacion: { label: 'Aislación térmica', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana mineral'] },
    impermeabilizacion: { label: 'Impermeabilización', type: 'select', options: ['Membrana asfáltica', 'Membrana PVC', 'Pintura asfáltica'] }
  },
  'Cubierta de chapa': {
    tipo: { label: 'Tipo de chapa', type: 'select', options: ['Chapa galvanizada', 'Chapa prepintada', 'Chapa de aluminio'] },
    espesor: { label: 'Espesor (mm)', type: 'select', options: ['0.5', '0.6', '0.7'] },
    aislacion: { label: 'Aislación', type: 'checkbox', label: 'Incluir aislación térmica' },
    color: { label: 'Color', type: 'select', options: ['Blanco', 'Gris', 'Rojo', 'Azul'] }
  },

  // ESCALERAS
  'Escalera de hormigón': {
    tipo: { label: 'Tipo de escalera', type: 'select', options: ['Recta', 'En L', 'En U', 'Caracol'] },
    ancho: { label: 'Ancho (cm)', type: 'number', min: 80, max: 120, default: 100 },
    altura: { label: 'Altura total (m)', type: 'number', min: 2.5, max: 4, default: 3 },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque', 'Mármol', 'Cerámica', 'Madera'] }
  },

  // CARPINTERÍAS
  'Puerta de madera': {
    material: { label: 'Material', type: 'select', options: ['Madera maciza', 'Madera laminada', 'MDF'] },
    tipo: { label: 'Tipo', type: 'select', options: ['Simple', 'Doble', 'Corrediza'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Barniz natural', 'Barniz oscuro', 'Pintura'] }
  },
  'Ventana de aluminio': {
    tipo: { label: 'Tipo', type: 'select', options: ['Corrediza', 'Abatible', 'Fija'] },
    vidrio: { label: 'Vidrio', type: 'select', options: ['Simple', 'Doble vidrio', 'DVH'] },
    color: { label: 'Color del marco', type: 'select', options: ['Blanco', 'Bronce', 'Negro'] }
  }
};

export function ConfiguracionTecnicaModal({ 
  elemento, 
  subgrupo, 
  onClose, 
  onAgregar,
  elementosSeleccionados 
}: ConfiguracionTecnicaModalProps) {
  const [configuracion, setConfiguracion] = useState<{ [key: string]: any }>({});
  
  const configuraciones = CONFIGURACIONES_TECNICAS[elemento.nombre] || {};
  
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
                    {config.options.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                
                {config.type === 'number' && (
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    defaultValue={config.default}
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
