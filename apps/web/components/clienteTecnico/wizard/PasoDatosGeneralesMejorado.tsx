'use client';

import { useState } from 'react';
import { 
  User, 
  MapPin, 
  Calendar,
  ChevronRight,
  Building2,
  CheckCircle,
  AlertCircle
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleFieldChange = (field: string, value: string) => {
    onChange({ [field]: value });
    setTouched({ ...touched, [field]: true });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const isFieldValid = (field: string) => {
    return touched[field] && !errors[field] && data[field as keyof DatosGeneralesData];
  };

  const isFormValid = () => {
    return data.cliente.trim() && data.direccion.trim() && data.fecha_inicio;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-6 shadow-lg">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Datos Generales del Proyecto
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Proporciona la información básica necesaria para crear tu obra
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Progress Indicator */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <span className="text-sm font-medium text-gray-600">Información básica</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-bold text-sm">2</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Configuración</span>
              </div>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Paso 1 de 4
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cliente */}
            <div className="space-y-3">
              <label htmlFor="cliente" className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isFieldValid('cliente') ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  {isFieldValid('cliente') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <span>Cliente *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cliente"
                  value={data.cliente}
                  onChange={(e) => handleFieldChange('cliente', e.target.value)}
                  className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg font-medium ${
                    errors.cliente ? 'border-red-300 bg-red-50' : 
                    isFieldValid('cliente') ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Nombre completo del cliente"
                />
                {isFieldValid('cliente') && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              {errors.cliente && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{errors.cliente}</span>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="space-y-3">
              <label htmlFor="direccion" className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isFieldValid('direccion') ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  {isFieldValid('direccion') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <MapPin className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <span>Dirección *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="direccion"
                  value={data.direccion}
                  onChange={(e) => handleFieldChange('direccion', e.target.value)}
                  className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg font-medium ${
                    errors.direccion ? 'border-red-300 bg-red-50' : 
                    isFieldValid('direccion') ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Dirección completa del terreno"
                />
                {isFieldValid('direccion') && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              {errors.direccion && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{errors.direccion}</span>
                </div>
              )}
            </div>

            {/* Fecha de inicio */}
            <div className="space-y-3 lg:col-span-2">
              <label htmlFor="fecha_inicio" className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isFieldValid('fecha_inicio') ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  {isFieldValid('fecha_inicio') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Calendar className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <span>Fecha de Inicio *</span>
              </label>
              <div className="relative max-w-md">
                <input
                  type="date"
                  id="fecha_inicio"
                  value={data.fecha_inicio}
                  onChange={(e) => handleFieldChange('fecha_inicio', e.target.value)}
                  className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg font-medium ${
                    errors.fecha_inicio ? 'border-red-300 bg-red-50' : 
                    isFieldValid('fecha_inicio') ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                  }`}
                />
                {isFieldValid('fecha_inicio') && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              {errors.fecha_inicio && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{errors.fecha_inicio}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleNext}
              disabled={!isFormValid()}
              className={`flex items-center space-x-3 px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${
                isFormValid() 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-105' 
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
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Información requerida</h4>
            <p className="text-gray-700 leading-relaxed">
              Estos datos son necesarios para crear tu obra y configurar el proyecto correctamente. 
              Podrás modificar esta información más adelante si es necesario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}