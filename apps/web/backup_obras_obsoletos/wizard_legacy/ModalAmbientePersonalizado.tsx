'use client';

import { useState } from 'react';
import { 
  X,
  Plus,
  Check,
  Palette
} from 'lucide-react';

interface ModalAmbientePersonalizadoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nombre: string, color: string, id: string) => void;
}

export function ModalAmbientePersonalizado({ 
  isOpen, 
  onClose, 
  onConfirm 
}: ModalAmbientePersonalizadoProps) {
  const [nombre, setNombre] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('bg-purple-400');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Colores disponibles siguiendo la paleta actual
  const coloresDisponibles = [
    { id: 'bg-purple-400', label: 'Morado', value: '#a855f7' },
    { id: 'bg-pink-400', label: 'Rosa', value: '#f472b6' },
    { id: 'bg-indigo-400', label: 'Índigo', value: '#818cf8' },
    { id: 'bg-cyan-400', label: 'Cian', value: '#22d3ee' },
    { id: 'bg-emerald-400', label: 'Esmeralda', value: '#34d399' },
    { id: 'bg-amber-400', label: 'Ámbar', value: '#fbbf24' },
    { id: 'bg-red-400', label: 'Rojo', value: '#f87171' },
    { id: 'bg-teal-400', label: 'Verde azulado', value: '#2dd4bf' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (nombre.trim().length < 2) newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      // Generar ID siguiendo el formato AMB###
      const nuevoId = `AMB${String(Date.now()).slice(-3).padStart(3, '0')}`;
      onConfirm(nombre.trim(), colorSeleccionado, nuevoId);
      handleClose();
    }
  };

  const handleClose = () => {
    setNombre('');
    setColorSeleccionado('bg-purple-400');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ambiente Personalizado</h2>
              <p className="text-sm text-gray-600">Crear un nuevo tipo de ambiente</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Ambiente
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Escritorio, Playroom, Vestidor"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Color del Ambiente</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {coloresDisponibles.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setColorSeleccionado(color.id)}
                  className={`w-full h-12 rounded-lg border-2 transition-all duration-200 ${
                    colorSeleccionado === color.id 
                      ? 'border-gray-900 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {colorSeleccionado === color.id && (
                    <div className="flex items-center justify-center h-full">
                      <Check className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecciona un color para identificar este ambiente en el plano
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Vista Previa</h4>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded ${colorSeleccionado} border border-gray-300`}></div>
              <div>
                <div className="font-medium text-gray-900">
                  {nombre || 'Nombre del ambiente'}
                </div>
                <div className="text-xs text-gray-500">
                  ID: AMB{String(Date.now()).slice(-3).padStart(3, '0')}
                </div>
              </div>
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
            disabled={!nombre.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Check className="h-4 w-4" />
            <span>Crear Ambiente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
