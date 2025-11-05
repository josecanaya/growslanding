'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, Clock, AlertCircle } from 'lucide-react';
import { ElementoConstructivo, TareaGenerada } from '../WizardCrearObra';

interface PasoRevisionTareasProps {
  elementos: ElementoConstructivo[];
  tareas: TareaGenerada[];
  onTareasChange: (tareas: TareaGenerada[]) => void;
}

const ETAPAS = [
  { id: 'estructura', nombre: 'Estructura', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'obra_gris', nombre: 'Obra Gris', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'terminaciones', nombre: 'Terminaciones', color: 'bg-green-100 text-green-800 border-green-200' }
];

export function PasoRevisionTareas({ elementos, tareas, onTareasChange }: PasoRevisionTareasProps) {
  const [tareaEditando, setTareaEditando] = useState<string | null>(null);
  const [tareaEditada, setTareaEditada] = useState<TareaGenerada | null>(null);

  // Generar tareas automáticamente basadas en los elementos seleccionados
  useEffect(() => {
    if (elementos.length > 0 && tareas.length === 0) {
      const nuevasTareas: TareaGenerada[] = elementos.map((elemento, index) => {
        // Determinar etapa basada en la categoría del elemento
        let etapa: 'estructura' | 'obra_gris' | 'terminaciones' = 'obra_gris';
        if (['fundaciones', 'muros', 'cubiertas', 'escaleras'].includes(elemento.categoria)) {
          etapa = 'estructura';
        } else if (['terminaciones', 'pintura-interior', 'pintura-exterior', 'revestimiento'].includes(elemento.id)) {
          etapa = 'terminaciones';
        }

        return {
          id: `tarea-${elemento.id}-${index}`,
          nombre: elemento.nombre,
          descripcion: elemento.descripcion,
          duracion: elemento.duracion,
          etapa,
          precedencias: [],
          esCritica: false
        };
      });

      onTareasChange(nuevasTareas);
    }
  }, [elementos, tareas.length, onTareasChange]);

  const handleEditarTarea = (tarea: TareaGenerada) => {
    setTareaEditando(tarea.id);
    setTareaEditada({ ...tarea });
  };

  const handleGuardarTarea = () => {
    if (tareaEditada) {
      const tareasActualizadas = tareas.map(t => 
        t.id === tareaEditada.id ? tareaEditada : t
      );
      onTareasChange(tareasActualizadas);
      setTareaEditando(null);
      setTareaEditada(null);
    }
  };

  const handleCancelarEdicion = () => {
    setTareaEditando(null);
    setTareaEditada(null);
  };

  const handleEliminarTarea = (tareaId: string) => {
    onTareasChange(tareas.filter(t => t.id !== tareaId));
  };

  const handleCambiarEtapa = (tareaId: string, nuevaEtapa: 'estructura' | 'obra_gris' | 'terminaciones') => {
    const tareasActualizadas = tareas.map(t => 
      t.id === tareaId ? { ...t, etapa: nuevaEtapa } : t
    );
    onTareasChange(tareasActualizadas);
  };

  const getTareasPorEtapa = (etapa: string) => {
    return tareas.filter(t => t.etapa === etapa);
  };

  const getDuracionPorEtapa = (etapa: string) => {
    return getTareasPorEtapa(etapa).reduce((total, tarea) => total + tarea.duracion, 0);
  };

  const duracionTotal = tareas.reduce((total, tarea) => total + tarea.duracion, 0);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primario mb-2">Revisión de Tareas</h3>
          <p className="text-primario/70">
            Revisa y ajusta las tareas generadas automáticamente para tu obra
          </p>
        </div>

        {/* Resumen general */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primario">{tareas.length}</div>
              <div className="text-sm text-gray-600">Total de tareas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primario">{duracionTotal}</div>
              <div className="text-sm text-gray-600">Días totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primario">
                {Math.ceil(duracionTotal / 7)}
              </div>
              <div className="text-sm text-gray-600">Semanas estimadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primario">
                {Math.ceil(duracionTotal / 30)}
              </div>
              <div className="text-sm text-gray-600">Meses estimados</div>
            </div>
          </div>
        </div>

        {/* Tareas por etapa */}
        <div className="space-y-8">
          {ETAPAS.map((etapa) => {
            const tareasEtapa = getTareasPorEtapa(etapa.id);
            const duracionEtapa = getDuracionPorEtapa(etapa.id);

            return (
              <div key={etapa.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-6 py-4 border-b ${etapa.color}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{etapa.nombre}</h4>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{tareasEtapa.length} tareas</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{duracionEtapa} días</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {tareasEtapa.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No hay tareas en esta etapa</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tareasEtapa.map((tarea) => (
                        <div
                          key={tarea.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          {tareaEditando === tarea.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-primario mb-1">
                                  Nombre de la tarea
                                </label>
                                <input
                                  type="text"
                                  value={tareaEditada?.nombre || ''}
                                  onChange={(e) => setTareaEditada(prev => 
                                    prev ? { ...prev, nombre: e.target.value } : null
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-primario mb-1">
                                  Descripción
                                </label>
                                <textarea
                                  value={tareaEditada?.descripcion || ''}
                                  onChange={(e) => setTareaEditada(prev => 
                                    prev ? { ...prev, descripcion: e.target.value } : null
                                  )}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-primario mb-1">
                                    Duración (días)
                                  </label>
                                  <input
                                    type="number"
                                    value={tareaEditada?.duracion || 0}
                                    onChange={(e) => setTareaEditada(prev => 
                                      prev ? { ...prev, duracion: parseInt(e.target.value) || 0 } : null
                                    )}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primario mb-1">
                                    Etapa
                                  </label>
                                  <select
                                    value={tareaEditada?.etapa || 'obra_gris'}
                                    onChange={(e) => setTareaEditada(prev => 
                                      prev ? { ...prev, etapa: e.target.value as 'estructura' | 'obra_gris' | 'terminaciones' } : null
                                    )}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
                                  >
                                    {ETAPAS.map(etapa => (
                                      <option key={etapa.id} value={etapa.id}>{etapa.nombre}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`critica-${tarea.id}`}
                                  checked={tareaEditada?.esCritica || false}
                                  onChange={(e) => setTareaEditada(prev => 
                                    prev ? { ...prev, esCritica: e.target.checked } : null
                                  )}
                                  className="rounded border-gray-300 text-primario focus:ring-primario"
                                />
                                <label htmlFor={`critica-${tarea.id}`} className="text-sm text-primario">
                                  Tarea crítica
                                </label>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleGuardarTarea}
                                  className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario/90 transition-colors duration-200 flex items-center space-x-2"
                                >
                                  <Save className="h-4 w-4" />
                                  <span>Guardar</span>
                                </button>
                                <button
                                  onClick={handleCancelarEdicion}
                                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center space-x-2"
                                >
                                  <X className="h-4 w-4" />
                                  <span>Cancelar</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h5 className="font-medium text-primario">{tarea.nombre}</h5>
                                  {tarea.esCritica && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                      Crítica
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{tarea.descripcion}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{tarea.duracion} días</span>
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    ETAPAS.find(e => e.id === tarea.etapa)?.color || 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {ETAPAS.find(e => e.id === tarea.etapa)?.nombre}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditarTarea(tarea)}
                                  className="text-primario hover:text-primario/80 transition-colors duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarTarea(tarea.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

