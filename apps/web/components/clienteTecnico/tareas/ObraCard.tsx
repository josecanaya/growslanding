'use client';

import { Building2, MapPin, Calendar, ArrowRight, Play, Pause, CheckCircle } from 'lucide-react';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number; // porcentaje 0-100
  fechaInicio: string;
  fechaFin?: string;
  responsable: string;
  tareasTotal: number;
  tareasCompletadas: number;
}

interface ObraCardProps {
  obra: Obra;
  onVerTareas: (obraId: string) => void;
}

export function ObraCard({ obra, onVerTareas }: ObraCardProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800 border-green-200';
      case 'pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <Play className="h-4 w-4" />;
      case 'pausada': return <Pause className="h-4 w-4" />;
      case 'finalizada': return <CheckCircle className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'activa': return 'Activa';
      case 'pausada': return 'Pausada';
      case 'finalizada': return 'Finalizada';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{obra.nombre}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{obra.direccion}</span>
                </div>
              </div>
            </div>
          </div>
          
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(obra.estado)}`}>
            {getEstadoIcon(obra.estado)}
            {getEstadoLabel(obra.estado)}
          </span>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de tareas</span>
            <span className="text-sm text-gray-600">{obra.avance}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${obra.avance}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Inicio: {new Date(obra.fechaInicio).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{obra.responsable}</span>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onVerTareas(obra.id)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span>Ver tareas</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
