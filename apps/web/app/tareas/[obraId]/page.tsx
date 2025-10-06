'use client';

import { useState } from 'react';
import { ArrowLeft, Calendar, Plus, TrendingUp, CheckCircle, Clock, AlertCircle, User, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EtapasTimeline } from '@/components/EtapasTimeline';

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number;
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
const obraMock: Obra = {
  id: '1',
  nombre: 'Casa Residencial Norte',
  direccion: 'Av. Libertador 1234, CABA',
  cliente: 'Familia Rodríguez',
  estado: 'activa',
  avance: 65,
  fechaInicio: '2024-01-15',
  responsable: 'Carlos Pérez'
};

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
  },
  {
    id: '4',
    nombre: 'Mampostería y revoques',
    descripcion: 'Construcción de muros y aplicación de revoques',
    estado: 'Pendiente',
    responsable: 'Luis Rodríguez',
    etapa: 'Obra gris',
    fechaInicio: '2024-03-20',
    fechaFin: '2024-04-15',
    prioridad: 'Media',
    presupuesto: 55000
  },
  {
    id: '5',
    nombre: 'Pintura y terminaciones',
    descripcion: 'Aplicación de pintura y terminaciones finales',
    estado: 'Pendiente',
    responsable: 'Elena Fernández',
    etapa: 'Terminaciones',
    fechaInicio: '2024-04-20',
    fechaFin: '2024-05-15',
    prioridad: 'Baja',
    presupuesto: 25000
  }
];

interface HeaderObraProps {
  obra: Obra;
  onVolver: () => void;
  onEditarPlanificacion: () => void;
  onNuevaTarea: () => void;
}

function HeaderObra({ obra, onVolver, onEditarPlanificacion, onNuevaTarea }: HeaderObraProps) {
  return (
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
                <span>{obra.cliente}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditarPlanificacion}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Editar planificación (Gantt)
          </button>
          <button
            onClick={onNuevaTarea}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva tarea
          </button>
        </div>
      </div>

      {/* Progreso general */}
      <div className="mt-4">
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
      </div>
    </div>
  );
}

interface EstadisticasTareasProps {
  tareas: Tarea[];
}

function EstadisticasTareas({ tareas }: EstadisticasTareasProps) {
  const estadisticas = {
    total: tareas.length,
    completadas: tareas.filter(t => t.estado === 'Finalizada' || t.estado === 'Aprobada').length,
    enProgreso: tareas.filter(t => t.estado === 'En curso').length,
    pendientes: tareas.filter(t => t.estado === 'Pendiente').length
  };

  const progresoPorEtapa = {
    'Estructura': tareas.filter(t => t.etapa === 'Estructura').length,
    'Obra gris': tareas.filter(t => t.etapa === 'Obra gris').length,
    'Instalaciones': tareas.filter(t => t.etapa === 'Instalaciones').length,
    'Terminaciones': tareas.filter(t => t.etapa === 'Terminaciones').length
  };

  return (
    <div className="space-y-6">
      {/* Cards de conteo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.completadas}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En progreso</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.enProgreso}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progreso por etapas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso por etapas</h3>
        <div className="space-y-4">
          {Object.entries(progresoPorEtapa).map(([etapa, cantidad]) => (
            <div key={etapa} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{etapa}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(cantidad / estadisticas.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">{cantidad}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TareasRecientesProps {
  tareas: Tarea[];
}

function TareasRecientes({ tareas }: TareasRecientesProps) {
  const tareasRecientes = tareas.slice(0, 3);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'En curso': return 'bg-blue-100 text-blue-800';
      case 'Finalizada': return 'bg-green-100 text-green-800';
      case 'Aprobada': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas recientes</h3>
      <div className="space-y-3">
        {tareasRecientes.map(tarea => (
          <div key={tarea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{tarea.nombre}</h4>
              <p className="text-sm text-gray-600">{tarea.etapa}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
              {tarea.estado}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TareasListProps {
  tareas: Tarea[];
  filtroEstado: string;
  onFiltroChange: (filtro: string) => void;
}

function TareasList({ tareas, filtroEstado, onFiltroChange }: TareasListProps) {
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

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Estructura': return 'bg-red-100 text-red-800';
      case 'Obra gris': return 'bg-gray-100 text-gray-800';
      case 'Instalaciones': return 'bg-blue-100 text-blue-800';
      case 'Terminaciones': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            {['todos', 'pendiente', 'en_curso', 'finalizada', 'aprobada'].map(estado => (
              <button
                key={estado}
                onClick={() => onFiltroChange(estado)}
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

      {/* Lista de tareas */}
      <div className="space-y-4">
        {tareasFiltradas.map((tarea, index) => (
          <div key={tarea.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{tarea.nombre}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
                    {tarea.estado}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEtapaColor(tarea.etapa)}`}>
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
                      <TrendingUp className="h-4 w-4" />
                      <span>${tarea.presupuesto.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Ver
                </button>
                <button className="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  Presupuesto
                </button>
                <button className="inline-flex items-center px-3 py-1.5 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                  Asignar
                </button>
                {tarea.estado === 'Finalizada' && (
                  <button className="inline-flex items-center px-3 py-1.5 text-sm text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                    Validar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tareasFiltradas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tareas que coincidan con el filtro</h3>
          <p className="text-gray-600">Intenta cambiar el filtro de estado</p>
        </div>
      )}
    </div>
  );
}

interface TareasDetailPageProps {
  params: {
    obraId: string;
  };
}

// Función para convertir tareas al formato del EtapasTimeline
const convertirTareasParaTimeline = (tareas: Tarea[], obraId: string) => {
  return tareas.map(tarea => ({
    id: tarea.id,
    nombre: tarea.nombre,
    obraId: obraId,
    lider: tarea.responsable,
    fechaInicio: tarea.fechaInicio,
    fechaFin: tarea.fechaFin,
    plantilla: tarea.id, // Usar el ID como plantilla por ahora
    checklist: [], // No disponible en el formato actual
    evidencias: [], // No disponible en el formato actual
    estado: tarea.estado === 'Finalizada' ? 'completada' : 
            tarea.estado === 'En curso' ? 'en_progreso' : 
            tarea.estado === 'Aprobada' ? 'completada' : 'pendiente',
    etapa: tarea.etapa === 'Estructura' ? 'estructura' :
           tarea.etapa === 'Obra gris' ? 'obra_gris' :
           tarea.etapa === 'Terminaciones' ? 'terminaciones' : 'obra_gris',
    precedencia: [], // No disponible en el formato actual
    duracion: Math.ceil((new Date(tarea.fechaFin).getTime() - new Date(tarea.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)),
    esCritica: tarea.prioridad === 'Alta',
    tiempoTemprano: 0, // No disponible en el formato actual
    tiempoTardio: 0 // No disponible en el formato actual
  }));
};

export default function TareasDetailPage({ params }: TareasDetailPageProps) {
  const router = useRouter();
  const [obra] = useState<Obra>(obraMock);
  const [tareas] = useState<Tarea[]>(tareasMock);
  const [tabActivo, setTabActivo] = useState<'resumen' | 'tareas'>('resumen');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const handleVolver = () => {
    router.push('/tareas');
  };

  const handleEditarPlanificacion = () => {
    router.push(`/tareas/${params.obraId}/editor`);
  };

  const handleNuevaTarea = () => {
    console.log('Abrir modal de nueva tarea');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <HeaderObra
          obra={obra}
          onVolver={handleVolver}
          onEditarPlanificacion={handleEditarPlanificacion}
          onNuevaTarea={handleNuevaTarea}
        />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'resumen', label: 'Resumen' },
                { id: 'tareas', label: 'Tareas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id as 'resumen' | 'tareas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tabActivo === tab.id
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
            {tabActivo === 'resumen' ? (
              <div className="space-y-6">
                <EstadisticasTareas tareas={tareas} />
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Etapas</h3>
                  <EtapasTimeline 
                    tareas={convertirTareasParaTimeline(tareas, params.obraId)}
                    obraId={params.obraId}
                  />
                </div>
                <TareasRecientes tareas={tareas} />
              </div>
            ) : (
              <TareasList
                tareas={tareas}
                filtroEstado={filtroEstado}
                onFiltroChange={setFiltroEstado}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
