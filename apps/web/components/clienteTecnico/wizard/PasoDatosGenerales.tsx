'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Home, 
  Users, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Map
} from 'lucide-react';
import { MapaUbicacion } from './MapaUbicacion';

interface DatosGeneralesData {
  nombre: string;
  cantidad_plantas: number;
  superficie_por_planta: number;
  superficie_total: number;
  ancho_terreno: number;
  largo_terreno: number;
  ancho_planta: number;
  largo_planta: number;
  tipo_proyecto: string;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  direccion_completa: string;
  cliente: string;
  fecha_inicio: string;
  presupuesto: string;
  descripcion: string;
}

interface PasoDatosGeneralesProps {
  data: DatosGeneralesData;
  onChange: (data: Partial<DatosGeneralesData>) => void;
  onNext: () => void;
}

const tiposProyecto = [
  {
    id: 'vivienda_unifamiliar',
    nombre: 'Vivienda Unifamiliar',
    descripcion: 'Casa individual para una familia',
    icono: '🏠'
  },
  {
    id: 'vivienda_multifamiliar',
    nombre: 'Vivienda Multifamiliar',
    descripcion: 'Edificio con múltiples viviendas',
    icono: '🏢'
  },
  {
    id: 'ampliacion',
    nombre: 'Ampliación',
    descripcion: 'Extensión de construcción existente',
    icono: '➕'
  },
  {
    id: 'refaccion',
    nombre: 'Refacción',
    descripcion: 'Remodelación de obra existente',
    icono: '🔨'
  }
];

export function PasoDatosGenerales({ data, onChange, onNext }: PasoDatosGeneralesProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);

  // Calcular superficie total automáticamente
  useEffect(() => {
    if (data.cantidad_plantas && data.superficie_por_planta) {
      const superficieCalculada = data.cantidad_plantas * data.superficie_por_planta;
      if (data.superficie_total !== superficieCalculada) {
        onChange({ superficie_total: superficieCalculada });
      }
    }
  }, [data.cantidad_plantas, data.superficie_por_planta]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!data.cantidad_plantas || data.cantidad_plantas < 1) newErrors.cantidad_plantas = 'Debe tener al menos 1 planta';
    if (!data.superficie_por_planta || data.superficie_por_planta <= 0) newErrors.superficie_por_planta = 'La superficie por planta es requerida';
    if (!data.ancho_terreno || data.ancho_terreno <= 0) newErrors.ancho_terreno = 'El ancho del terreno es requerido';
    if (!data.largo_terreno || data.largo_terreno <= 0) newErrors.largo_terreno = 'El largo del terreno es requerido';
    if (!data.tipo_proyecto) newErrors.tipo_proyecto = 'El tipo de proyecto es requerido';
    if (!data.direccion_completa.trim()) newErrors.direccion_completa = 'La ubicación es requerida';
    if (!data.cliente.trim()) newErrors.cliente = 'El cliente es requerido';
    if (!data.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleIncrement = (field: 'cantidad_plantas') => {
    onChange({ [field]: (data[field] || 0) + 1 });
  };

  const handleDecrement = (field: 'cantidad_plantas') => {
    if (data[field] > 1) {
      onChange({ [field]: data[field] - 1 });
    }
  };

  const handleMapSelect = (lat: number, lng: number, address: string) => {
    onChange({
      coordenadas_lat: lat,
      coordenadas_lng: lng,
      direccion_completa: address
    });
    setShowMap(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Datos Generales de la Obra</h2>
        <p className="text-gray-600 mt-2">Completa la información principal del proyecto</p>
      </div>

      {/* Nombre de la obra */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
          Información Básica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Obra *
            </label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Casa en Barrio Norte"
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <input
              type="text"
              value={data.cliente}
              onChange={(e) => onChange({ cliente: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cliente ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={data.fecha_inicio}
              onChange={(e) => onChange({ fecha_inicio: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fecha_inicio ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.fecha_inicio && <p className="text-red-500 text-sm mt-1">{errors.fecha_inicio}</p>}
          </div>
        </div>
      </div>

      {/* Dimensiones y superficies */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Home className="h-5 w-5 text-blue-600 mr-2" />
          Dimensiones y Superficies
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cantidad de plantas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de Plantas *
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleDecrement('cantidad_plantas')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={data.cantidad_plantas <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={data.cantidad_plantas || ''}
                onChange={(e) => onChange({ cantidad_plantas: parseInt(e.target.value) || 0 })}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center ${
                  errors.cantidad_plantas ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1"
                max="10"
              />
              <button
                type="button"
                onClick={() => handleIncrement('cantidad_plantas')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {errors.cantidad_plantas && <p className="text-red-500 text-sm mt-1">{errors.cantidad_plantas}</p>}
          </div>

          {/* Superficie por planta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie por Planta (m²) *
            </label>
            <input
              type="number"
              value={data.superficie_por_planta || ''}
              onChange={(e) => onChange({ superficie_por_planta: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.superficie_por_planta ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 120"
              min="0"
              step="0.1"
            />
            {errors.superficie_por_planta && <p className="text-red-500 text-sm mt-1">{errors.superficie_por_planta}</p>}
          </div>

          {/* Superficie total (calculada) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie Total (m²)
            </label>
            <input
              type="number"
              value={data.superficie_total || ''}
              onChange={(e) => onChange({ superficie_total: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder="Se calcula automáticamente"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Editable si necesitas corregir</p>
          </div>

          {/* Dimensiones del terreno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ancho Terreno (m) *
            </label>
            <input
              type="number"
              value={data.ancho_terreno || ''}
              onChange={(e) => onChange({ ancho_terreno: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.ancho_terreno ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 15"
              min="0"
              step="0.1"
            />
            {errors.ancho_terreno && <p className="text-red-500 text-sm mt-1">{errors.ancho_terreno}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Largo Terreno (m) *
            </label>
            <input
              type="number"
              value={data.largo_terreno || ''}
              onChange={(e) => onChange({ largo_terreno: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.largo_terreno ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 25"
              min="0"
              step="0.1"
            />
            {errors.largo_terreno && <p className="text-red-500 text-sm mt-1">{errors.largo_terreno}</p>}
          </div>

          {/* Dimensiones por planta (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ancho por Planta (m)
            </label>
            <input
              type="number"
              value={data.ancho_planta || ''}
              onChange={(e) => onChange({ ancho_planta: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Opcional"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Largo por Planta (m)
            </label>
            <input
              type="number"
              value={data.largo_planta || ''}
              onChange={(e) => onChange({ largo_planta: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Opcional"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Tipo de proyecto */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          Tipo de Proyecto *
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiposProyecto.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => onChange({ tipo_proyecto: tipo.id })}
              className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                data.tipo_proyecto === tipo.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{tipo.icono}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{tipo.nombre}</h4>
                  <p className="text-sm text-gray-600">{tipo.descripcion}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.tipo_proyecto && <p className="text-red-500 text-sm mt-2">{errors.tipo_proyecto}</p>}
      </div>

      {/* Ubicación */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          Ubicación del Terreno *
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección Completa
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={data.direccion_completa}
                onChange={(e) => onChange({ direccion_completa: e.target.value })}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.direccion_completa ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Av. Corrientes 1234, CABA, Argentina"
              />
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Map className="h-4 w-4" />
                <span>Mapa</span>
              </button>
            </div>
            {errors.direccion_completa && <p className="text-red-500 text-sm mt-1">{errors.direccion_completa}</p>}
          </div>

          {data.coordenadas_lat && data.coordenadas_lng && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <MapPin className="h-4 w-4 inline mr-1" />
                Ubicación seleccionada: {data.coordenadas_lat.toFixed(6)}, {data.coordenadas_lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Información Adicional
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto (USD)
            </label>
            <input
              type="number"
              value={data.presupuesto}
              onChange={(e) => onChange({ presupuesto: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 50000"
              min="0"
              step="0.01"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={data.descripcion}
              onChange={(e) => onChange({ descripcion: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe los detalles del proyecto..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Modal de Google Maps */}
      <MapaUbicacion
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleMapSelect}
        initialLat={data.coordenadas_lat || undefined}
        initialLng={data.coordenadas_lng || undefined}
      />

      {/* Botón siguiente */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-200 shadow-lg"
        >
          <span>Continuar con Elementos</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
