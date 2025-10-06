'use client';

import { useState } from 'react';
import { 
  Settings, 
  ArrowRight, 
  Trash2, 
  Plus,
  Info,
  AlertCircle
} from 'lucide-react';

// Tipos de datos
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

interface Dependencia {
  id: string;
  desde: string;
  hasta: string;
  tipo: string;
}

interface PasoConfiguracionDependenciasProps {
  tareas: Tarea[];
  onTareasChange: (tareas: Tarea[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Tipos de dependencias
const TIPOS_DEPENDENCIA = [
  { value: 'FS', label: 'Finalizar para Iniciar (FS)', description: 'La tarea A debe terminar antes de que inicie la tarea B' },
  { value: 'SS', label: 'Iniciar para Iniciar (SS)', description: 'La tarea A debe iniciar al mismo tiempo que la tarea B' },
  { value: 'FF', label: 'Finalizar para Finalizar (FF)', description: 'La tarea A debe terminar al mismo tiempo que la tarea B' },
  { value: 'SF', label: 'Iniciar para Finalizar (SF)', description: 'La tarea A debe iniciar antes de que termine la tarea B' }
];

// Componente para mostrar una dependencia
const DependenciaCard = ({ 
  dependencia, 
  tareas, 
  onRemove 
}: { 
  dependencia: Dependencia; 
  tareas: Tarea[]; 
  onRemove: (id: string) => void; 
}) => {
  const tareaDesde = tareas.find(t => t.id === dependencia.desde);
  const tareaHasta = tareas.find(t => t.id === dependencia.hasta);
  const tipoDep = TIPOS_DEPENDENCIA.find(t => t.value === dependencia.tipo);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {tipoDep?.label}
          </span>
        </div>
        <button
          onClick={() => onRemove(dependencia.id)}
          className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{tareaDesde?.nombre}</h4>
          <p className="text-sm text-gray-600">{tareaDesde?.fase}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">{tipoDep?.value}</span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1 text-right">
          <h4 className="font-medium text-gray-900">{tareaHasta?.nombre}</h4>
          <p className="text-sm text-gray-600">{tareaHasta?.fase}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">{tipoDep?.description}</p>
    </div>
  );
};

// Modal para crear dependencia
const ModalCrearDependencia = ({ 
  isOpen, 
  onClose, 
  onSave, 
  tareas 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (dependencia: Omit<Dependencia, 'id'>) => void; 
  tareas: Tarea[]; 
}) => {
  const [formData, setFormData] = useState({
    desde: '',
    hasta: '',
    tipo: 'FS'
  });

  const handleSave = () => {
    if (formData.desde && formData.hasta && formData.desde !== formData.hasta) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Crear Dependencia</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Ã—
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarea Origen</label>
            <select
              value={formData.desde}
              onChange={(e) => setFormData(prev => ({ ...prev, desde: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar tarea origen</option>
              {tareas.map(tarea => (
                <option key={tarea.id} value={tarea.id}>{tarea.nombre} ({tarea.fase})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Dependencia</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIPOS_DEPENDENCIA.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {TIPOS_DEPENDENCIA.find(t => t.value === formData.tipo)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarea Destino</label>
            <select
              value={formData.hasta}
              onChange={(e) => setFormData(prev => ({ ...prev, hasta: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar tarea destino</option>
              {tareas.filter(t => t.id !== formData.desde).map(tarea => (
                <option key={tarea.id} value={tarea.id}>{tarea.nombre} ({tarea.fase})</option>
              ))}
            </select>
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
            disabled={!formData.desde || !formData.hasta || formData.desde === formData.hasta}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Crear Dependencia
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function PasoConfiguracionDependencias({ 
  tareas, 
  onTareasChange, 
  onNext, 
  onPrevious 
}: PasoConfiguracionDependenciasProps) {
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Generar dependencias automÃ¡ticas basadas en las fases
  const generarDependenciasAutomaticas = () => {
    const nuevasDependencias: Dependencia[] = [];
    const fases = ['PreparaciÃ³n', 'Estructura', 'MamposterÃ­a', 'Instalaciones', 'Terminaciones', 'Cubiertas'];
    
    // Crear dependencias entre fases consecutivas
    for (let i = 0; i < fases.length - 1; i++) {
      const faseActual = fases[i];
      const faseSiguiente = fases[i + 1];
      
      const tareasFaseActual = tareas.filter(t => t.fase === faseActual);
      const tareasFaseSiguiente = tareas.filter(t => t.fase === faseSiguiente);
      
      // Crear dependencias FS entre la Ãºltima tarea de una fase y la primera de la siguiente
      if (tareasFaseActual.length > 0 && tareasFaseSiguiente.length > 0) {
        const ultimaTareaFaseActual = tareasFaseActual[tareasFaseActual.length - 1];
        const primeraTareaFaseSiguiente = tareasFaseSiguiente[0];
        
        nuevasDependencias.push({
          id: `auto-${ultimaTareaFaseActual.id}-${primeraTareaFaseSiguiente.id}`,
          desde: ultimaTareaFaseActual.id,
          hasta: primeraTareaFaseSiguiente.id,
          tipo: 'FS'
        });
      }
    }
    
    setDependencias(nuevasDependencias);
  };

  const handleCrearDependencia = (dependenciaData: Omit<Dependencia, 'id'>) => {
    const nuevaDependencia: Dependencia = {
      ...dependenciaData,
      id: `dep-${Date.now()}`
    };
    setDependencias(prev => [...prev, nuevaDependencia]);
  };

  const handleRemoveDependencia = (id: string) => {
    setDependencias(prev => prev.filter(dep => dep.id !== id));
  };

  const handleNext = () => {
    // Actualizar las tareas con las dependencias
    const tareasActualizadas = tareas.map(tarea => {
      const dependenciasTarea = dependencias
        .filter(dep => dep.desde === tarea.id)
        .map(dep => dep.hasta);
      
      return {
        ...tarea,
        dependencias: dependenciasTarea
      };
    });
    
    onTareasChange(tareasActualizadas);
    onNext();
  };

  // Agrupar tareas por fase para mejor visualizaciÃ³n
  const tareasPorFase = tareas.reduce((acc, tarea) => {
    if (!acc[tarea.fase]) {
      acc[tarea.fase] = [];
    }
    acc[tarea.fase].push(tarea);
    return acc;
  }, {} as Record<string, Tarea[]>);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="p-3 bg-orange-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Settings className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">ConfiguraciÃ³n de Dependencias</h2>
        <p className="text-gray-600 mt-2">Define las relaciones entre tareas para optimizar el cronograma</p>
      </div>

      {/* InformaciÃ³n sobre dependencias */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Tipos de Dependencias</h3>
            <div className="text-sm text-blue-700 mt-2 space-y-1">
              <p><strong>FS (Finalizar para Iniciar):</strong> La tarea A debe terminar antes de que inicie la tarea B</p>
              <p><strong>SS (Iniciar para Iniciar):</strong> Ambas tareas deben iniciar al mismo tiempo</p>
              <p><strong>FF (Finalizar para Finalizar):</strong> Ambas tareas deben terminar al mismo tiempo</p>
              <p><strong>SF (Iniciar para Finalizar):</strong> La tarea A debe iniciar antes de que termine la tarea B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={generarDependenciasAutomaticas}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Settings className="h-4 w-4" />
            <span>Generar AutomÃ¡ticas</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Manual</span>
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {dependencias.length} dependencias configuradas
        </div>
      </div>

      {/* Vista de tareas por fase */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Tareas por Fase</h3>
        {Object.entries(tareasPorFase).map(([fase, tareasFase]) => (
          <div key={fase}>
            <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {fase}
              </span>
              <span className="text-sm text-gray-500">({tareasFase.length} tareas)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tareasFase.map((tarea) => (
                <div key={tarea.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-gray-900 text-sm">{tarea.nombre}</h5>
                  <p className="text-xs text-gray-600 mt-1">{tarea.duracionEstimada} dÃ­as</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lista de dependencias */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dependencias Configuradas</h3>
        {dependencias.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay dependencias configuradas</p>
            <p className="text-sm">Usa los botones Generar Automaticas o Crear Manual para agregar dependencias</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dependencias.map((dependencia) => (
              <DependenciaCard
                key={dependencia.id}
                dependencia={dependencia}
                tareas={tareas}
                onRemove={handleRemoveDependencia}
              />
            ))}
          </div>
        )}
      </div>

      {/* NavegaciÃ³n */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrevious}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
        >
          <span>Anterior</span>
        </button>
        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <span>Finalizar</span>
        </button>
      </div>

      {/* Modal para crear dependencia */}
      <ModalCrearDependencia
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCrearDependencia}
        tareas={tareas}
      />
    </div>
  );
}

