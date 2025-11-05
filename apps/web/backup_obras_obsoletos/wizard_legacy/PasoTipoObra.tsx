'use client';

import { useState } from 'react';
import { 
  Home, 
  Users, 
  Plus,
  Wrench,
  ChevronRight,
  CheckCircle,
  Building2
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const tiposObra = [
    { 
      id: 'unifamiliar', 
      label: 'Casa Unifamiliar', 
      icon: Home,
      description: 'Vivienda de una sola familia',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      selectedBorderColor: 'border-blue-500',
      iconBg: 'bg-blue-100',
      selectedIconBg: 'bg-blue-500',
      iconColor: 'text-blue-600',
      selectedIconColor: 'text-white'
    },
    { 
      id: 'multifamiliar', 
      label: 'Multifamiliar', 
      icon: Users,
      description: 'Edificio con múltiples viviendas',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      selectedBorderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-100',
      selectedIconBg: 'bg-emerald-500',
      iconColor: 'text-emerald-600',
      selectedIconColor: 'text-white'
    },
    { 
      id: 'ampliacion', 
      label: 'Ampliación', 
      icon: Plus,
      description: 'Extensión de construcción existente',
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      selectedBorderColor: 'border-amber-500',
      iconBg: 'bg-amber-100',
      selectedIconBg: 'bg-amber-500',
      iconColor: 'text-amber-600',
      selectedIconColor: 'text-white'
    },
    { 
      id: 'refaccion', 
      label: 'Refacción', 
      icon: Wrench,
      description: 'Remodelación de construcción existente',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      selectedBorderColor: 'border-purple-500',
      iconBg: 'bg-purple-100',
      selectedIconBg: 'bg-purple-500',
      iconColor: 'text-purple-600',
      selectedIconColor: 'text-white'
    }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!data.tipo_obra) newErrors.tipo_obra = 'Debes seleccionar un tipo de obra';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleSelection = (tipoId: string) => {
    onChange({ tipo_obra: tipoId });
    setTouched({ ...touched, tipo_obra: true });
    
    // Clear error when user makes a selection
    if (errors.tipo_obra) {
      setErrors({ ...errors, tipo_obra: '' });
    }
  };

  const isFormValid = () => {
    return data.tipo_obra && data.tipo_obra.trim() !== '';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl mb-6 shadow-lg">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tipo de Obra
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Selecciona el tipo de proyecto que mejor se adapte a tu construcción
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Progress Indicator */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-bold text-sm">1</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Información básica</span>
              </div>
              <div className="w-8 h-0.5 bg-indigo-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <span className="text-sm font-medium text-gray-600">Tipo de obra</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-bold text-sm">3</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Configuración</span>
              </div>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Paso 2 de 4
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {/* Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {tiposObra.map((tipo) => {
              const isSelected = data.tipo_obra === tipo.id;
              const IconComponent = tipo.icon;
              
              return (
                <div
                  key={tipo.id}
                  onClick={() => handleSelection(tipo.id)}
                  className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected
                      ? `border-${tipo.color}-500 bg-gradient-to-br ${tipo.bgColor} shadow-xl ring-4 ring-${tipo.color}-100`
                      : `border-gray-200 bg-white hover:border-${tipo.color}-300 hover:shadow-lg`
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className={`absolute top-4 right-4 w-6 h-6 bg-${tipo.color}-500 rounded-full flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isSelected ? `bg-${tipo.color}-500 shadow-lg` : `bg-gray-100 group-hover:bg-${tipo.color}-100`
                    }`}>
                      <IconComponent className={`h-10 w-10 transition-colors duration-300 ${
                        isSelected ? 'text-white' : `text-gray-600 group-hover:text-${tipo.color}-600`
                      }`} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{tipo.label}</h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {tipo.description}
                    </p>
                    
                    {/* ID Badge */}
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${
                      isSelected 
                        ? `bg-${tipo.color}-500 text-white` 
                        : `bg-gray-100 text-gray-600 group-hover:bg-${tipo.color}-100 group-hover:text-${tipo.color}-700`
                    } transition-all duration-300`}>
                      ID: {tipo.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleNext}
              disabled={!isFormValid()}
              className={`flex items-center space-x-3 px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${
                isFormValid() 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-xl hover:scale-105' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Continuar</span>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Tipos de obra disponibles</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cada tipo de obra tiene características específicas que influyen en la configuración de elementos constructivos y el flujo de trabajo.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600"><strong>Unifamiliar:</strong> Elementos estándar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600"><strong>Multifamiliar:</strong> Elementos compartidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-gray-600"><strong>Ampliación:</strong> Elementos adicionales</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600"><strong>Refacción:</strong> Elementos de renovación</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.tipo_obra && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-800">Selección requerida</h4>
              <p className="text-sm text-red-700">{errors.tipo_obra}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}