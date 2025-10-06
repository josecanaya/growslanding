'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Eye, DollarSign, Users, CheckCircle, Clock, User, MapPin, Play, Pause, CheckCircle2 } from 'lucide-react';

// Tipos de datos
interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  presupuesto?: number;
  dependencias?: string[];
}

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  responsable: string;
  fechaInicio: string;
  fechaFin?: string;
}

// Datos mock
const obraMock: Obra = {
  id: '1',
  nombre: 'Casa Residencial Norte',
  direccion: 'Av. Libertador 1234, CABA',
  estado: 'activa',
  responsable: 'Carlos Pérez',
  fechaInicio: '2024-01-15',
  fechaFin: '2024-06-30'
};

const tareasMock: Tarea[] = [
  {
    id: '1',
    nombre: 'Excavación y fundaciones',
    descripcion: 'Excavación de cimientos y colocación de fundaciones',
    estado: 'Finalizada',
    responsable: 'Carlos Pérez',
    fechaInicio: '2024-01-15',
    fechaFin: '2024-01-30',
    prioridad: 'Alta',
    presupuesto: 45000
  },
  {
    id: '2',
    nombre: 'Estructura de hormigón',
    descripcion: 'Construcción de estructura portante en hormigón armado',
    estado: 'En curso',
    responsable: 'María González',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-03-15',
    prioridad: 'Alta',
    presupuesto: 120000,
    dependencias: ['1']
  },
  {
    id: '3',
    nombre: 'Instalaciones eléctricas',
    descripcion: 'Instalación completa del sistema eléctrico',
    estado: 'Pendiente',
    responsable: 'Roberto Silva',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-20',
    prioridad: 'Media',
    presupuesto: 35000,
    dependencias: ['2']
  },
  {
    id: '4',
    nombre: 'Instalaciones sanitarias',
    descripcion: 'Instalación de plomería y sistemas sanitarios',
    estado: 'Pendiente',
    responsable: 'Ana Martínez',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-25',
    prioridad: 'Media',
    presupuesto: 28000,
    dependencias: ['2']
  },
  {
    id: '5',
    nombre: 'Mampostería y revoques',
    descripcion: 'Construcción de muros y aplicación de revoques',
    estado: 'Pendiente',
    responsable: 'Luis Rodríguez',
    fechaInicio: '2024-03-20',
    fechaFin: '2024-04-15',
    prioridad: 'Media',
    presupuesto: 55000,
    dependencias: ['3', '4']
  },
  {
    id: '6',
    nombre: 'Pintura y terminaciones',
    descripcion: 'Aplicación de pintura y terminaciones finales',
    estado: 'Pendiente',
    responsable: 'Elena Fernández',
    fechaInicio: '2024-04-20',
    fechaFin: '2024-05-15',
    prioridad: 'Baja',
    presupuesto: 25000,
    dependencias: ['5']
  }
];

interface TimelineViewProps {
  obraId: string;
  onVolver: () => void;
  onEditarGantt: () => void;
}

export function TimelineView({ obraId, onVolver, onEditarGantt }: TimelineViewProps) {
  const [obra] = useState<Obra>(obraMock);
  const [tareas] = useState<Tarea[]>(tareasMock);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => 
    filtroEstado === 'todos' || tarea.estado.toLowerCase().replace(' ', '_') === filtroEstado
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En curso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Finalizada': return 'bg-green-100 text-green-800 border-green-200';
      case 'Aprobada': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return <Clock className="h-4 w-4" />;
      case 'En curso': return <Play className="h-4 w-4" />;
      case 'Finalizada': return <CheckCircle2 className="h-4 w-4" />;
      case 'Aprobada': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getObraEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800 border-green-200';
      case 'pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getObraEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <Play className="h-4 w-4" />;
      case 'pausada': return <Pause className="h-4 w-4" />;
      case 'finalizada': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calcularProgreso = () => {
    const total = tareas.length;
    const completadas = tareas.filter(t => t.estado === 'Finalizada' || t.estado === 'Aprobada').length;
    return Math.round((completadas / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header fijo */}
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
              <h1 className="text-2xl font-bold text-gray-900">{obra.nombre}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{obra.direccion}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{obra.responsable}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getObraEstadoColor(obra.estado)}`}>
                  {getObraEstadoIcon(obra.estado)}
                  {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onEditarGantt}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Editar planificación (Gantt)
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Nueva tarea
            </button>
          </div>
        </div>

        {/* Progreso general */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso general</span>
            <span className="text-sm text-gray-600">{calcularProgreso()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calcularProgreso()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            {['todos', 'pendiente', 'en_curso', 'finalizada', 'aprobada'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filtroEstado === estado 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {estado === 'todos' ? 'Todos' : 
                 estado === 'en_curso' ? 'En curso' :
                 estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline de tareas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Cronología de tareas ({tareasFiltradas.length})
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {tareasFiltradas.map((tarea, index) => (
              <div key={tarea.id} className="relative">
                {/* Línea conectora */}
                {index < tareasFiltradas.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-6 bg-gray-200"></div>
                )}
                
                <div className="flex items-start gap-4">
                  {/* Indicador de estado */}
                  <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center ${getEstadoColor(tarea.estado)}`}>
                    {getEstadoIcon(tarea.estado)}
                  </div>

                  {/* Contenido de la tarea */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tarea.nombre}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(tarea.prioridad)}`}>
                            {tarea.prioridad}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{tarea.descripcion}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{tarea.responsable}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(tarea.fechaInicio).toLocaleDateString()} - {new Date(tarea.fechaFin).toLocaleDateString()}
                            </span>
                          </div>
                          {tarea.presupuesto && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${tarea.presupuesto.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {tarea.dependencias && tarea.dependencias.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-gray-500">Depende de: {tarea.dependencias.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </button>
                        <button className="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Presupuesto
                        </button>
                        <button className="inline-flex items-center px-3 py-1.5 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                          <Users className="h-4 w-4 mr-1" />
                          Asignar
                        </button>
                        {tarea.estado === 'Finalizada' && (
                          <button className="inline-flex items-center px-3 py-1.5 text-sm text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Validar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tareasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tareas que coincidan con el filtro</h3>
              <p className="text-gray-600">Intenta cambiar el filtro de estado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
