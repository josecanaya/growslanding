'use client';

import React, { useState } from 'react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Building2,
  Users,
  ClipboardList
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface VisorTareasEjecucionProps {
  onClose: () => void;
}

interface TareaKanban {
  id: string;
  nombre: string;
  obra: string;
  cuadrilla: string;
  estado: 'PENDIENTE' | 'EN_EJECUCION' | 'TERMINADA';
  fechaInicio?: string;
  fechaFinEstimada?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
}

// Mock de tareas para el Kanban
const tareasMock: TareaKanban[] = [
  {
    id: '1',
    nombre: 'Excavación de cimientos',
    obra: 'Casa Familiar Los Robles',
    cuadrilla: 'Cuadrilla Albañilería Norte',
    estado: 'EN_EJECUCION',
    fechaInicio: '2024-03-01',
    fechaFinEstimada: '2024-03-05',
    prioridad: 'ALTA'
  },
  {
    id: '2',
    nombre: 'Instalación eléctrica baño',
    obra: 'Edificio Residencial Norte',
    cuadrilla: 'Cuadrilla Electricidad Este',
    estado: 'EN_EJECUCION',
    fechaInicio: '2024-03-02',
    fechaFinEstimada: '2024-03-08',
    prioridad: 'MEDIA'
  },
  {
    id: '3',
    nombre: 'Revestimiento exterior',
    obra: 'Casa Familiar Los Robles',
    cuadrilla: 'Cuadrilla Yesería Sur',
    estado: 'PENDIENTE',
    fechaFinEstimada: '2024-03-15',
    prioridad: 'BAJA'
  },
  {
    id: '4',
    nombre: 'Instalación de cañerías',
    obra: 'Edificio Residencial Norte',
    cuadrilla: 'Cuadrilla Plomería Oeste',
    estado: 'TERMINADA',
    fechaInicio: '2024-02-20',
    fechaFinEstimada: '2024-02-28',
    prioridad: 'ALTA'
  },
  {
    id: '5',
    nombre: 'Armado de vigas',
    obra: 'Casa Familiar Los Robles',
    cuadrilla: 'Cuadrilla Albañilería Norte',
    estado: 'PENDIENTE',
    fechaFinEstimada: '2024-03-20',
    prioridad: 'ALTA'
  },
  {
    id: '6',
    nombre: 'Pintura de interiores',
    obra: 'Edificio Residencial Norte',
    cuadrilla: 'Cuadrilla Pintura Centro',
    estado: 'EN_EJECUCION',
    fechaInicio: '2024-03-03',
    fechaFinEstimada: '2024-03-12',
    prioridad: 'MEDIA'
  }
];

const TareaCard: React.FC<{ tarea: TareaKanban }> = ({ tarea }) => {
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'border-l-red-500 bg-red-50';
      case 'MEDIA': return 'border-l-yellow-500 bg-yellow-50';
      case 'BAJA': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPrioridadIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIA': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'BAJA': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 ${getPrioridadColor(tarea.prioridad)} border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-sm">{tarea.nombre}</h4>
        <div className="flex items-center space-x-1">
          {getPrioridadIcon(tarea.prioridad)}
          <span className="text-xs font-medium text-gray-600">{tarea.prioridad}</span>
        </div>
      </div>

      {/* Información de la tarea */}
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center">
          <Building2 className="h-3 w-3 mr-2" />
          <span>{tarea.obra}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-3 w-3 mr-2" />
          <span>{tarea.cuadrilla}</span>
        </div>
        {tarea.fechaInicio && (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-2" />
            <span>Inicio: {new Date(tarea.fechaInicio).toLocaleDateString()}</span>
          </div>
        )}
        {tarea.fechaFinEstimada && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-2" />
            <span>Fin estimado: {new Date(tarea.fechaFinEstimada).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Progreso estimado */}
      {tarea.estado === 'EN_EJECUCION' && tarea.fechaInicio && tarea.fechaFinEstimada && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso estimado</span>
            <span>65%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export function VisorTareasEjecucion({ onClose }: VisorTareasEjecucionProps) {
  const [tareas, setTareas] = useState<TareaKanban[]>(tareasMock);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupar tareas por estado
  const tareasPorEstado = {
    PENDIENTE: tareas.filter(t => t.estado === 'PENDIENTE'),
    EN_EJECUCION: tareas.filter(t => t.estado === 'EN_EJECUCION'),
    TERMINADA: tareas.filter(t => t.estado === 'TERMINADA')
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const tareaId = active.id as string;
    const nuevoEstado = over.id as 'PENDIENTE' | 'EN_EJECUCION' | 'TERMINADA';

    setTareas(prev => prev.map(tarea => 
      tarea.id === tareaId ? { ...tarea, estado: nuevoEstado } : tarea
    ));
    
    setActiveId(null);
  };

  const estados = [
    { id: 'PENDIENTE', titulo: 'Pendiente', icono: Clock, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' },
    { id: 'EN_EJECUCION', titulo: 'En Ejecución', icono: AlertCircle, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { id: 'TERMINADA', titulo: 'Terminada', icono: CheckCircle, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' }
  ];

  const activeTarea = activeId ? tareas.find(t => t.id === activeId) : null;

  return (
    <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tareas en Ejecución</h1>
            <p className="text-gray-600 mt-1">
              {tareas.length} tareas totales • {tareasPorEstado.EN_EJECUCION.length} en ejecución
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        {/* Resumen ejecutivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {estados.map(estado => {
            const Icon = estado.icono;
            const tareasEstado = tareasPorEstado[estado.id as keyof typeof tareasPorEstado];
            return (
              <div key={estado.id} className={`p-6 rounded-lg border ${estado.color}`}>
                <div className="flex items-center">
                  <Icon className={`h-8 w-8 ${estado.textColor}`} />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{tareasEstado.length}</p>
                    <p className={estado.textColor}>{estado.titulo}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {estados.map(estado => {
              const Icon = estado.icono;
              const tareasEstado = tareasPorEstado[estado.id as keyof typeof tareasPorEstado];
              
              return (
                <div key={estado.id} className="bg-white rounded-lg border border-gray-200">
                  {/* Header de columna */}
                  <div className={`p-4 border-b border-gray-200 ${estado.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${estado.textColor}`} />
                        <h3 className={`font-semibold ${estado.textColor}`}>{estado.titulo}</h3>
                      </div>
                      <span className={`text-sm font-medium ${estado.textColor}`}>
                        {tareasEstado.length}
                      </span>
                    </div>
                  </div>

                  {/* Área de drop */}
                  <div 
                    className="p-4 min-h-[400px]"
                    id={estado.id}
                  >
                    <SortableContext
                      items={tareasEstado.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {tareasEstado.map(tarea => (
                          <TareaCard key={tarea.id} tarea={tarea} />
                        ))}
                        
                        {/* Mensaje cuando no hay tareas */}
                        {tareasEstado.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Icon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No hay tareas en {estado.titulo.toLowerCase()}</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTarea ? (
              <div className="opacity-90">
                <TareaCard tarea={activeTarea} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Instrucciones */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <ClipboardList className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Instrucciones</h4>
              <p className="text-sm text-blue-700 mt-1">
                Arrastra las tareas entre columnas para cambiar su estado. 
                Las tareas se actualizarán automáticamente en el sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
