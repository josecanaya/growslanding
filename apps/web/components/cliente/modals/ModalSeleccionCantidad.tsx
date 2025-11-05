'use client';

import { useState } from 'react';
import { X, Save, Calculator } from 'lucide-react';

interface ModalSeleccionCantidadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cantidad: number, unidad: 'm²' | 'm³' | 'unidad') => void;
  elemento: {
    categoria: string;
    tipo: string;
    fases: any;
  };
}

export function ModalSeleccionCantidad({ isOpen, onClose, onConfirm, elemento }: ModalSeleccionCantidadProps) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidad, setUnidad] = useState<'m²' | 'm³' | 'unidad'>('m²');

  const unidadesDisponibles = [
    { value: 'm²', label: 'Metros cuadrados (m²)', icon: '📐' },
    { value: 'm³', label: 'Metros cúbicos (m³)', icon: '📦' },
    { value: 'unidad', label: 'Unidades', icon: '🔢' }
  ];

  const handleConfirm = () => {
    if (cantidad > 0) {
      onConfirm(cantidad, unidad);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Agregar al Carrito</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">{elemento.tipo}</h3>
              <p className="text-sm text-gray-600">{elemento.categoria}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={cantidad}
                onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa la cantidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de medida
              </label>
              <div className="space-y-2">
                {unidadesDisponibles.map((unidadOption) => (
                  <label key={unidadOption.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="unidad"
                      value={unidadOption.value}
                      checked={unidad === unidadOption.value}
                      onChange={(e) => setUnidad(e.target.value as 'm²' | 'm³' | 'unidad')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-lg">{unidadOption.icon}</span>
                    <span className="text-sm text-gray-700">{unidadOption.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={cantidad <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
