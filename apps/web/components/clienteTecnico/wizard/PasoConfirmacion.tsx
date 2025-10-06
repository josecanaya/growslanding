'use client';

import { 
  Building2, 
  MapPin, 
  Home, 
  Users, 
  Calendar,
  CheckCircle,
  Edit,
  ChevronRight
} from 'lucide-react';

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

interface PasoConfirmacionProps {
  data: DatosGeneralesData;
  onEdit: () => void;
  onConfirm: () => void;
}

const tiposProyecto = {
  'vivienda_unifamiliar': 'Vivienda Unifamiliar',
  'vivienda_multifamiliar': 'Vivienda Multifamiliar',
  'ampliacion': 'Ampliación',
  'refaccion': 'Refacción'
};

export function PasoConfirmacion({ data, onEdit, onConfirm }: PasoConfirmacionProps) {
  const tipoProyectoNombre = tiposProyecto[data.tipo_proyecto as keyof typeof tiposProyecto] || data.tipo_proyecto;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Confirmar Datos Generales</h2>
        <p className="text-gray-600 mt-2">Revisa la información antes de continuar con la selección de elementos</p>
      </div>

      {/* Resumen de datos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Información básica */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de la Obra</label>
              <p className="text-lg font-semibold text-gray-900">{data.nombre}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
              <p className="text-lg font-semibold text-gray-900">{data.cliente}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Inicio</label>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(data.fecha_inicio).toLocaleDateString('es-AR')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Presupuesto</label>
              <p className="text-lg font-semibold text-gray-900">
                {data.presupuesto ? `$${parseFloat(data.presupuesto).toLocaleString('es-AR')} USD` : 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* Dimensiones y superficies */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="h-5 w-5 text-blue-600 mr-2" />
            Dimensiones y Superficies
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cantidad de Plantas</label>
              <p className="text-2xl font-bold text-blue-600">{data.cantidad_plantas}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Superficie por Planta</label>
              <p className="text-2xl font-bold text-blue-600">{data.superficie_por_planta} m²</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Superficie Total</label>
              <p className="text-2xl font-bold text-green-600">{data.superficie_total} m²</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Superficie del Terreno</label>
              <p className="text-2xl font-bold text-green-600">
                {(data.ancho_terreno * data.largo_terreno).toFixed(1)} m²
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Ancho Terreno</label>
              <p className="text-lg font-semibold text-gray-900">{data.ancho_terreno} m</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Largo Terreno</label>
              <p className="text-lg font-semibold text-gray-900">{data.largo_terreno} m</p>
            </div>
            
            {(data.ancho_planta || data.largo_planta) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ancho por Planta</label>
                  <p className="text-lg font-semibold text-gray-900">{data.ancho_planta || 'N/A'} m</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Largo por Planta</label>
                  <p className="text-lg font-semibold text-gray-900">{data.largo_planta || 'N/A'} m</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tipo de proyecto */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            Tipo de Proyecto
          </h3>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">
                {data.tipo_proyecto === 'vivienda_unifamiliar' && '🏠'}
                {data.tipo_proyecto === 'vivienda_multifamiliar' && '🏢'}
                {data.tipo_proyecto === 'ampliacion' && '➕'}
                {data.tipo_proyecto === 'refaccion' && '🔨'}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{tipoProyectoNombre}</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            Ubicación
          </h3>
          
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">{data.direccion_completa}</p>
            {data.coordenadas_lat && data.coordenadas_lng && (
              <p className="text-sm text-gray-600">
                Coordenadas: {data.coordenadas_lat.toFixed(6)}, {data.coordenadas_lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Descripción */}
        {data.descripcion && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Descripción
            </h3>
            
            <p className="text-gray-700 leading-relaxed">{data.descripcion}</p>
          </div>
        )}
      </div>

      {/* Resumen lateral preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Resumen para el Panel Lateral:</h4>
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Obra:</span> {data.nombre}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Tipo:</span> {tipoProyectoNombre}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Plantas:</span> {data.cantidad_plantas}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Superficie:</span> {data.superficie_total} m² totales
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Ubicación:</span> {data.direccion_completa.split(',')[0]}
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
        >
          <Edit className="h-5 w-5" />
          <span>Editar Datos</span>
        </button>

        <button
          onClick={onConfirm}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-200 shadow-lg"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Continuar con Elementos</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
