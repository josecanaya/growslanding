'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Link, Unlink, ZoomIn, ZoomOut, Move } from 'lucide-react';

// Tipos de datos
interface TareaGantt {
  id: string;
  nombre: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  fechaInicio: string;
  fechaFin: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dependencias: string[];
  color: string;
}

interface Conexion {
  id: string;
  desde: string;
  hasta: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Datos mock
const tareasIniciales: TareaGantt[] = [
  {
    id: '1',
    nombre: 'Excavación y fundaciones',
    estado: 'Finalizada',
    fechaInicio: '2024-01-15',
    fechaFin: '2024-01-30',
    x: 50,
    y: 100,
    width: 200,
    height: 40,
    dependencias: [],
    color: '#10B981'
  },
  {
    id: '2',
    nombre: 'Estructura de hormigón',
    estado: 'En curso',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-03-15',
    x: 300,
    y: 100,
    width: 300,
    height: 40,
    dependencias: ['1'],
    color: '#3B82F6'
  },
  {
    id: '3',
    nombre: 'Instalaciones eléctricas',
    estado: 'Pendiente',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-20',
    x: 650,
    y: 100,
    width: 200,
    height: 40,
    dependencias: ['2'],
    color: '#F59E0B'
  },
  {
    id: '4',
    nombre: 'Instalaciones sanitarias',
    estado: 'Pendiente',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-25',
    x: 650,
    y: 180,
    width: 250,
    height: 40,
    dependencias: ['2'],
    color: '#F59E0B'
  },
  {
    id: '5',
    nombre: 'Mampostería y revoques',
    estado: 'Pendiente',
    fechaInicio: '2024-03-20',
    fechaFin: '2024-04-15',
    x: 950,
    y: 140,
    width: 250,
    height: 40,
    dependencias: ['3', '4'],
    color: '#F59E0B'
  }
];

interface GanttViewProps {
  onVolver: () => void;
  onGuardar: (tareas: TareaGantt[], conexiones: Conexion[]) => void;
}

export function GanttView({ onVolver, onGuardar }: GanttViewProps) {
  const [tareas, setTareas] = useState<TareaGantt[]>(tareasIniciales);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState<'seleccion' | 'conexion' | 'nueva'>('seleccion');

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return '#F59E0B';
      case 'En curso': return '#3B82F6';
      case 'Finalizada': return '#10B981';
      case 'Aprobada': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const handleTareaClick = (tareaId: string) => {
    setTareaSeleccionada(tareaId === tareaSeleccionada ? null : tareaId);
  };

  const handleNuevaTarea = () => {
    const nuevaTarea: TareaGantt = {
      id: `tarea-${Date.now()}`,
      nombre: 'Nueva tarea',
      estado: 'Pendiente',
      fechaInicio: '2024-01-01',
      fechaFin: '2024-01-07',
      x: 100,
      y: 100 + (tareas.length * 80),
      width: 150,
      height: 40,
      dependencias: [],
      color: getEstadoColor('Pendiente')
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
    onGuardar(tareas, conexiones);
  };

  return (
    <div className="max-w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onVolver}
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
            <button
              onClick={handleNuevaTarea}
              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva tarea
            </button>
            
            {tareaSeleccionada && (
              <button
                onClick={handleEliminarTarea}
                className="inline-flex items-center px-3 py-1.5 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vista del Gantt simplificada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Diagrama de Gantt</h3>
          <p className="text-sm text-gray-600">
            {tareaSeleccionada ? `Tarea seleccionada: ${tareas.find(t => t.id === tareaSeleccionada)?.nombre}` : 'Hacé clic en una tarea para seleccionarla'}
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                onClick={() => handleTareaClick(tarea.id)}
                className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  tareaSeleccionada === tarea.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: tareaSeleccionada === tarea.id ? '#DBEAFE' : '#F9FAFB',
                  borderColor: tareaSeleccionada === tarea.id ? '#3B82F6' : '#E5E7EB'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Estado: {tarea.estado}</span>
                      <span>Inicio: {tarea.fechaInicio}</span>
                      <span>Fin: {tarea.fechaFin}</span>
                    </div>
                  </div>
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getEstadoColor(tarea.estado) }}
                  ></div>
                </div>
                
                {/* Barra de progreso */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: getEstadoColor(tarea.estado),
                      width: tarea.estado === 'Finalizada' || tarea.estado === 'Aprobada' ? '100%' : '60%'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Instrucciones */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
            <div className="space-y-1">
              <div>• Hacé clic en una tarea para seleccionarla</div>
              <div>• Usá los botones de arriba para crear o eliminar tareas</div>
              <div>• Los colores representan el estado de cada tarea</div>
            </div>
          </div>
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
  );
}
