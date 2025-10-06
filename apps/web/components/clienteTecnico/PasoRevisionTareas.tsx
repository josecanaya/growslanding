'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Edit3, 
  Save,
  AlertCircle,
  Info
} from 'lucide-react';

// Tipos de datos
interface ElementoConstructivo {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  cantidad: number;
  descripcion?: string;
  esPersonalizado?: boolean;
}

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  elementoId: string;
  fase: string;
  cantidad: number;
  unidad: string;
  duracionEstimada: number;
  estado: string;
  dependencias: string[];
  socioAsignado?: string;
}

interface PasoRevisionTareasProps {
  elementos: ElementoConstructivo[];
  tareas: Tarea[];
  onTareasChange: (tareas: Tarea[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Plantillas de tareas por elemento
const PLANTILLAS_TAREAS: Record<string, any[]> = {
  // Fundaciones
  'Excavación de fundación': [
    { nombre: 'Replanteo y nivelación', fase: 'Preparación', duracion: 1, descripcion: 'Marcado del terreno y nivelación' },
    { nombre: 'Excavación manual', fase: 'Excavación', duracion: 3, descripcion: 'Excavación del terreno' },
    { nombre: 'Compactación del suelo', fase: 'Preparación', duracion: 1, descripcion: 'Compactación del suelo de fundación' }
  ],
  'Hormigón de fundación': [
    { nombre: 'Armado de fundación', fase: 'Estructura', duracion: 2, descripcion: 'Colocación de armadura' },
    { nombre: 'Hormigonado', fase: 'Estructura', duracion: 1, descripcion: 'Vaciado de hormigón' },
    { nombre: 'Curado', fase: 'Estructura', duracion: 7, descripcion: 'Curado del hormigón' }
  ],
  'Armadura de fundación': [
    { nombre: 'Corte y doblado', fase: 'Preparación', duracion: 2, descripcion: 'Preparación de armadura' },
    { nombre: 'Colocación en obra', fase: 'Estructura', duracion: 1, descripcion: 'Colocación de armadura en obra' }
  ],

  // Estructura
  'Muros de hormigón': [
    { nombre: 'Armado de muros', fase: 'Estructura', duracion: 3, descripcion: 'Colocación de armadura' },
    { nombre: 'Encofrado', fase: 'Estructura', duracion: 2, descripcion: 'Montaje de encofrado' },
    { nombre: 'Hormigonado', fase: 'Estructura', duracion: 1, descripcion: 'Vaciado de hormigón' },
    { nombre: 'Desencofrado', fase: 'Estructura', duracion: 1, descripcion: 'Retiro de encofrado' }
  ],
  'Columnas de hormigón': [
    { nombre: 'Armado de columnas', fase: 'Estructura', duracion: 2, descripcion: 'Colocación de armadura' },
    { nombre: 'Encofrado', fase: 'Estructura', duracion: 1, descripcion: 'Montaje de encofrado' },
    { nombre: 'Hormigonado', fase: 'Estructura', duracion: 1, descripcion: 'Vaciado de hormigón' },
    { nombre: 'Desencofrado', fase: 'Estructura', duracion: 1, descripcion: 'Retiro de encofrado' }
  ],
  'Losas de hormigón': [
    { nombre: 'Armado de losa', fase: 'Estructura', duracion: 3, descripcion: 'Colocación de armadura' },
    { nombre: 'Encofrado', fase: 'Estructura', duracion: 2, descripcion: 'Montaje de encofrado' },
    { nombre: 'Hormigonado', fase: 'Estructura', duracion: 1, descripcion: 'Vaciado de hormigón' },
    { nombre: 'Desencofrado', fase: 'Estructura', duracion: 2, descripcion: 'Retiro de encofrado' }
  ],

  // Mampostería
  'Muros de ladrillo': [
    { nombre: 'Preparación de mezcla', fase: 'Mampostería', duracion: 1, descripcion: 'Preparación de mortero' },
    { nombre: 'Levantamiento de muros', fase: 'Mampostería', duracion: 4, descripcion: 'Construcción de muros' },
    { nombre: 'Revoque grueso', fase: 'Terminaciones', duracion: 2, descripcion: 'Revoque grueso' }
  ],
  'Revoque grueso': [
    { nombre: 'Preparación de superficie', fase: 'Preparación', duracion: 1, descripcion: 'Limpieza y humectación' },
    { nombre: 'Aplicación de revoque', fase: 'Terminaciones', duracion: 2, descripcion: 'Aplicación de revoque grueso' }
  ],
  'Revoque fino': [
    { nombre: 'Preparación de superficie', fase: 'Preparación', duracion: 1, descripcion: 'Limpieza y humectación' },
    { nombre: 'Aplicación de revoque', fase: 'Terminaciones', duracion: 2, descripcion: 'Aplicación de revoque fino' }
  ],

  // Cubiertas
  'Estructura de techo': [
    { nombre: 'Corte y preparación', fase: 'Estructura', duracion: 2, descripcion: 'Preparación de estructura' },
    { nombre: 'Montaje de estructura', fase: 'Estructura', duracion: 3, descripcion: 'Montaje de estructura de techo' }
  ],
  'Cubierta de chapa': [
    { nombre: 'Preparación de estructura', fase: 'Preparación', duracion: 1, descripcion: 'Preparación para cubierta' },
    { nombre: 'Colocación de chapa', fase: 'Cubiertas', duracion: 2, descripcion: 'Instalación de cubierta' },
    { nombre: 'Sellado y terminaciones', fase: 'Terminaciones', duracion: 1, descripcion: 'Sellado de juntas' }
  ],

  // Instalaciones
  'Instalación eléctrica': [
    { nombre: 'Tendido de caños', fase: 'Instalaciones', duracion: 2, descripcion: 'Instalación de caños eléctricos' },
    { nombre: 'Tendido de cables', fase: 'Instalaciones', duracion: 2, descripcion: 'Tendido de cables' },
    { nombre: 'Instalación de tableros', fase: 'Instalaciones', duracion: 1, descripcion: 'Montaje de tableros' },
    { nombre: 'Instalación de artefactos', fase: 'Terminaciones', duracion: 1, descripcion: 'Instalación de luces y tomas' }
  ],
  'Instalación de gas': [
    { nombre: 'Tendido de caños', fase: 'Instalaciones', duracion: 2, descripcion: 'Instalación de caños de gas' },
    { nombre: 'Instalación de artefactos', fase: 'Terminaciones', duracion: 1, descripcion: 'Instalación de artefactos de gas' }
  ],
  'Instalación de agua': [
    { nombre: 'Tendido de caños', fase: 'Instalaciones', duracion: 2, descripcion: 'Instalación de caños de agua' },
    { nombre: 'Instalación de artefactos', fase: 'Terminaciones', duracion: 1, descripcion: 'Instalación de grifos y artefactos' }
  ],

  // Terminaciones
  'Piso de cerámica': [
    { nombre: 'Preparación de superficie', fase: 'Preparación', duracion: 1, descripcion: 'Nivelación y limpieza' },
    { nombre: 'Colocación de cerámica', fase: 'Terminaciones', duracion: 3, descripcion: 'Colocación de cerámica' },
    { nombre: 'Junteo', fase: 'Terminaciones', duracion: 1, descripcion: 'Junteo de cerámica' }
  ],
  'Pintura interior': [
    { nombre: 'Preparación de superficie', fase: 'Preparación', duracion: 1, descripcion: 'Lijado y limpieza' },
    { nombre: 'Aplicación de pintura', fase: 'Terminaciones', duracion: 2, descripcion: 'Aplicación de pintura interior' }
  ],
  'Pintura exterior': [
    { nombre: 'Preparación de superficie', fase: 'Preparación', duracion: 1, descripcion: 'Lijado y limpieza' },
    { nombre: 'Aplicación de pintura', fase: 'Terminaciones', duracion: 2, descripcion: 'Aplicación de pintura exterior' }
  ]
};

// Estados de tareas
const ESTADOS_TAREAS = ['PROPUESTA', 'PRESUPUESTADA', 'ASIGNADA', 'EN_EJECUCION', 'TERMINADA', 'VALIDADA'];

// Componente para mostrar una tarea
const TareaCard = ({ 
  tarea, 
  onEdit 
}: { 
  tarea: Tarea; 
  onEdit: (tarea: Tarea) => void; 
}) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PROPUESTA': return 'bg-gray-100 text-gray-800';
      case 'PRESUPUESTADA': return 'bg-blue-100 text-blue-800';
      case 'ASIGNADA': return 'bg-yellow-100 text-yellow-800';
      case 'EN_EJECUCION': return 'bg-orange-100 text-orange-800';
      case 'TERMINADA': return 'bg-green-100 text-green-800';
      case 'VALIDADA': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFaseColor = (fase: string) => {
    switch (fase) {
      case 'Preparación': return 'bg-blue-100 text-blue-800';
      case 'Estructura': return 'bg-red-100 text-red-800';
      case 'Mampostería': return 'bg-orange-100 text-orange-800';
      case 'Instalaciones': return 'bg-green-100 text-green-800';
      case 'Terminaciones': return 'bg-purple-100 text-purple-800';
      case 'Cubiertas': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{tarea.nombre}</h3>
          <p className="text-sm text-gray-600 mb-2">{tarea.descripcion}</p>
        </div>
        <button
          onClick={() => onEdit(tarea)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFaseColor(tarea.fase)}`}>
            {tarea.fase}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
            {tarea.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Cantidad:</span>
          <span className="ml-1 font-medium">{tarea.cantidad} {tarea.unidad}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">Duración:</span>
          <span className="ml-1 font-medium">{tarea.duracionEstimada} días</span>
        </div>
        <div className="flex items-center space-x-1">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">Socio:</span>
          <span className="ml-1 font-medium">{tarea.socioAsignado || 'Sin asignar'}</span>
        </div>
      </div>
    </div>
  );
};

// Modal para editar tarea
const ModalEditarTarea = ({ 
  isOpen, 
  onClose, 
  onSave, 
  tarea 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (tarea: Tarea) => void; 
  tarea: Tarea; 
}) => {
  const [formData, setFormData] = useState({
    nombre: tarea.nombre,
    descripcion: tarea.descripcion,
    cantidad: tarea.cantidad,
    duracionEstimada: tarea.duracionEstimada,
    estado: tarea.estado,
    socioAsignado: tarea.socioAsignado || ''
  });

  const handleSave = () => {
    const tareaActualizada: Tarea = {
      ...tarea,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      cantidad: formData.cantidad,
      duracionEstimada: formData.duracionEstimada,
      estado: formData.estado,
      socioAsignado: formData.socioAsignado.trim() || undefined
    };
    onSave(tareaActualizada);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Editar Tarea</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración (días)</label>
              <input
                type="number"
                value={formData.duracionEstimada}
                onChange={(e) => setFormData(prev => ({ ...prev, duracionEstimada: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ESTADOS_TAREAS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Socio Asignado</label>
            <input
              type="text"
              value={formData.socioAsignado}
              onChange={(e) => setFormData(prev => ({ ...prev, socioAsignado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del socio"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Save className="h-4 w-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function PasoRevisionTareas({ 
  elementos, 
  tareas, 
  onTareasChange, 
  onNext, 
  onPrevious 
}: PasoRevisionTareasProps) {
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [filtroFase, setFiltroFase] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  // Generar tareas automáticamente cuando cambian los elementos
  useEffect(() => {
    const nuevasTareas: Tarea[] = [];
    
    elementos.forEach(elemento => {
      const plantillas = PLANTILLAS_TAREAS[elemento.nombre] || [
        { nombre: elemento.nombre, fase: 'General', duracion: 1, descripcion: elemento.descripcion || 'Tarea generada automáticamente' }
      ];

      plantillas.forEach((plantilla, index) => {
        const tarea: Tarea = {
          id: `tarea-${elemento.id}-${index}`,
          nombre: plantilla.nombre,
          descripcion: plantilla.descripcion,
          elementoId: elemento.id,
          fase: plantilla.fase,
          cantidad: elemento.cantidad,
          unidad: elemento.unidad,
          duracionEstimada: plantilla.duracion,
          estado: 'PROPUESTA',
          dependencias: []
        };
        nuevasTareas.push(tarea);
      });
    });

    onTareasChange(nuevasTareas);
  }, [elementos, onTareasChange]);

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => {
    const matchesFase = filtroFase === 'Todas' || tarea.fase === filtroFase;
    const matchesEstado = filtroEstado === 'Todas' || tarea.estado === filtroEstado;
    return matchesFase && matchesEstado;
  });

  // Agrupar tareas por fase
  const tareasPorFase = tareasFiltradas.reduce((acc, tarea) => {
    if (!acc[tarea.fase]) {
      acc[tarea.fase] = [];
    }
    acc[tarea.fase].push(tarea);
    return acc;
  }, {} as Record<string, Tarea[]>);

  const handleEditTarea = (tarea: Tarea) => {
    setEditingTarea(tarea);
  };

  const handleSaveTarea = (tareaActualizada: Tarea) => {
    onTareasChange(tareas.map(t => t.id === tareaActualizada.id ? tareaActualizada : t));
    setEditingTarea(null);
  };

  const handleNext = () => {
    if (tareas.length > 0) {
      onNext();
    }
  };

  const fases = ['Preparación', 'Estructura', 'Mampostería', 'Instalaciones', 'Terminaciones', 'Cubiertas'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Revisión de Tareas</h2>
        <p className="text-gray-600 mt-2">Revisa y ajusta las tareas generadas automáticamente</p>
      </div>

      {/* Información de resumen */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Tareas Generadas Automáticamente</h3>
            <p className="text-sm text-blue-700 mt-1">
              Se generaron <strong>{tareas.length} tareas</strong> basadas en los <strong>{elementos.length} elementos</strong> seleccionados.
              Puedes editar cada tarea para ajustar cantidades, duraciones y asignaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por fase:</span>
          <select
            value={filtroFase}
            onChange={(e) => setFiltroFase(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todas">Todas las fases</option>
            {fases.map(fase => (
              <option key={fase} value={fase}>{fase}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todas">Todos los estados</option>
            {ESTADOS_TAREAS.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de tareas agrupadas por fase */}
      <div className="space-y-6">
        {Object.keys(tareasPorFase).length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas para mostrar</h3>
            <p className="text-gray-600">Ajusta los filtros o agrega elementos constructivos</p>
          </div>
        ) : (
          Object.entries(tareasPorFase).map(([fase, tareasFase]) => (
            <div key={fase}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {fase}
                </span>
                <span className="text-sm text-gray-500">({tareasFase.length} tareas)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tareasFase.map((tarea) => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    onEdit={handleEditTarea}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrevious}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
        >
          <span>Anterior</span>
        </button>
        <button
          onClick={handleNext}
          disabled={tareas.length === 0}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <span>Siguiente</span>
        </button>
      </div>

      {/* Modal para editar tarea */}
      {editingTarea && (
        <ModalEditarTarea
          isOpen={!!editingTarea}
          onClose={() => setEditingTarea(null)}
          onSave={handleSaveTarea}
          tarea={editingTarea}
        />
      )}
    </div>
  );
}
