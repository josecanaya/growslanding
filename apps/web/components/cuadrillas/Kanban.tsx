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
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
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

interface KanbanProps {
  cuadrillas?: Cuadrilla[];
}

export function Kanban({ cuadrillas: cuadrillasOverride }: KanbanProps = {}) {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const store = useCuadrillasStore();
  const cuadrillas = cuadrillasOverride ?? store.cuadrillas;
  const { filtros, moverCuadrilla, crearCuadrilla, error } = store;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<Especialidad | null>(null);
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
      'Albañilería / Estructura': 'bg-growsBlueLight/10',
      'Yesería / Terminaciones': 'bg-growsBlueLight/10',
      'Carpintería': 'bg-growsBlueLight/10',
      'Plomería / Gas': 'bg-growsBlueLight/10',
      'Electricidad': 'bg-growsBlueLight/10',
      'Pintura': 'bg-growsBlueLight/10',
    };
    return colores[especialidad as keyof typeof colores] || 'bg-growsBlueLight/10';
  };

  const activeCuadrilla = activeId ? cuadrillas.find(c => c.id === activeId) : null;

  return (
    <div className="min-h-screen bg-grows-gray">
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
                className={`rounded-grows-lg border border-dashed border-grows-border overflow-hidden ${getEspecialidadColor(especialidad)}`}
              >
                {/* Header del accordion */}
                <button
                  onClick={() => toggleSection(especialidad)}
                  className="w-full p-4 text-left transition-colors duration-200 hover:bg-grows-surface/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getEspecialidadIcon(especialidad)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-growsBlue">{especialidad}</h3>
                        <p className="text-sm text-growsTextMuted">
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
                        <span className="text-sm text-growsTextMuted">
                          {cuadrillasDisponibles > 0 ? 'Disponible' : 
                           totalCuadrillas > 0 ? 'Ocupado' : 'Sin cuadrillas'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-growsTextMuted" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-growsTextMuted" />
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
                          <div className="col-span-full flex items-center justify-center py-12 text-growsTextMuted">
                            <div className="text-center">
                              <div className="text-4xl mb-3">{getEspecialidadIcon(especialidad)}</div>
                              <p className="mb-2 text-lg font-medium text-growsBlue">No hay cuadrillas en esta especialidad</p>
                              <p className="text-sm">Arrastrá una cuadrilla acá para moverla</p>
                              <button 
                                onClick={() => {
                                  setEspecialidadSeleccionada(especialidad as Especialidad);
                                  setShowModalNueva(true);
                                }}
                                className="mx-auto mt-4 flex items-center space-x-2 rounded-grows-md border border-grows-border bg-grows-surface px-4 py-2 text-growsText transition-colors duration-200 hover:bg-grows-surface/80"
                              >
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

      {/* Modal Nueva Cuadrilla */}
      {showModalNueva && (
        <ModalNuevaCuadrilla
          especialidadInicial={especialidadSeleccionada}
          onClose={() => {
            setShowModalNueva(false);
            setEspecialidadSeleccionada(null);
          }}
          onGuardar={async (nuevaCuadrilla) => {
            if (currentUser?.orgId) {
              const resultado = await crearCuadrilla(nuevaCuadrilla, currentUser.orgId);
              if (resultado) {
                toast({
                  title: 'Cuadrilla creada',
                  description: 'La cuadrilla fue creada. El encargado podrá completar sus datos desde su app.',
                });
                setShowModalNueva(false);
                setEspecialidadSeleccionada(null);
              } else {
                toast({
                  title: 'Error',
                  description: error || 'No se pudo crear la cuadrilla',
                  variant: 'destructive',
                });
              }
            }
          }}
        />
      )}
    </div>
  );
}

// Componente Modal Nueva Cuadrilla - Simplificado (solo datos mínimos)
function ModalNuevaCuadrilla({ 
  especialidadInicial, 
  onClose, 
  onGuardar 
}: { 
  especialidadInicial: Especialidad | null;
  onClose: () => void; 
  onGuardar: (cuadrilla: Partial<Cuadrilla>) => void;
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    encargado: '',
    especialidad: especialidadInicial || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.encargado || !formData.especialidad) {
      return;
    }

    setIsSubmitting(true);
    
    // Solo enviar los datos mínimos - el resto lo completará el encargado
    const nuevaCuadrilla: Partial<Cuadrilla> = {
      nombre: formData.nombre,
      encargado: formData.encargado,
      especialidad: formData.especialidad as Especialidad,
      estado: 'Disponible' as any,
      // No enviamos: telefonoEncargado, whatsappEncargado, emailEncargado, integrantes, documentos
      // Estos los completará el encargado desde su app
    };
    
    await onGuardar(nuevaCuadrilla);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Registrar nueva cuadrilla</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ingresá los datos básicos. El encargado completará el resto desde su app.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la cuadrilla <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cuadrilla Albañilería Norte"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Seleccionar especialidad...</option>
              <option value="Albañilería / Estructura">Albañilería / Estructura</option>
              <option value="Yesería / Terminaciones">Yesería / Terminaciones</option>
              <option value="Carpintería">Carpintería</option>
              <option value="Plomería / Gas">Plomería / Gas</option>
              <option value="Electricidad">Electricidad</option>
              <option value="Pintura">Pintura</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encargado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.encargado}
              onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del encargado"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              El encargado podrá agregar su teléfono y email desde su app
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!formData.nombre || !formData.encargado || !formData.especialidad || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando...' : 'Crear cuadrilla'}
          </button>
        </div>
      </div>
    </div>
  );
}