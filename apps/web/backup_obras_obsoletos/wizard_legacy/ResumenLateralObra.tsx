'use client';

import { Building2, MapPin, Home, Users } from 'lucide-react';

interface DatosGeneralesData {
  nombre: string;
  cantidad_plantas: number;
  superficie_por_planta: number;
  superficie_total: number;
  ancho_terreno: number;
  largo_terreno: number;
  tipo_proyecto: string;
  direccion_completa: string;
  cliente: string;
}

interface ResumenLateralObraProps {
  data: DatosGeneralesData;
}

const tiposProyecto = {
  'vivienda_unifamiliar': 'Vivienda Unifamiliar',
  'vivienda_multifamiliar': 'Vivienda Multifamiliar',
  'ampliacion': 'Ampliación',
  'refaccion': 'Refacción'
};

export function ResumenLateralObra({ data }: ResumenLateralObraProps) {
  const tipoProyectoNombre = tiposProyecto[data.tipo_proyecto as keyof typeof tiposProyecto] || data.tipo_proyecto;
  const ubicacionCorta = data.direccion_completa.split(',')[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Datos Generales</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{data.nombre}</p>
          <p className="text-xs text-gray-600">{tipoProyectoNombre}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Home className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">{data.cantidad_plantas} plantas</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">{data.superficie_total} m²</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="truncate">{ubicacionCorta}</span>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">Cliente: {data.cliente}</p>
        </div>
      </div>
    </div>
  );
}
