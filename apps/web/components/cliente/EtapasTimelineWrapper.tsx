'use client';

import { EtapasTimeline } from './EtapasTimeline';

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

interface Obra {
  id: string;
  nombre: string;
  cliente?: string;
  localizacion?: string;
}

interface EtapasTimelineWrapperProps {
  obra: Obra;
  tareas: Tarea[];
}

export function EtapasTimelineWrapper({ obra, tareas }: EtapasTimelineWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Timeline de Etapas - {obra.nombre}
          </h2>
          <p className="text-gray-600">
            Haz clic en cada etapa para ver el timeline detallado de tareas
          </p>
          {obra.cliente && (
            <p className="text-sm text-gray-500 mt-1">
              Cliente: {obra.cliente}
            </p>
          )}
          {obra.localizacion && (
            <p className="text-sm text-gray-500">
              Ubicación: {obra.localizacion}
            </p>
          )}
        </div>
        
        <EtapasTimeline 
          tareas={tareas}
          obraId={obra.id}
        />
      </div>
    </div>
  );
}

