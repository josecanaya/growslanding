'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, UserCheck, FileText, MapPin, Calendar, MoreVertical, Edit3, Trash2, Eye } from 'lucide-react';

// Interfaces para los datos mock
interface Integrante {
  id: string;
  nombre: string;
  rol: string;
  telefono?: string;
}

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  url?: string;
}

interface Cuadrilla {
  id: string;
  nombre: string;
  encargado: string;
  especialidad: string;
  integrantes: Integrante[];
  documentos: Documento[];
  tareasAsignadas: number;
  tareasCompletadas: number;
  estado: 'activa' | 'inactiva' | 'ocupada';
  fechaCreacion: string;
}

interface Obra {
  id: string;
  nombre: string;
  estado: string;
}

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  etapa: string;
  estado: string;
}

export default function CuadrillasSection() {
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState<Cuadrilla | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);

  // Datos mock iniciales
  useEffect(() => {
    // Mock de cuadrillas
    const cuadrillasMock: Cuadrilla[] = [
      {
        id: '1',
        nombre: 'Cuadrilla Albañilería Norte',
        encargado: 'Carlos Mendoza',
        especialidad: 'Albañilería',
        integrantes: [
          { id: '1', nombre: 'Carlos Mendoza', rol: 'Encargado', telefono: '+54 11 1234-5678' },
          { id: '2', nombre: 'Roberto Silva', rol: 'Albañil', telefono: '+54 11 2345-6789' },
          { id: '3', nombre: 'Miguel Torres', rol: 'Ayudante', telefono: '+54 11 3456-7890' }
        ],
        documentos: [
          { id: '1', nombre: 'Seguro de Accidentes', tipo: 'Seguro', fecha: '2024-01-15' },
          { id: '2', nombre: 'Certificado ART', tipo: 'Certificado', fecha: '2024-01-10' }
        ],
        tareasAsignadas: 8,
        tareasCompletadas: 6,
        estado: 'activa',
        fechaCreacion: '2024-01-01'
      },
      {
        id: '2',
        nombre: 'Cuadrilla Yesería Sur',
        encargado: 'Ana García',
        especialidad: 'Yesería',
        integrantes: [
          { id: '1', nombre: 'Ana García', rol: 'Encargada', telefono: '+54 11 4567-8901' },
          { id: '2', nombre: 'Luis Fernández', rol: 'Yesero', telefono: '+54 11 5678-9012' }
        ],
        documentos: [
          { id: '1', nombre: 'Seguro de Accidentes', tipo: 'Seguro', fecha: '2024-01-20' },
          { id: '2', nombre: 'Certificado de Salud', tipo: 'Certificado', fecha: '2024-01-18' }
        ],
        tareasAsignadas: 5,
        tareasCompletadas: 5,
        estado: 'activa',
        fechaCreacion: '2024-01-15'
      },
      {
        id: '3',
        nombre: 'Cuadrilla Carpintería Centro',
        encargado: 'Diego López',
        especialidad: 'Carpintería',
        integrantes: [
          { id: '1', nombre: 'Diego López', rol: 'Encargado', telefono: '+54 11 6789-0123' },
          { id: '2', nombre: 'Pedro Martínez', rol: 'Carpintero', telefono: '+54 11 7890-1234' },
          { id: '3', nombre: 'Sergio Ruiz', rol: 'Ayudante', telefono: '+54 11 8901-2345' }
        ],
        documentos: [
          { id: '1', nombre: 'Seguro de Accidentes', tipo: 'Seguro', fecha: '2024-01-25' }
        ],
        tareasAsignadas: 3,
        tareasCompletadas: 1,
        estado: 'ocupada',
        fechaCreacion: '2024-01-20'
      }
    ];

    // Mock de obras
    const obrasMock: Obra[] = [
      { id: '1', nombre: 'Casa Familiar Los Robles', estado: 'ACTIVA' },
      { id: '2', nombre: 'Edificio Residencial Norte', estado: 'ACTIVA' },
      { id: '3', nombre: 'Ampliación Comercial Centro', estado: 'ACTIVA' }
    ];

    // Mock de tareas
    const tareasMock: Tarea[] = [
      { id: '1', nombre: 'Excavación de fundación', obraId: '1', etapa: 'Fundación', estado: 'PENDIENTE' },
      { id: '2', nombre: 'Hormigón de fundación', obraId: '1', etapa: 'Fundación', estado: 'PENDIENTE' },
      { id: '3', nombre: 'Muros exteriores', obraId: '1', etapa: 'Estructura', estado: 'EN_PROGRESO' },
      { id: '4', nombre: 'Revoque grueso', obraId: '2', etapa: 'Terminaciones', estado: 'PENDIENTE' },
      { id: '5', nombre: 'Instalación de puertas', obraId: '2', etapa: 'Terminaciones', estado: 'PENDIENTE' }
    ];

    setCuadrillas(cuadrillasMock);
    setObras(obrasMock);
    setTareas(tareasMock);
  }, []);

  const getEstadoBadge = (estado: string) => {
    const estados = {
      'activa': 'bg-green-100 text-green-800',
      'inactiva': 'bg-gray-100 text-gray-800',
      'ocupada': 'bg-yellow-100 text-yellow-800'
    };
    return estados[estado as keyof typeof estados] || 'bg-gray-100 text-gray-800';
  };

  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería': '🧱',
      'Yesería': '🎨',
      'Carpintería': '🔨',
      'Electricidad': '⚡',
      'Plomería': '🔧'
    };
    return iconos[especialidad as keyof typeof iconos] || '👷‍♂️';
  };

  const handleVerDetalle = (cuadrilla: Cuadrilla) => {
    setCuadrillaSeleccionada(cuadrilla);
    setShowModalDetalle(true);
  };

  const handleAsignarTarea = (cuadrilla: Cuadrilla) => {
    setCuadrillaSeleccionada(cuadrilla);
    setShowModalAsignacion(true);
  };

  const calcularPorcentajeCompletado = (asignadas: number, completadas: number) => {
    if (asignadas === 0) return 0;
    return Math.round((completadas / asignadas) * 100);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuadrillas</h1>
          <p className="text-gray-600 mt-2">Administra cuadrillas, integrantes y asignaciones de tareas</p>
        </div>
        <button
          onClick={() => setShowModalNueva(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Cuadrilla</span>
        </button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cuadrillas</p>
              <p className="text-2xl font-bold text-gray-900">{cuadrillas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Integrantes Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {cuadrillas.reduce((total, cuadrilla) => total + cuadrilla.integrantes.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tareas Asignadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {cuadrillas.reduce((total, cuadrilla) => total + cuadrilla.tareasAsignadas, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio Cumplimiento</p>
              <p className="text-2xl font-bold text-gray-900">
                {cuadrillas.length > 0 
                  ? Math.round(cuadrillas.reduce((total, cuadrilla) => 
                      total + calcularPorcentajeCompletado(cuadrilla.tareasAsignadas, cuadrilla.tareasCompletadas), 0) / cuadrillas.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cuadrillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuadrillas.map((cuadrilla) => (
          <div key={cuadrilla.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              {/* Header de la card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getEspecialidadIcon(cuadrilla.especialidad)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cuadrilla.nombre}</h3>
                    <p className="text-sm text-gray-600">Encargado: {cuadrilla.encargado}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cuadrilla.estado)}`}>
                    {cuadrilla.estado}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Información de la cuadrilla */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Especialidad:</span>
                  <span className="ml-2">{cuadrilla.especialidad}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{cuadrilla.integrantes.length} integrantes</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>{cuadrilla.documentos.length} documentos</span>
                </div>
              </div>

              {/* Estadísticas de tareas */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso de Tareas</span>
                  <span className="text-sm text-gray-600">
                    {cuadrilla.tareasCompletadas}/{cuadrilla.tareasAsignadas}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${calcularPorcentajeCompletado(cuadrilla.tareasAsignadas, cuadrilla.tareasCompletadas)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {calcularPorcentajeCompletado(cuadrilla.tareasAsignadas, cuadrilla.tareasCompletadas)}% completado
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVerDetalle(cuadrilla)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver más</span>
                </button>
                <button
                  onClick={() => handleAsignarTarea(cuadrilla)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Asignar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Cuadrilla */}
      {showModalNueva && (
        <ModalNuevaCuadrilla
          onClose={() => setShowModalNueva(false)}
          onGuardar={(nuevaCuadrilla) => {
            setCuadrillas(prev => [...prev, nuevaCuadrilla]);
            setShowModalNueva(false);
          }}
        />
      )}

      {/* Modal Detalle de Cuadrilla */}
      {showModalDetalle && cuadrillaSeleccionada && (
        <ModalDetalleCuadrilla
          cuadrilla={cuadrillaSeleccionada}
          onClose={() => setShowModalDetalle(false)}
          onAsignarTarea={() => {
            setShowModalDetalle(false);
            setShowModalAsignacion(true);
          }}
        />
      )}

      {/* Modal Asignación de Tareas */}
      {showModalAsignacion && cuadrillaSeleccionada && (
        <ModalAsignacionTareas
          cuadrilla={cuadrillaSeleccionada}
          obras={obras}
          tareas={tareas}
          onClose={() => setShowModalAsignacion(false)}
          onAsignar={(tareaId) => {
            // Mock de asignación
            setCuadrillas(prev => prev.map(c => 
              c.id === cuadrillaSeleccionada.id 
                ? { ...c, tareasAsignadas: c.tareasAsignadas + 1 }
                : c
            ));
            setShowModalAsignacion(false);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal Nueva Cuadrilla
function ModalNuevaCuadrilla({ onClose, onGuardar }: { onClose: () => void; onGuardar: (cuadrilla: Cuadrilla) => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    encargado: '',
    especialidad: ''
  });
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [nuevoIntegrante, setNuevoIntegrante] = useState({ nombre: '', rol: '', telefono: '' });

  const especialidades = ['Albañilería', 'Yesería', 'Carpintería', 'Electricidad', 'Plomería'];

  const handleAgregarIntegrante = () => {
    if (nuevoIntegrante.nombre && nuevoIntegrante.rol) {
      const integrante: Integrante = {
        id: Date.now().toString(),
        nombre: nuevoIntegrante.nombre,
        rol: nuevoIntegrante.rol,
        telefono: nuevoIntegrante.telefono
      };
      setIntegrantes(prev => [...prev, integrante]);
      setNuevoIntegrante({ nombre: '', rol: '', telefono: '' });
    }
  };

  const handleEliminarIntegrante = (id: string) => {
    setIntegrantes(prev => prev.filter(i => i.id !== id));
  };

  const handleGuardar = () => {
    if (formData.nombre && formData.encargado && formData.especialidad) {
      const nuevaCuadrilla: Cuadrilla = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        encargado: formData.encargado,
        especialidad: formData.especialidad,
        integrantes,
        documentos: [],
        tareasAsignadas: 0,
        tareasCompletadas: 0,
        estado: 'activa',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      onGuardar(nuevaCuadrilla);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Nueva Cuadrilla</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Cuadrilla</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Cuadrilla Albañilería Norte"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Encargado</label>
              <input
                type="text"
                value={formData.encargado}
                onChange={(e) => setFormData(prev => ({ ...prev, encargado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Carlos Mendoza"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una especialidad</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          {/* Integrantes */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Integrantes</h4>
            
            {/* Formulario para agregar integrante */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nuevoIntegrante.nombre}
                    onChange={(e) => setNuevoIntegrante(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <input
                    type="text"
                    value={nuevoIntegrante.rol}
                    onChange={(e) => setNuevoIntegrante(prev => ({ ...prev, rol: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Albañil, Ayudante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={nuevoIntegrante.telefono}
                    onChange={(e) => setNuevoIntegrante(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <button
                onClick={handleAgregarIntegrante}
                className="mt-3 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Integrante</span>
              </button>
            </div>

            {/* Lista de integrantes */}
            {integrantes.length > 0 && (
              <div className="space-y-2">
                {integrantes.map((integrante) => (
                  <div key={integrante.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div>
                      <span className="font-medium text-gray-900">{integrante.nombre}</span>
                      <span className="text-gray-600 ml-2">- {integrante.rol}</span>
                      {integrante.telefono && (
                        <span className="text-gray-500 ml-2">({integrante.telefono})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEliminarIntegrante(integrante.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Crear Cuadrilla
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Detalle de Cuadrilla
function ModalDetalleCuadrilla({ cuadrilla, onClose, onAsignarTarea }: { 
  cuadrilla: Cuadrilla; 
  onClose: () => void; 
  onAsignarTarea: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{cuadrilla.nombre}</h3>
            <p className="text-sm text-gray-600">Encargado: {cuadrilla.encargado}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integrantes */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Integrantes ({cuadrilla.integrantes.length})</h4>
              <div className="space-y-3">
                {cuadrilla.integrantes.map((integrante) => (
                  <div key={integrante.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{integrante.nombre}</span>
                        <span className="text-gray-600 ml-2">- {integrante.rol}</span>
                      </div>
                    </div>
                    {integrante.telefono && (
                      <p className="text-sm text-gray-500 mt-1">{integrante.telefono}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Documentos */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Documentos ({cuadrilla.documentos.length})</h4>
              <div className="space-y-3">
                {cuadrilla.documentos.map((documento) => (
                  <div key={documento.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{documento.nombre}</span>
                        <span className="text-gray-600 ml-2">- {documento.tipo}</span>
                      </div>
                      <span className="text-sm text-gray-500">{documento.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Plus className="h-4 w-4" />
                <span>Agregar Documento</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{cuadrilla.tareasAsignadas}</p>
                <p className="text-sm text-gray-600">Tareas Asignadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{cuadrilla.tareasCompletadas}</p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {cuadrilla.tareasAsignadas > 0 
                    ? Math.round((cuadrilla.tareasCompletadas / cuadrilla.tareasAsignadas) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600">Cumplimiento</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cerrar
          </button>
          <button
            onClick={onAsignarTarea}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Asignar Tarea
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Asignación de Tareas
function ModalAsignacionTareas({ cuadrilla, obras, tareas, onClose, onAsignar }: {
  cuadrilla: Cuadrilla;
  obras: Obra[];
  tareas: Tarea[];
  onClose: () => void;
  onAsignar: (tareaId: string) => void;
}) {
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string>('');

  const tareasFiltradas = obraSeleccionada 
    ? tareas.filter(t => t.obraId === obraSeleccionada)
    : tareas;

  const obraSeleccionadaData = obras.find(o => o.id === obraSeleccionada);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Asignar Tarea</h3>
            <p className="text-sm text-gray-600">Cuadrilla: {cuadrilla.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selección de Obra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Obra</label>
            <select
              value={obraSeleccionada}
              onChange={(e) => {
                setObraSeleccionada(e.target.value);
                setTareaSeleccionada('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una obra</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>{obra.nombre}</option>
              ))}
            </select>
          </div>

          {/* Selección de Tarea */}
          {obraSeleccionada && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Tarea</label>
              <select
                value={tareaSeleccionada}
                onChange={(e) => setTareaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una tarea</option>
                {tareasFiltradas.map(tarea => (
                  <option key={tarea.id} value={tarea.id}>{tarea.nombre} - {tarea.etapa}</option>
                ))}
              </select>
            </div>
          )}

          {/* Información de la tarea seleccionada */}
          {tareaSeleccionada && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Información de la Tarea</h4>
              {(() => {
                const tarea = tareasFiltradas.find(t => t.id === tareaSeleccionada);
                return tarea ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Obra:</span>
                      <span className="font-medium">{obraSeleccionadaData?.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarea:</span>
                      <span className="font-medium">{tarea.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Etapa:</span>
                      <span className="font-medium">{tarea.etapa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`font-medium ${
                        tarea.estado === 'PENDIENTE' ? 'text-yellow-600' :
                        tarea.estado === 'EN_PROGRESO' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {tarea.estado}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => onAsignar(tareaSeleccionada)}
            disabled={!tareaSeleccionada}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Asignar Tarea
          </button>
        </div>
      </div>
    </div>
  );
}
