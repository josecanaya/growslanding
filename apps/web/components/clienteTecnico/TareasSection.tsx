'use client';

import { useState } from 'react';
import { Building2, TrendingUp, Clock, MapPin, User, ArrowRight, Calendar, Plus, Eye, DollarSign, Users, CheckCircle, AlertCircle, Wrench, Paintbrush } from 'lucide-react';

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number;
  tareasTotal: number;
  tareasCompletadas: number;
  fechaInicio: string;
  responsable: string;
}

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  responsable: string;
  etapa: 'Estructura' | 'Obra gris' | 'Terminaciones' | 'Instalaciones';
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  presupuesto?: number;
}

// Datos mock
const obrasMock: Obra[] = [
  {
    id: '1',
    nombre: 'Casa Residencial Norte',
    direccion: 'Av. Libertador 1234, CABA',
    cliente: 'Familia Rodríguez',
    estado: 'activa',
    avance: 65,
    tareasTotal: 12,
    tareasCompletadas: 8,
    fechaInicio: '2024-01-15',
    responsable: 'Carlos Pérez'
  },
  {
    id: '2',
    nombre: 'Edificio Comercial Centro',
    direccion: 'Corrientes 2500, CABA',
    cliente: 'Inmobiliaria Sur',
    estado: 'activa',
    avance: 30,
    tareasTotal: 18,
    tareasCompletadas: 5,
    fechaInicio: '2024-02-01',
    responsable: 'María González'
  },
  {
    id: '3',
    nombre: 'Villa Familiar Sur',
    direccion: 'Ruta 2 Km 45, Buenos Aires',
    cliente: 'Constructora Norte',
    estado: 'pausada',
    avance: 45,
    tareasTotal: 10,
    tareasCompletadas: 4,
    fechaInicio: '2023-11-01',
    responsable: 'Roberto Silva'
  }
];

const tareasMock: Tarea[] = [
  {
    id: '1',
    nombre: 'Excavación y fundaciones',
    descripcion: 'Excavación de cimientos y colocación de fundaciones',
    estado: 'Finalizada',
    responsable: 'Carlos Pérez',
    etapa: 'Estructura',
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
    etapa: 'Estructura',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-03-15',
    prioridad: 'Alta',
    presupuesto: 120000
  },
  {
    id: '3',
    nombre: 'Instalaciones eléctricas',
    descripcion: 'Instalación completa del sistema eléctrico',
    estado: 'Pendiente',
    responsable: 'Roberto Silva',
    etapa: 'Instalaciones',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-20',
    prioridad: 'Media',
    presupuesto: 35000
  }
];

interface ObraResumenCardProps {
  obra: Obra;
  onVerPlanificacion: (obraId: string) => void;
}

function ObraResumenCard({ obra, onVerPlanificacion }: ObraResumenCardProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800 border-green-200';
      case 'pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <TrendingUp className="h-4 w-4" />;
      case 'pausada': return <Clock className="h-4 w-4" />;
      case 'finalizada': return <Building2 className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{obra.nombre}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{obra.direccion}</span>
              </div>
            </div>
          </div>
          
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(obra.estado)}`}>
            {getEstadoIcon(obra.estado)}
            {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
          </span>
        </div>

        {/* Información del cliente */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span className="font-medium">Cliente:</span>
            <span>{obra.cliente}</span>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso general</span>
            <span className="text-sm text-gray-600">{obra.avance}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${obra.avance}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onVerPlanificacion(obra.id)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span>Ver planificación</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type VistaTareas = 'lista-obras' | 'detalle-obra' | 'editor-gantt';
type TabPrincipal = 'resumen' | 'elementos' | 'tareas' | 'legajo';
type ModoTareas = 'lista' | 'timeline' | 'editor-visual';

export function TareasSection() {
  const [vistaActual, setVistaActual] = useState<VistaTareas>('lista-obras');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('resumen');
  const [modoTareas, setModoTareas] = useState<ModoTareas>('lista');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  
  const [obras] = useState<Obra[]>(obrasMock);
  const [tareas] = useState<Tarea[]>(tareasMock);

  // Filtrar solo obras activas
  const obrasActivas = obras.filter(obra => obra.estado === 'activa');

  const handleVerPlanificacion = (obraId: string) => {
    setObraSeleccionada(obraId);
    setVistaActual('detalle-obra');
  };

  const handleVolverALista = () => {
    setVistaActual('lista-obras');
    setObraSeleccionada('');
  };

  const handleEditarGantt = () => {
    setVistaActual('editor-gantt');
  };

  const handleVolverADetalle = () => {
    setVistaActual('detalle-obra');
  };

  const obraActual = obras.find(o => o.id === obraSeleccionada);

  // Renderizar vista según el estado actual
  switch (vistaActual) {
    case 'detalle-obra':
      return (
        <div className="space-y-6">
          {/* Header principal como en Obras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverALista}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{obraActual?.nombre}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Cliente: {obraActual?.cliente}</span>
                    <span>Tipo: Nueva</span>
                    <span>Inicio: {new Date(obraActual?.fechaInicio || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Progreso General</div>
                  <div className="text-lg font-bold text-gray-900">{obraActual?.avance}%</div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${obraActual?.avance || 0}%` }}
                  ></div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs principales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'resumen', label: 'Resumen' },
                  { id: 'elementos', label: 'Elementos' },
                  { id: 'tareas', label: 'Tareas' },
                  { id: 'legajo', label: 'Legajo' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTabPrincipal(tab.id as TabPrincipal)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      tabPrincipal === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {tabPrincipal === 'resumen' && (
                <div className="space-y-6">
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{tareas.length}</p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completadas</p>
                          <p className="text-2xl font-bold text-green-600">
                            {tareas.filter(t => t.estado === 'Finalizada' || t.estado === 'Aprobada').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">En progreso</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {tareas.filter(t => t.estado === 'En curso').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {tareas.filter(t => t.estado === 'Pendiente').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIMELINE DE ETAPAS - NUEVO */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Timeline de Etapas de Construcción</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* ESTRUCTURA */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-blue-500 text-white rounded-lg">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-blue-800">Estructura</h4>
                            <p className="text-sm text-gray-600">Fundaciones, columnas, vigas</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-bold text-blue-800">
                              {Math.round((tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Estructura').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Estructura').length, 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{tareas.filter(t => t.etapa === 'Estructura').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>

                      {/* OBRA GRIS */}
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-gray-500 text-white rounded-lg">
                            <Wrench className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">Obra Gris</h4>
                            <p className="text-sm text-gray-600">Mampostería, instalaciones</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-bold text-gray-800">
                              {Math.round((tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Obra gris').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-500 h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Obra gris').length, 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{tareas.filter(t => t.etapa === 'Obra gris').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>

                      {/* TERMINACIONES */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-green-500 text-white rounded-lg">
                            <Paintbrush className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-green-800">Terminaciones</h4>
                            <p className="text-sm text-gray-600">Revoques, pintura, acabados</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-bold text-green-800">
                              {Math.round((tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Terminaciones').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Terminaciones').length, 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{tareas.filter(t => t.etapa === 'Terminaciones').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tareas recientes */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas recientes</h3>
                    <div className="space-y-3">
                      {tareas.slice(0, 3).map(tarea => (
                        <div key={tarea.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tarea.nombre}</h4>
                            <p className="text-sm text-gray-600">{tarea.etapa}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tarea.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            tarea.estado === 'En curso' ? 'bg-blue-100 text-blue-800' :
                            tarea.estado === 'Finalizada' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {tarea.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tabPrincipal === 'tareas' && (
                <div className="space-y-6">
                  {/* Header de Gestión de Tareas */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Gestión de Tareas</h2>
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                      {[
                        { id: 'lista', label: 'Lista' },
                        { id: 'timeline', label: 'Timeline' },
                        { id: 'editor-visual', label: 'Editor Visual' }
                      ].map(modo => (
                        <button
                          key={modo.id}
                          onClick={() => setModoTareas(modo.id as ModoTareas)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            modoTareas === modo.id
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {modo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contenido según el modo seleccionado */}
                  {modoTareas === 'lista' && (
                    <div className="space-y-4">
                      {/* Filtros */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
                          <div className="flex gap-2 bg-white rounded-lg p-1">
                            {['todos', 'pendiente', 'en_curso', 'finalizada', 'aprobada'].map(estado => (
                              <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  filtroEstado === estado 
                                    ? 'bg-blue-600 text-white' 
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

                      {/* Lista de tareas */}
                      <div className="space-y-4">
                        {tareas.filter(tarea => 
                          filtroEstado === 'todos' || tarea.estado.toLowerCase().replace(' ', '_') === filtroEstado
                        ).map(tarea => (
                          <div key={tarea.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{tarea.nombre}</h3>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    tarea.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                    tarea.estado === 'En curso' ? 'bg-blue-100 text-blue-800' :
                                    tarea.estado === 'Finalizada' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {tarea.estado}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    tarea.etapa === 'Estructura' ? 'bg-red-100 text-red-800' :
                                    tarea.etapa === 'Obra gris' ? 'bg-gray-100 text-gray-800' :
                                    tarea.etapa === 'Instalaciones' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {tarea.etapa}
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
                              </div>

                              {/* Acciones */}
                              <div className="flex flex-wrap gap-2">
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </button>
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Presupuesto
                                </button>
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                  <Users className="h-4 w-4 mr-1" />
                                  Asignar
                                </button>
                                {tarea.estado === 'Finalizada' && (
                                  <button className="inline-flex items-center px-3 py-1.5 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Validar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modoTareas === 'timeline' && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Tareas</h3>
                      <div className="space-y-4">
                        {tareas.map((tarea, index) => (
                          <div key={tarea.id} className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                tarea.estado === 'Finalizada' ? 'bg-green-500' :
                                tarea.estado === 'En curso' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}></div>
                              {index < tareas.length - 1 && <div className="w-px h-8 bg-gray-300 mt-2"></div>}
                            </div>
                            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{tarea.nombre}</h4>
                                  <p className="text-sm text-gray-600">{tarea.etapa}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  tarea.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                  tarea.estado === 'En curso' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {tarea.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modoTareas === 'editor-visual' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Panel lateral */}
                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Visual</h3>
                          
                          {/* Resumen rápido */}
                          <div className="space-y-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">5d</div>
                                <div className="text-sm text-gray-600">Tiempo Total</div>
                              </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{tareas.length}</div>
                                <div className="text-sm text-gray-600">Tareas</div>
                              </div>
                            </div>
                          </div>

                          {/* Controles de zoom */}
                          <div className="space-y-4 mb-6">
                            <h4 className="font-medium text-gray-900">Zoom</h4>
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                              <span className="text-sm text-gray-600 min-w-[3rem] text-center">100%</span>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Lista de tareas */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Lista de tareas</h4>
                            <div className="space-y-2">
                              {tareas.map(tarea => (
                                <div key={tarea.id} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                  <div className="text-sm font-medium text-gray-900">{tarea.nombre}</div>
                                  <div className="text-xs text-gray-600">5d • {tarea.estado}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Canvas del editor */}
                      <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Canvas del Editor</h3>
                            <div className="flex gap-2">
                              <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="h-4 w-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                              <span className="text-sm text-gray-600">100%</span>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Canvas visual */}
                          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 min-h-[400px] relative">
                            {tareas.map((tarea, index) => (
                              <div
                                key={tarea.id}
                                className="absolute bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                style={{
                                  left: `${50 + index * 20}px`,
                                  top: `${50 + index * 30}px`,
                                  width: '200px'
                                }}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                </div>
                                <div className="text-sm font-medium text-gray-900 mb-1">{tarea.nombre}</div>
                                <div className="text-xs text-gray-600">5 días</div>
                                <div className="text-xs text-gray-600">{tarea.responsable}</div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tabPrincipal === 'elementos' && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Elementos</h3>
                  <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                </div>
              )}

              {tabPrincipal === 'legajo' && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Legajo</h3>
                  <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'editor-gantt':
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverADetalle}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Editor de Planificación (Gantt)</h1>
                  <p className="text-gray-600 mt-1">Arrastrá y conectá las tareas para crear el cronograma</p>
                </div>
              </div>
              
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Editor simplificado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Visual</h3>
            
            <div className="space-y-4">
              {tareas.map((tarea, index) => (
                <div
                  key={tarea.id}
                  className="relative p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Responsable: {tarea.responsable}</span>
                        <span>Etapa: {tarea.etapa}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${
                        tarea.estado === 'Pendiente' ? 'bg-yellow-500' :
                        tarea.estado === 'En curso' ? 'bg-blue-500' :
                        tarea.estado === 'Finalizada' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}></div>
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
                        className={`h-3 rounded-full transition-all duration-300 ${
                          tarea.estado === 'Pendiente' ? 'bg-yellow-500' :
                          tarea.estado === 'En curso' ? 'bg-blue-500' :
                          tarea.estado === 'Finalizada' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}
                        style={{ 
                          width: tarea.estado === 'Finalizada' || tarea.estado === 'Aprobada' ? '100%' : '60%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default: // 'lista-obras'
      return (
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
                <p className="text-gray-600 mt-1">Seleccioná una obra para ver su progreso y planificación</p>
              </div>
            </div>
          </div>

          {/* Grid de obras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {obrasActivas.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay obras activas disponibles</h3>
                <p className="text-gray-600">Todas las obras están pausadas o finalizadas</p>
              </div>
            ) : (
              obrasActivas.map(obra => (
                <ObraResumenCard
                  key={obra.id}
                  obra={obra}
                  onVerPlanificacion={handleVerPlanificacion}
                />
              ))
            )}
          </div>

          {/* Estadísticas generales */}
          {obrasActivas.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen general</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{obrasActivas.length}</div>
                  <div className="text-sm text-gray-600">Obras activas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(obrasActivas.reduce((acc, obra) => acc + obra.avance, 0) / obrasActivas.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Progreso promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {obrasActivas.reduce((acc, obra) => acc + obra.tareasTotal, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total de tareas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
  }
}
