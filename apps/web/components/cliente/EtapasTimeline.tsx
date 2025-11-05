'use client';

import { useState } from 'react';
import { Building, Wrench, Paintbrush, Calendar, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  plantilla: string;
  checklist: string[];
  evidencias: string[];
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  precedencia: string[];
  duracion: number;
  esCritica: boolean;
  tiempoTemprano: number;
  tiempoTardio: number;
}

interface EtapasTimelineProps {
  tareas: Tarea[];
  obraId: string;
}

const ETAPAS = [
  { 
    id: 'estructura', 
    nombre: 'Estructura', 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: Building,
    descripcion: 'Fundaciones, columnas, vigas y losas'
  },
  { 
    id: 'obra_gris', 
    nombre: 'Obra Gris', 
    color: 'bg-gray-500', 
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: Wrench,
    descripcion: 'Mampostería, instalaciones básicas'
  },
  { 
    id: 'terminaciones', 
    nombre: 'Terminaciones', 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: Paintbrush,
    descripcion: 'Revoques, pintura, acabados finales'
  }
];

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'completada':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'en_progreso':
      return <PlayCircle className="h-4 w-4 text-blue-600" />;
    case 'bloqueada':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'completada':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en_progreso':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'bloqueada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function EtapasTimeline({ tareas, obraId }: EtapasTimelineProps) {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<string | null>(null);

  const tareasPorEtapa = ETAPAS.map(etapa => ({
    ...etapa,
    tareas: tareas.filter(tarea => tarea.etapa === etapa.id)
  }));

  const calcularProgreso = (tareasEtapa: Tarea[]) => {
    if (tareasEtapa.length === 0) return 0;
    const completadas = tareasEtapa.filter(t => t.estado === 'completada').length;
    return Math.round((completadas / tareasEtapa.length) * 100);
  };

  const TimelineTarea = ({ tarea }: { tarea: Tarea }) => {
    const fechaInicio = new Date(tarea.fechaInicio);
    const fechaFin = new Date(tarea.fechaFin);
    const hoy = new Date();
    
    const esPasada = fechaFin < hoy;
    const esActual = fechaInicio <= hoy && fechaFin >= hoy;
    const esFutura = fechaInicio > hoy;

    return (
      <div className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
        esActual ? 'border-blue-300 bg-blue-50' : 
        esPasada ? 'border-gray-200 bg-gray-50' : 
        'border-gray-100 bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getEstadoIcon(tarea.estado)}
              <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
              {tarea.esCritica && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Crítica
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {fechaInicio.toLocaleDateString('es-AR')} - {fechaFin.toLocaleDateString('es-AR')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tarea.duracion} días
              </div>
              {tarea.lider && (
                <div className="text-xs text-gray-500">
                  Líder: {tarea.lider}
                </div>
              )}
            </div>
            {tarea.checklist.length > 0 && (
              <div className="text-xs text-gray-500">
                {tarea.checklist.length} items en checklist
              </div>
            )}
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getEstadoColor(tarea.estado)}`}>
            {tarea.estado.replace('_', ' ')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Vista de Etapas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tareasPorEtapa.map((etapa) => {
          const progreso = calcularProgreso(etapa.tareas);
          const IconComponent = etapa.icon;
          
          return (
            <div
              key={etapa.id}
              onClick={() => setEtapaSeleccionada(etapa.id)}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${etapa.bgColor} ${etapa.borderColor} border-2 rounded-xl p-6`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${etapa.color} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${etapa.textColor}`}>
                    {etapa.nombre}
                  </h3>
                  <p className="text-sm text-gray-600">{etapa.descripcion}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progreso</span>
                  <span className={`font-semibold ${etapa.textColor}`}>{progreso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${etapa.color}`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{etapa.tareas.length} tareas</span>
                  <span>{etapa.tareas.filter(t => t.estado === 'completada').length} completadas</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista de Timeline */}
      {etapaSeleccionada && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {(() => {
                const etapa = ETAPAS.find(e => e.id === etapaSeleccionada);
                const IconComponent = etapa?.icon;
                return (
                  <>
                    <div className={`p-2 rounded-lg ${etapa?.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Timeline - {etapa?.nombre}
                    </h2>
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => setEtapaSeleccionada(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {tareasPorEtapa
              .find(e => e.id === etapaSeleccionada)
              ?.tareas.map((tarea) => (
                <TimelineTarea key={tarea.id} tarea={tarea} />
              ))}
            
            {tareasPorEtapa.find(e => e.id === etapaSeleccionada)?.tareas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay tareas asignadas a esta etapa</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

