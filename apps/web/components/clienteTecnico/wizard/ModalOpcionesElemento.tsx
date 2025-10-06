'use client';

import { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';

interface OpcionElemento {
  id: string;
  nombre: string;
  tipo: 'checkbox' | 'select' | 'number' | 'multiselect';
  opciones?: string[];
  valor: any;
  descripcion?: string;
}

interface ModalOpcionesElementoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opciones: Record<string, any>) => void;
  elemento: {
    id: string;
    nombre: string;
    categoria: string;
  };
  opcionesIniciales?: Record<string, any>;
}

export function ModalOpcionesElemento({ 
  isOpen, 
  onClose, 
  onSave, 
  elemento,
  opcionesIniciales = {}
}: ModalOpcionesElementoProps) {
  const [opciones, setOpciones] = useState<Record<string, any>>(opcionesIniciales);

  // Configuración de opciones por elemento
  const getOpcionesPorElemento = (): OpcionElemento[] => {
    const configs: { [key: string]: OpcionElemento[] } = {
      // Muros exteriores
      'MUR_LAD15_001': [
        { id: 'dobleMuro', nombre: 'Doble muro', tipo: 'checkbox', valor: opciones.dobleMuro || false, descripcion: 'Muro doble con cámara de aire' },
        { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana de vidrio', 'Poliuretano'], valor: opciones.aislacion || 'Sin aislación' },
        { id: 'refuerzo', nombre: 'Refuerzo estructural', tipo: 'select', opciones: ['Sin refuerzo', 'Hierros Ø6 c/30cm', 'Hierros Ø8 c/20cm'], valor: opciones.refuerzo || 'Sin refuerzo' },
        { id: 'terminacion', nombre: 'Terminación exterior', tipo: 'multiselect', opciones: ['Revoque grueso', 'Revoque fino', 'Pintura', 'Piedra', 'Siding'], valor: opciones.terminacion || [] }
      ],
      'MUR_LAD30_001': [
        { id: 'dobleMuro', nombre: 'Doble muro', tipo: 'checkbox', valor: opciones.dobleMuro || false, descripcion: 'Muro doble con cámara de aire' },
        { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana de vidrio', 'Poliuretano'], valor: opciones.aislacion || 'Sin aislación' },
        { id: 'refuerzo', nombre: 'Refuerzo estructural', tipo: 'select', opciones: ['Sin refuerzo', 'Hierros Ø6 c/30cm', 'Hierros Ø8 c/20cm'], valor: opciones.refuerzo || 'Sin refuerzo' },
        { id: 'terminacion', nombre: 'Terminación exterior', tipo: 'multiselect', opciones: ['Revoque grueso', 'Revoque fino', 'Pintura', 'Piedra', 'Siding'], valor: opciones.terminacion || [] }
      ],
      'MUR_BLO15_001': [
        { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana de vidrio'], valor: opciones.aislacion || 'Sin aislación' },
        { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra'], valor: opciones.terminacion || 'Revoque' }
      ],
      'MUR_BLO20_001': [
        { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana de vidrio'], valor: opciones.aislacion || 'Sin aislación' },
        { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra'], valor: opciones.terminacion || 'Revoque' }
      ],
      'MUR_BLO30_001': [
        { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana de vidrio'], valor: opciones.aislacion || 'Sin aislación' },
        { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra'], valor: opciones.terminacion || 'Revoque' }
      ],
      
      // Cubiertas
      'CUB_PLA_IMP001': [
        { id: 'tipo_impermeabilizacion', nombre: 'Tipo impermeabilización', tipo: 'select', opciones: ['Membrana asfáltica', 'Membrana PVC', 'Membrana EPDM'], valor: opciones.tipo_impermeabilizacion || 'Membrana asfáltica' },
        { id: 'aislacion_termica', nombre: 'Aislación térmica', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Poliuretano', 'Lana mineral'], valor: opciones.aislacion_termica || 'Sin aislación' },
        { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Membrana expuesta', 'Losa de protección', 'Jardín'], valor: opciones.terminacion || 'Membrana expuesta' }
      ],
      'CUB_2A_TEJ_CER001': [
        { id: 'tipo_estructura', nombre: 'Tipo estructura', tipo: 'select', opciones: ['Madera', 'Metálica', 'Hormigón'], valor: opciones.tipo_estructura || 'Madera' },
        { id: 'aislacion_termica', nombre: 'Aislación térmica', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana mineral'], valor: opciones.aislacion_termica || 'Sin aislación' },
        { id: 'pendiente', nombre: 'Pendiente', tipo: 'number', valor: opciones.pendiente || 25, descripcion: 'Grados de pendiente' }
      ],
      'CUB_2A_CHA001': [
        { id: 'tipo_chapa', nombre: 'Tipo chapa', tipo: 'select', opciones: ['Galvanizada', 'Prepintada', 'Aluzinc'], valor: opciones.tipo_chapa || 'Galvanizada' },
        { id: 'tipo_estructura', nombre: 'Tipo estructura', tipo: 'select', opciones: ['Metálica', 'Madera'], valor: opciones.tipo_estructura || 'Metálica' },
        { id: 'aislacion_termica', nombre: 'Aislación térmica', tipo: 'select', opciones: ['Sin aislación', 'EPS', 'Lana mineral'], valor: opciones.aislacion_termica || 'Sin aislación' }
      ],

      // Pisos
      'PIS_INT_CER001': [
        { id: 'tipo_ceramico', nombre: 'Tipo cerámico', tipo: 'select', opciones: ['Esmaltado', 'Gres', 'Porcelanato'], valor: opciones.tipo_ceramico || 'Esmaltado' },
        { id: 'formato', nombre: 'Formato', tipo: 'select', opciones: ['30x30cm', '45x45cm', '60x60cm'], valor: opciones.formato || '45x45cm' },
        { id: 'acabado', nombre: 'Acabado', tipo: 'select', opciones: ['Brillante', 'Mate', 'Rústico'], valor: opciones.acabado || 'Brillante' }
      ],
      'PIS_INT_POR001': [
        { id: 'tipo_porcelanato', nombre: 'Tipo porcelanato', tipo: 'select', opciones: ['Pulido', 'Natural', 'Técnico'], valor: opciones.tipo_porcelanato || 'Pulido' },
        { id: 'formato', nombre: 'Formato', tipo: 'select', opciones: ['60x60cm', '80x80cm', '120x60cm'], valor: opciones.formato || '60x60cm' },
        { id: 'acabado', nombre: 'Acabado', tipo: 'select', opciones: ['Brillante', 'Mate', 'Semi-mate'], valor: opciones.acabado || 'Brillante' }
      ],

      // Instalaciones
      'PLO_SAN_1B001': [
        { id: 'tipo_cañeria', nombre: 'Tipo cañería', tipo: 'select', opciones: ['PVC', 'Hierro', 'Polietileno'], valor: opciones.tipo_cañeria || 'PVC' },
        { id: 'diametro', nombre: 'Diámetro', tipo: 'select', opciones: ['110mm', '160mm', '200mm'], valor: opciones.diametro || '110mm' },
        { id: 'tipo_tanque', nombre: 'Tipo tanque', tipo: 'select', opciones: ['Superior', 'Cisterna'], valor: opciones.tipo_tanque || 'Superior' }
      ],
      'PLO_SAN_2B001': [
        { id: 'tipo_cañeria', nombre: 'Tipo cañería', tipo: 'select', opciones: ['PVC', 'Hierro', 'Polietileno'], valor: opciones.tipo_cañeria || 'PVC' },
        { id: 'diametro', nombre: 'Diámetro', tipo: 'select', opciones: ['110mm', '160mm', '200mm'], valor: opciones.diametro || '110mm' },
        { id: 'tipo_tanque', nombre: 'Tipo tanque', tipo: 'select', opciones: ['Superior', 'Cisterna'], valor: opciones.tipo_tanque || 'Superior' }
      ],
      'PLO_SAN_3B001': [
        { id: 'tipo_cañeria', nombre: 'Tipo cañería', tipo: 'select', opciones: ['PVC', 'Hierro', 'Polietileno'], valor: opciones.tipo_cañeria || 'PVC' },
        { id: 'diametro', nombre: 'Diámetro', tipo: 'select', opciones: ['110mm', '160mm', '200mm'], valor: opciones.diametro || '110mm' },
        { id: 'tipo_tanque', nombre: 'Tipo tanque', tipo: 'select', opciones: ['Superior', 'Cisterna'], valor: opciones.tipo_tanque || 'Superior' }
      ]
    };

    return configs[elemento.id] || [];
  };

  const opcionesDisponibles = getOpcionesPorElemento();

  const handleOpcionChange = (opcionId: string, valor: any) => {
    setOpciones(prev => ({
      ...prev,
      [opcionId]: valor
    }));
  };

  const handleMultiselectChange = (opcionId: string, valor: string, checked: boolean) => {
    setOpciones(prev => {
      const currentValues = prev[opcionId] || [];
      if (checked) {
        return {
          ...prev,
          [opcionId]: [...currentValues, valor]
        };
      } else {
        return {
          ...prev,
          [opcionId]: currentValues.filter((v: string) => v !== valor)
        };
      }
    });
  };

  const handleSave = () => {
    onSave(opciones);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Opciones Adicionales</h2>
            <p className="text-sm text-gray-600 mt-1">{elemento.nombre}</p>
            <p className="text-xs text-gray-500">ID: {elemento.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {opcionesDisponibles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay opciones adicionales disponibles para este elemento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {opcionesDisponibles.map((opcion) => (
                <div key={opcion.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {opcion.nombre}
                    {opcion.descripcion && (
                      <span className="text-xs text-gray-500 ml-2">({opcion.descripcion})</span>
                    )}
                  </label>

                  {opcion.tipo === 'checkbox' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={opcion.valor}
                        onChange={(e) => handleOpcionChange(opcion.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Activar opción</span>
                    </div>
                  )}

                  {opcion.tipo === 'select' && (
                    <select
                      value={opcion.valor}
                      onChange={(e) => handleOpcionChange(opcion.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {opcion.opciones?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {opcion.tipo === 'number' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpcionChange(opcion.id, Math.max(0, opcion.valor - 1))}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={opcion.valor}
                        onChange={(e) => handleOpcionChange(opcion.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded text-center"
                      />
                      <button
                        onClick={() => handleOpcionChange(opcion.id, opcion.valor + 1)}
                        className="p-1 bg-green-100 hover:bg-green-200 text-green-600 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {opcion.tipo === 'multiselect' && (
                    <div className="space-y-2">
                      {opcion.opciones?.map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={opcion.valor.includes(opt)}
                            onChange={(e) => handleMultiselectChange(opcion.id, opt, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Guardar Opciones</span>
          </button>
        </div>
      </div>
    </div>
  );
}
