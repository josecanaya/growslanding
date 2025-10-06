'use client';

import { useState } from 'react';
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
import { Cuadrilla, Especialidad } from '@/lib/types/cuadrillas';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { CuadrillaCard } from './CuadrillaCard';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

const especialidades: Especialidad[] = [
  'Albañilería / Estructura',
  'Yesería / Terminaciones', 
  'Carpintería',
  'Plomería / Gas',
  'Electricidad',
  'Pintura'
];

export function Kanban() {
  const { cuadrillas, filtros, moverCuadrilla } = useCuadrillasStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Albañilería / Estructura': true,
    'Yesería / Terminaciones': true,
    'Carpintería': true,
    'Plomería / Gas': false,
    'Electricidad': true,
    'Pintura': false
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filtrar cuadrillas
  const cuadrillasFiltradas = cuadrillas.filter(cuadrilla => {
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const matchBusqueda = 
        cuadrilla.nombre.toLowerCase().includes(busqueda) ||
        cuadrilla.encargado.toLowerCase().includes(busqueda) ||
        cuadrilla.especialidad.toLowerCase().includes(busqueda);
      if (!matchBusqueda) return false;
    }

    if (filtros.especialidad && cuadrilla.especialidad !== filtros.especialidad) {
      return false;
    }

    if (filtros.estado && cuadrilla.estado !== filtros.estado) {
      return false;
    }

    return true;
  });

  // Agrupar cuadrillas por especialidad
  const cuadrillasPorEspecialidad = especialidades.map(especialidad => ({
    especialidad,
    cuadrillas: cuadrillasFiltradas.filter(c => c.especialidad === especialidad)
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const cuadrillaId = active.id as string;
    const nuevaEspecialidad = over.id as Especialidad;

    // Encontrar la cuadrilla actual
    const cuadrilla = cuadrillas.find(c => c.id === cuadrillaId);
    if (!cuadrilla || cuadrilla.especialidad === nuevaEspecialidad) return;

    // Mover la cuadrilla a la nueva especialidad
    moverCuadrilla(cuadrillaId, nuevaEspecialidad);
    
    setActiveId(null);
  };

  const toggleSection = (especialidad: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [especialidad]: !prev[especialidad]
    }));
  };

  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': '🏗️',
      'Yesería / Terminaciones': '🎨',
      'Carpintería': '🔨',
      'Plomería / Gas': '🔧',
      'Electricidad': '⚡',
      'Pintura': '🖌️'
    };
    return iconos[especialidad as keyof typeof iconos] || '👷‍♂️';
  };

  const getEspecialidadColor = (especialidad: string) => {
    const colores = {
      'Albañilería / Estructura': 'bg-orange-50 border-orange-200',
      'Yesería / Terminaciones': 'bg-pink-50 border-pink-200',
      'Carpintería': 'bg-amber-50 border-amber-200',
      'Plomería / Gas': 'bg-blue-50 border-blue-200',
      'Electricidad': 'bg-yellow-50 border-yellow-200',
      'Pintura': 'bg-purple-50 border-purple-200'
    };
    return colores[especialidad as keyof typeof colores] || 'bg-gray-50 border-gray-200';
  };

  const activeCuadrilla = activeId ? cuadrillas.find(c => c.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {cuadrillasPorEspecialidad.map(({ especialidad, cuadrillas: cuadrillasColumna }) => {
            const isExpanded = expandedSections[especialidad];
            const totalCuadrillas = cuadrillasColumna.length;
            const cuadrillasDisponibles = cuadrillasColumna.filter(c => c.estado === 'Disponible').length;
            
            return (
              <div
                key={especialidad}
                className={`${getEspecialidadColor(especialidad)} rounded-xl border-2 border-dashed overflow-hidden`}
              >
                {/* Header del accordion */}
                <button
                  onClick={() => toggleSection(especialidad)}
                  className="w-full p-4 text-left hover:bg-white/30 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getEspecialidadIcon(especialidad)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{especialidad}</h3>
                        <p className="text-sm text-gray-600">
                          {totalCuadrillas} cuadrillas • {cuadrillasDisponibles} disponibles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Indicador de estado general */}
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          cuadrillasDisponibles > 0 ? 'bg-green-500' : 
                          totalCuadrillas > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                          {cuadrillasDisponibles > 0 ? 'Disponible' : 
                           totalCuadrillas > 0 ? 'Ocupado' : 'Sin cuadrillas'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Contenido del accordion */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <SortableContext
                      items={cuadrillasColumna.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[120px]">
                        {cuadrillasColumna.map((cuadrilla) => (
                          <CuadrillaCard
                            key={cuadrilla.id}
                            cuadrilla={cuadrilla}
                          />
                        ))}
                        
                        {/* Mensaje cuando no hay cuadrillas */}
                        {cuadrillasColumna.length === 0 && (
                          <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
                            <div className="text-center">
                              <div className="text-4xl mb-3">{getEspecialidadIcon(especialidad)}</div>
                              <p className="text-lg font-medium mb-2">No hay cuadrillas en esta especialidad</p>
                              <p className="text-sm">Arrastra una cuadrilla aquí para moverla</p>
                              <button className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors duration-200">
                                <Plus className="h-4 w-4" />
                                <span>Agregar cuadrilla</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCuadrilla ? (
            <div className="opacity-90">
              <CuadrillaCard cuadrilla={activeCuadrilla} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}