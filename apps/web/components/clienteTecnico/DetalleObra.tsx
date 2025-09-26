'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, CheckCircle, Clock, AlertCircle, Play, Pause, Upload, Trash2 } from 'lucide-react';
import { ModalCrearTarea } from './modals/ModalCrearTarea';

interface Obra {
  id: string;
  nombre: string;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  tareasActivas: number;
  tareasCompletadas: number;
  estado: 'activa' | 'pausada' | 'finalizada';
}

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
}

interface DetalleObraProps {
  obra: Obra;
  tareas: Tarea[];
  onVolver: () => void;
  onActualizarTarea: (tarea: Tarea) => void;
  onCrearTarea: (tarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => void;
  onEliminarTarea: (tareaId: string) => void;
}

const etapas = [
  { key: 'estructura', nombre: 'Estructura', color: 'bg-blue-100 text-blue-800' },
  { key: 'obra_gris', nombre: 'Obra Gris', color: 'bg-gray-100 text-gray-800' },
  { key: 'terminaciones', nombre: 'Terminaciones', color: 'bg-green-100 text-green-800' }
];

const lideresDisponibles = [
  'Juan Pérez',
  'María López',
  'Carlos Rodríguez',
  'Ana García',
  'Pedro Martínez'
];

export function DetalleObra({ obra, tareas, onVolver, onActualizarTarea, onCrearTarea, onEliminarTarea }: DetalleObraProps) {
  const [showModalTarea, setShowModalTarea] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<'estructura' | 'obra_gris' | 'terminaciones'>('estructura');

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'bloqueada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_progreso':
        return <Play className="h-4 w-4" />;
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'bloqueada':
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const cambiarEstadoTarea = (tarea: Tarea, nuevoEstado: Tarea['estado']) => {
    const tareaActualizada = { ...tarea, estado: nuevoEstado };
    onActualizarTarea(tareaActualizada);
  };

  const puedeCrearTarea = (etapa: string) => {
    // Siempre se puede crear tareas en cualquier etapa
    // La precedencia se maneja a nivel individual de tarea
    return true;
  };

  const tareasPorEtapa = (etapa: string) => {
    return tareas.filter(t => t.etapa === etapa).sort((a, b) => {
      // Ordenar por precedencia
      if (a.precedencia.includes(b.id)) return 1;
      if (b.precedencia.includes(a.id)) return -1;
      return 0;
    });
  };

  const handleCrearTarea = (nuevaTarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => {
    onCrearTarea({
      ...nuevaTarea,
      etapa: etapaSeleccionada
    });
    setShowModalTarea(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onVolver}
                className="text-primario hover:text-primario/80 transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-primario">{obra.nombre}</h2>
                <p className="text-sm text-primario/70">{obra.ubicacion}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primario">{obra.progreso}%</div>
              <div className="text-sm text-primario/70">Progreso General</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso General */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-primario/70">Progreso General</span>
          <span className="font-medium text-primario">{obra.progreso}%</span>
        </div>
        <div className="w-full bg-claro rounded-full h-3">
          <div 
            className="bg-primario h-3 rounded-full transition-all duration-300"
            style={{ width: `${obra.progreso}%` }}
          ></div>
        </div>
      </div>

      {/* Navegación de Etapas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <h3 className="text-lg font-semibold text-primario">Etapas de Construcción</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {etapas.map((etapa) => {
              const tareasEtapa = tareasPorEtapa(etapa.key);
              const completadas = tareasEtapa.filter(t => t.estado === 'completada').length;
              const total = tareasEtapa.length;
              const progresoEtapa = total > 0 ? (completadas / total) * 100 : 0;

              return (
                <button
                  key={etapa.key}
                  onClick={() => setEtapaSeleccionada(etapa.key as any)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    etapaSeleccionada === etapa.key
                      ? 'border-primario bg-primario/5'
                      : 'border-claro hover:border-primario/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${etapa.color}`}>
                      {etapa.nombre}
                    </div>
                    <div className="text-2xl font-bold text-primario mb-1">{Math.round(progresoEtapa)}%</div>
                    <div className="text-sm text-primario/70">{completadas}/{total} tareas</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tareas de la Etapa Seleccionada */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-claro px-6 py-4 border-b border-claro flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primario">
            Tareas - {etapas.find(e => e.key === etapaSeleccionada)?.nombre}
          </h3>
          {puedeCrearTarea(etapaSeleccionada) && (
            <button
              onClick={() => setShowModalTarea(true)}
              className="bg-primario text-white px-4 py-2 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Tarea</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {tareasPorEtapa(etapaSeleccionada).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-primario/50 text-4xl mb-4">📋</div>
              <h4 className="text-lg font-semibold text-primario mb-2">No hay tareas en esta etapa</h4>
              <p className="text-primario/70 mb-4">Crea la primera tarea para comenzar</p>
              {puedeCrearTarea(etapaSeleccionada) && (
                <button
                  onClick={() => setShowModalTarea(true)}
                  className="bg-primario text-white px-6 py-3 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200"
                >
                  Crear Primera Tarea
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tareasPorEtapa(etapaSeleccionada).map((tarea) => (
                <div key={tarea.id} className="border border-claro rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-primario">{tarea.nombre}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getEstadoColor(tarea.estado)}`}>
                        {getEstadoIcon(tarea.estado)}
                        <span className="capitalize">{tarea.estado.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tarea.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstadoTarea(tarea, 'en_progreso')}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors duration-200"
                        >
                          Iniciar
                        </button>
                      )}
                      {tarea.estado === 'en_progreso' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoTarea(tarea, 'completada')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors duration-200"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => cambiarEstadoTarea(tarea, 'bloqueada')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors duration-200"
                          >
                            Bloquear
                          </button>
                        </>
                      )}
                      {tarea.estado === 'bloqueada' && (
                        <button
                          onClick={() => cambiarEstadoTarea(tarea, 'en_progreso')}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors duration-200"
                        >
                          Reanudar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que quieres eliminar la tarea "${tarea.nombre}"?`)) {
                            onEliminarTarea(tarea.id);
                          }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-primario/70">Líder:</span>
                      <span className="ml-2 text-primario">{tarea.lider}</span>
                    </div>
                    <div>
                      <span className="text-primario/70">Período:</span>
                      <span className="ml-2 text-primario">
                        {new Date(tarea.fechaInicio).toLocaleDateString('es-ES')} - {new Date(tarea.fechaFin).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mt-3">
                    <span className="text-sm text-primario/70 mb-2 block">Checklist:</span>
                    <div className="flex flex-wrap gap-2">
                      {tarea.checklist.map((item, index) => (
                        <span key={index} className="bg-claro text-primario px-2 py-1 rounded text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Evidencias */}
                  <div className="mt-3">
                    <button
                      onClick={() => alert('📸 Funcionalidad de evidencias en desarrollo')}
                      className="flex items-center space-x-2 text-primario/70 hover:text-primario transition-colors duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Subir evidencias ({tarea.evidencias.length})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Tarea */}
      {showModalTarea && (
        <ModalCrearTarea
          onClose={() => setShowModalTarea(false)}
          onSave={handleCrearTarea}
          obra={obra}
          etapa={etapaSeleccionada}
          tareasExistentes={tareasPorEtapa(etapaSeleccionada)}
        />
      )}
    </div>
  );
}
