'use client';

import { useState } from 'react';
import { 
  X,
  Ruler,
  Check
} from 'lucide-react';

interface ModalDimensionesAmbienteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ancho: number, largo: number) => void;
  nombreAmbiente: string;
}

export function ModalDimensionesAmbiente({ 
  isOpen, 
  onClose, 
  onConfirm, 
  nombreAmbiente 
}: ModalDimensionesAmbienteProps) {
  const [ancho, setAncho] = useState<number>(3);
  const [largo, setLargo] = useState<number>(3);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (ancho <= 0) newErrors.ancho = 'El ancho debe ser mayor a 0';
    if (largo <= 0) newErrors.largo = 'El largo debe ser mayor a 0';
    if (ancho < 1) newErrors.ancho = 'El ancho mínimo es 1 metro';
    if (largo < 1) newErrors.largo = 'El largo mínimo es 1 metro';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm(ancho, largo);
      onClose();
    }
  };

  const handleClose = () => {
    setAncho(3);
    setLargo(3);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ruler className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dimensiones del Ambiente</h2>
              <p className="text-sm text-gray-600">{nombreAmbiente}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ancho (metros)
              </label>
              <input
                type="number"
                value={ancho}
                onChange={(e) => setAncho(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ancho ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.1"
                min="1"
              />
              {errors.ancho && (
                <p className="mt-1 text-sm text-red-600">{errors.ancho}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largo (metros)
              </label>
              <input
                type="number"
                value={largo}
                onChange={(e) => setLargo(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.largo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.1"
                min="1"
              />
              {errors.largo && (
                <p className="mt-1 text-sm text-red-600">{errors.largo}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Superficie</div>
            <div className="text-2xl font-bold text-blue-600">
              {(ancho * largo).toFixed(1)} m²
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {ancho}m × {largo}m
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Check className="h-4 w-4" />
            <span>Agregar al Plano</span>
          </button>
        </div>
      </div>
    </div>
  );
}
