'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, ZoomIn, ZoomOut, Move, Link } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Tipos de datos
interface TareaGantt {
  id: string;
  nombre: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  fechaInicio: string;
  fechaFin: string;
  duracion: number; // en días
  responsable: string;
  etapa: string;
  dependencias: string[];
  color: string;
}

interface Conexion {
  id: string;
  desde: string;
  hasta: string;
}

// Datos mock
const tareasIniciales: TareaGantt[] = [
  {
    id: '1',
    nombre: 'Excavación y fundaciones',
    estado: 'Finalizada',
    fechaInicio: '2024-01-15',
    fechaFin: '2024-01-30',
    duracion: 15,
    responsable: 'Carlos Pérez',
    etapa: 'Estructura',
    dependencias: [],
    color: '#10B981'
  },
  {
    id: '2',
    nombre: 'Estructura de hormigón',
    estado: 'En curso',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-03-15',
    duracion: 43,
    responsable: 'María González',
    etapa: 'Estructura',
    dependencias: ['1'],
    color: '#3B82F6'
  },
  {
    id: '3',
    nombre: 'Instalaciones eléctricas',
    estado: 'Pendiente',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-20',
    duracion: 19,
    responsable: 'Roberto Silva',
    etapa: 'Instalaciones',
    dependencias: ['2'],
    color: '#F59E0B'
  },
  {
    id: '4',
    nombre: 'Mampostería y revoques',
    estado: 'Pendiente',
    fechaInicio: '2024-03-20',
    fechaFin: '2024-04-15',
    duracion: 26,
    responsable: 'Luis Rodríguez',
    etapa: 'Obra gris',
    dependencias: ['2'],
    color: '#F59E0B'
  },
  {
    id: '5',
    nombre: 'Pintura y terminaciones',
    estado: 'Pendiente',
    fechaInicio: '2024-04-20',
    fechaFin: '2024-05-15',
    duracion: 25,
    responsable: 'Elena Fernández',
    etapa: 'Terminaciones',
    dependencias: ['3', '4'],
    color: '#F59E0B'
  }
];

interface EditorVisualProps {
  tareas: TareaGantt[];
  tareaSeleccionada: string | null;
  onTareaSelect: (tareaId: string | null) => void;
}

function EditorVisual({ tareas, tareaSeleccionada, onTareaSelect }: EditorVisualProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return '#F59E0B';
      case 'En curso': return '#3B82F6';
      case 'Finalizada': return '#10B981';
      case 'Aprobada': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Estructura': return '#EF4444';
      case 'Obra gris': return '#6B7280';
      case 'Instalaciones': return '#3B82F6';
      case 'Terminaciones': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Visual</h3>
      
      <div className="space-y-4">
        {tareas.map((tarea, index) => (
          <div
            key={tarea.id}
            onClick={() => onTareaSelect(tarea.id)}
            className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
              tareaSeleccionada === tarea.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>Duración: {tarea.duracion} días</span>
                  <span>Responsable: {tarea.responsable}</span>
                  <span>Etapa: {tarea.etapa}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getEstadoColor(tarea.estado) }}
                  title={`Estado: ${tarea.estado}`}
                ></div>
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getEtapaColor(tarea.etapa) }}
                  title={`Etapa: ${tarea.etapa}`}
                ></div>
              </div>
            </div>
            
            {/* Barra de duración visual */}
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>{tarea.fechaInicio}</span>
                <span>→</span>
                <span>{tarea.fechaFin}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: getEstadoColor(tarea.estado),
                    width: tarea.estado === 'Finalizada' || tarea.estado === 'Aprobada' ? '100%' : '60%'
                  }}
                ></div>
              </div>
            </div>

            {/* Dependencias */}
            {tarea.dependencias.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Depende de: {tarea.dependencias.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Instrucciones */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
        <div className="space-y-1">
          <div>• Hacé clic en una tarea para seleccionarla</div>
          <div>• Los colores indican el estado (verde=completada, azul=en curso, amarillo=pendiente)</div>
          <div>• Las barras muestran la duración y progreso de cada tarea</div>
          <div>• Usá los botones de arriba para crear, eliminar o conectar tareas</div>
        </div>
      </div>
    </div>
  );
}

interface PanelLateralProps {
  tareas: TareaGantt[];
  onNuevaTarea: () => void;
  onEliminarTarea: () => void;
  tareaSeleccionada: string | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

function PanelLateral({ tareas, onNuevaTarea, onEliminarTarea, tareaSeleccionada, zoom, onZoomChange }: PanelLateralProps) {
  const tiempoTotal = tareas.reduce((acc, tarea) => acc + tarea.duracion, 0);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Panel de control</h3>
      
      {/* Resumen rápido */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Resumen rápido</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>Total de tareas: <span className="font-medium text-gray-900">{tareas.length}</span></div>
            <div>Tiempo total: <span className="font-medium text-gray-900">{tiempoTotal} días</span></div>
            <div>Tareas completadas: <span className="font-medium text-gray-900">{tareas.filter(t => t.estado === 'Finalizada' || t.estado === 'Aprobada').length}</span></div>
          </div>
        </div>
      </div>

      {/* Controles de zoom */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Zoom</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Lista de tareas</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tareas.map(tarea => (
            <div
              key={tarea.id}
              onClick={() => {/* Seleccionar tarea */}}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                tareaSeleccionada === tarea.id 
                  ? 'bg-blue-100 border border-blue-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{tarea.nombre}</div>
              <div className="text-xs text-gray-600">{tarea.duracion} días • {tarea.estado}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-2">
        <button
          onClick={onNuevaTarea}
          className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva tarea
        </button>
        
        {tareaSeleccionada && (
          <button
            onClick={onEliminarTarea}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar tarea
          </button>
        )}
      </div>
    </div>
  );
}

interface TareasEditorPageProps {
  params: {
    obraId: string;
  } | Promise<{ obraId: string }>;
}

// @ts-expect-error Next.js 15 PageProps typing currently expects params as Promise
export default function TareasEditorPage({ params }: TareasEditorPageProps) {
  const obraId = (params as { obraId: string }).obraId ?? '';
  const router = useRouter();
  const [tareas, setTareas] = useState<TareaGantt[]>(tareasIniciales);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState<'seleccion' | 'conexion'>('seleccion');
  const [zoom, setZoom] = useState(1);

  const handleVolver = () => {
    router.push(`/cliente/tareas/${obraId}`);
  };

  const handleNuevaTarea = () => {
    const nuevaTarea: TareaGantt = {
      id: `tarea-${Date.now()}`,
      nombre: 'Nueva tarea',
      estado: 'Pendiente',
      fechaInicio: '2024-01-01',
      fechaFin: '2024-01-07',
      duracion: 7,
      responsable: 'Sin asignar',
      etapa: 'Estructura',
      dependencias: [],
      color: '#F59E0B'
    };

    setTareas(prev => [...prev, nuevaTarea]);
    setTareaSeleccionada(nuevaTarea.id);
  };

  const handleEliminarTarea = () => {
    if (tareaSeleccionada) {
      setTareas(prev => prev.filter(t => t.id !== tareaSeleccionada));
      setConexiones(prev => prev.filter(c => 
        c.desde !== tareaSeleccionada && c.hasta !== tareaSeleccionada
      ));
      setTareaSeleccionada(null);
    }
  };

  const handleGuardar = () => {
    console.log('Guardando cambios del Gantt:', { tareas, conexiones });
    // Aquí se implementaría la lógica para guardar los cambios
    router.push(`/cliente/tareas/${obraId}`);
  };

  const handleTareaSelect = (tareaId: string | null) => {
    setTareaSeleccionada(tareaId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editor de Planificación (Gantt)</h1>
                <p className="text-gray-600 mt-1">Arrastrá y conectá las tareas para crear el cronograma</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGuardar}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Modo:</span>
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setModoEdicion('seleccion')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    modoEdicion === 'seleccion' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Move className="h-4 w-4 inline mr-1" />
                  Mover
                </button>
                <button
                  onClick={() => setModoEdicion('conexion')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    modoEdicion === 'conexion' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Link className="h-4 w-4 inline mr-1" />
                  Conectar
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {tareaSeleccionada ? `Tarea seleccionada: ${tareas.find(t => t.id === tareaSeleccionada)?.nombre}` : 'Hacé clic en una tarea para seleccionarla'}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <PanelLateral
              tareas={tareas}
              onNuevaTarea={handleNuevaTarea}
              onEliminarTarea={handleEliminarTarea}
              tareaSeleccionada={tareaSeleccionada}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>

          {/* Editor visual */}
          <div className="lg:col-span-3">
            <EditorVisual
              tareas={tareas}
              tareaSeleccionada={tareaSeleccionada}
              onTareaSelect={handleTareaSelect}
            />
          </div>
        </div>

        {/* Leyenda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
              <span className="text-sm text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
              <span className="text-sm text-gray-600">En curso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
              <span className="text-sm text-gray-600">Finalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
              <span className="text-sm text-gray-600">Aprobada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

