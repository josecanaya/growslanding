'use client';

import { useState } from 'react';
import { 
  User, 
  MapPin, 
  Calendar,
  ChevronRight,
  Building2
} from 'lucide-react';

interface DatosGeneralesData {
  cliente: string;
  direccion: string;
  fecha_inicio: string;
}

interface PasoDatosGeneralesMejoradoProps {
  data: DatosGeneralesData;
  onChange: (data: Partial<DatosGeneralesData>) => void;
  onNext: () => void;
}

export function PasoDatosGeneralesMejorado({ data, onChange, onNext }: PasoDatosGeneralesMejoradoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!data.cliente.trim()) newErrors.cliente = 'El cliente es requerido';
    if (!data.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    if (!data.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Datos Generales</h2>
          <p className="text-gray-600">Información básica del proyecto</p>
        </div>

        <div className="space-y-8">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-6">
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Cliente *</span>
            </label>
            <input
              type="text"
              id="cliente"
              value={data.cliente}
              onChange={(e) => onChange({ cliente: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                errors.cliente ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nombre completo del cliente"
            />
            {errors.cliente && (
              <p className="mt-2 text-sm text-red-600">{errors.cliente}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 rounded-lg p-6">
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Dirección *</span>
            </label>
            <input
              type="text"
              id="direccion"
              value={data.direccion}
              onChange={(e) => onChange({ direccion: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                errors.direccion ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dirección completa del terreno"
            />
            {errors.direccion && (
              <p className="mt-2 text-sm text-red-600">{errors.direccion}</p>
            )}
          </div>

          {/* Fecha de inicio */}
          <div className="bg-gray-50 rounded-lg p-6">
            <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Fecha de Inicio *</span>
            </label>
            <input
              type="date"
              id="fecha_inicio"
              value={data.fecha_inicio}
              onChange={(e) => onChange({ fecha_inicio: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                errors.fecha_inicio ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fecha_inicio && (
              <p className="mt-2 text-sm text-red-600">{errors.fecha_inicio}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
