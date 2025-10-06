'use client';

import { useState } from 'react';
import { 
  Home, 
  Users, 
  Plus,
  Wrench,
  ChevronRight,
  Check
} from 'lucide-react';

interface TipoObraData {
  tipo_obra: string;
}

interface PasoTipoObraProps {
  data: TipoObraData;
  onChange: (data: Partial<TipoObraData>) => void;
  onNext: () => void;
}

export function PasoTipoObra({ data, onChange, onNext }: PasoTipoObraProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tiposObra = [
    { 
      id: 'UNF001', 
      label: 'Casa Unifamiliar', 
      icon: Home,
      description: 'Vivienda de una sola familia',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500'
    },
    { 
      id: 'MUL001', 
      label: 'Multifamiliar', 
      icon: Users,
      description: 'Edificio con múltiples viviendas',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-500'
    },
    { 
      id: 'AMP001', 
      label: 'Ampliación', 
      icon: Plus,
      description: 'Extensión de construcción existente',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      selectedColor: 'bg-yellow-100 border-yellow-500'
    },
    { 
      id: 'REF001', 
      label: 'Refacción', 
      icon: Wrench,
      description: 'Remodelación de construcción existente',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-500'
    }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!data.tipo_obra) newErrors.tipo_obra = 'Debe seleccionar un tipo de obra';

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tipo de Obra</h2>
          <p className="text-gray-600">Selecciona el tipo de proyecto a construir</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {tiposObra.map((tipo) => {
            const Icon = tipo.icon;
            const isSelected = data.tipo_obra === tipo.id;
            
            return (
              <button
                key={tipo.id}
                onClick={() => onChange({ tipo_obra: tipo.id })}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected 
                    ? `${tipo.selectedColor} shadow-lg transform scale-105` 
                    : `${tipo.color} shadow-md hover:shadow-lg`
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-white shadow-md' : 'bg-white/50'
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  {isSelected && (
                    <div className="p-2 bg-green-500 rounded-full">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                
                <h3 className={`text-xl font-semibold mb-2 ${
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {tipo.label}
                </h3>
                
                <p className={`text-sm ${
                  isSelected ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {tipo.description}
                </p>
                
                <div className="mt-4 text-xs font-mono text-gray-400">
                  ID: {tipo.id}
                </div>
              </button>
            );
          })}
        </div>

        {errors.tipo_obra && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.tipo_obra}</p>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button
            onClick={handleNext}
            disabled={!data.tipo_obra}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
