'use client';

import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { getTareasPorFase, type TareaConstructiva } from '@/lib/tareas-construccion';
import { SelectorTareasAvanzado } from '../SelectorTareasAvanzado';

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

interface ModalCrearTareaProps {
  onClose: () => void;
  onSave: (tarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => void;
  onSaveMultiple?: (tareas: Omit<Tarea, 'id' | 'estado' | 'evidencias'>[]) => void;
  obra: Obra;
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  tareasExistentes: Tarea[];
}

const lideresDisponibles = [
  'Juan Pérez',
  'María López',
  'Carlos Rodríguez',
  'Ana García',
  'Pedro Martínez'
];

export function ModalCrearTarea({ onClose, onSave, onSaveMultiple, obra, etapa, tareasExistentes }: ModalCrearTareaProps) {
  // Obtener tareas disponibles para la etapa actual
  const tareasDisponibles = getTareasPorFase(etapa);
  
  const [formData, setFormData] = useState({
    nombre: '',
    lider: '',
    fechaInicio: '',
    fechaFin: '',
    tareaSeleccionada: ''
  });

  const [checklist, setChecklist] = useState<string[]>(['Seguridad', 'Orden', 'Calidad']);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');
  const [precedencia, setPrecedencia] = useState<string[]>([]);
  const [showSelectorVisual, setShowSelectorVisual] = useState(true);
  const [tareaSeleccionadaData, setTareaSeleccionadaData] = useState<TareaConstructiva | null>(null);
  const [tareasConfirmadas, setTareasConfirmadas] = useState<TareaConstructiva[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lider && formData.fechaInicio && formData.fechaFin && tareaSeleccionadaData) {
        // Usar el nombre personalizado o el nombre de la tarea seleccionada
        const nombreFinal = formData.nombre.trim() || tareaSeleccionadaData.nombre;
        
        onSave({
          ...formData,
          nombre: nombreFinal,
          obraId: obra.id,
          checklist,
          precedencia,
          etapa,
          plantilla: tareaSeleccionadaData.id
        });
    }
  };

  const handleSubmitMultiple = () => {
    console.log('🔴 handleSubmitMultiple called', { formData, tareasConfirmadas });
    
    if (formData.lider && tareasConfirmadas.length > 0) {
      console.log('🔴 Creating multiple tasks...');
      
      // Crear un array de tareas para enviar todas de una vez
      const tareasParaCrear = tareasConfirmadas.map((tareaData) => ({
        nombre: tareaData.nombre,
        lider: formData.lider,
        fechaInicio: new Date().toISOString().split('T')[0], // Fecha actual
        fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días después
        obraId: obra.id,
        checklist: ['Seguridad', 'Orden', 'Calidad'], // Checklist básico
        precedencia: [],
        etapa,
        plantilla: tareaData.id
      }));
      
      console.log('🔴 All tasks prepared:', tareasParaCrear);
      
      // Usar onSaveMultiple si está disponible, sino usar onSave para cada tarea
      if (onSaveMultiple) {
        onSaveMultiple(tareasParaCrear);
      } else {
        tareasParaCrear.forEach((tarea) => {
          onSave(tarea);
        });
      }
      
      console.log('🔴 All tasks created, closing modal');
      // Cerrar el modal
      onClose();
    } else {
      console.log('🔴 Validation failed:', { 
        lider: formData.lider, 
        tareasCount: tareasConfirmadas.length 
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTareaSeleccionada = (tareaId: string) => {
    const tarea = tareasDisponibles.find(t => t.id === tareaId);
    if (tarea) {
      setFormData({
        ...formData,
        tareaSeleccionada: tareaId,
        nombre: tarea.nombre
      });

      // Generar checklist básico basado en la tarea
      const checklistBasico = [
        'Seguridad',
        'Materiales disponibles',
        'Herramientas preparadas',
        'Ejecución',
        'Control de calidad',
        'Limpieza',
        'Finalización'
      ];
      setChecklist(checklistBasico);
    }
  };

  const handleTareaSeleccionadaVisual = (tarea: TareaConstructiva | TareaConstructiva[], fase: string) => {
    console.log('🟡 ModalCrearTarea: handleTareaSeleccionadaVisual called');
    console.log('🟡 Data received:', { tarea, fase, isArray: Array.isArray(tarea) });
    
    // Si es un array de tareas (nuevo comportamiento del carrito)
    if (Array.isArray(tarea)) {
      console.log('🟡 Processing array of tasks:', tarea.length);
      setTareasConfirmadas(tarea);
      setShowSelectorVisual(false);
    } else {
      console.log('🟡 Processing single task:', tarea);
      // Si es una sola tarea (comportamiento anterior)
      setTareaSeleccionadaData(tarea);
      setFormData({
        ...formData,
        tareaSeleccionada: tarea.id,
        nombre: tarea.nombre
      });

      // Generar checklist básico basado en la tarea
      const checklistBasico = [
        'Seguridad',
        'Materiales disponibles',
        'Herramientas preparadas',
        'Ejecución',
        'Control de calidad',
        'Limpieza',
        'Finalización'
      ];
      setChecklist(checklistBasico);
      setShowSelectorVisual(false);
    }
  };

  const addSubtarea = () => {
    if (nuevaSubtarea.trim()) {
      setChecklist([...checklist, nuevaSubtarea.trim()]);
      setNuevaSubtarea('');
    }
  };

  const removeSubtarea = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const togglePrecedencia = (tareaId: string) => {
    if (precedencia.includes(tareaId)) {
      setPrecedencia(precedencia.filter(id => id !== tareaId));
    } else {
      setPrecedencia([...precedencia, tareaId]);
    }
  };

  const handleFileUpload = () => {
    alert('📸 Funcionalidad de subida de evidencias en desarrollo. Próximamente podrás subir fotos.');
  };

  const tareasCompletadas = tareasExistentes.filter(t => t.estado === 'completada');

  // Si está mostrando el selector visual, renderizar solo eso
  if (showSelectorVisual) {
    return (
      <SelectorTareasAvanzado
        onClose={onClose}
        onTareaSeleccionada={handleTareaSeleccionadaVisual}
        etapaFija={etapa}
      />
    );
  }

  // Si hay tareas confirmadas, mostrar el formulario para múltiples tareas
  if (tareasConfirmadas.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-claro">
            <h3 className="text-xl font-semibold text-primario">
              Configurar Tareas Confirmadas ({tareasConfirmadas.length})
            </h3>
            <button
              onClick={onClose}
              className="text-primario/70 hover:text-primario transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Lista de tareas confirmadas */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-primario mb-3">Tareas Seleccionadas:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tareasConfirmadas.map((tarea, index) => (
                  <div key={index} className="bg-claro p-3 rounded-lg border border-claro">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-primario">{tarea.nombre}</div>
                        <div className="text-sm text-primario/70">
                          {tarea.cantidad} {tarea.unidad} • {tarea.horasTotales}h • {tarea.diasEstimados} días
                        </div>
                      </div>
                      <span className="text-xs bg-primario text-white px-2 py-1 rounded">
                        {tarea.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario para configurar las tareas */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitMultiple(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primario mb-2">
                  Líder Responsable *
                </label>
                <select
                  name="lider"
                  value={formData.lider}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario"
                >
                  <option value="">Seleccionar líder</option>
                  {lideresDisponibles.map(lider => (
                    <option key={lider} value={lider}>{lider}</option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-claro">
                <button
                  type="button"
                  onClick={() => {
                    setTareasConfirmadas([]);
                    setShowSelectorVisual(true);
                  }}
                  className="px-4 py-2 text-primario border border-primario rounded-lg hover:bg-primario/5 transition-colors duration-200"
                >
                  Volver a Seleccionar
                </button>
                <button
                  type="submit"
                  className="bg-primario text-white px-6 py-2 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Asignar {tareasConfirmadas.length} Tareas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primario">Configurar Tarea</h3>
              <p className="text-sm text-primario/70">{obra.nombre} - {etapa.charAt(0).toUpperCase() + etapa.slice(1)}</p>
              {tareaSeleccionadaData && (
                <div className="mt-2 p-2 bg-acento/20 rounded-lg">
                  <span className="text-sm font-medium text-primario">
                    {tareaSeleccionadaData.nombre} ({tareaSeleccionadaData.id})
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSelectorVisual(true)}
                className="text-primario/70 hover:text-primario transition-colors duration-200 px-3 py-1 rounded border border-primario/30 hover:border-primario/50 text-sm"
              >
                Cambiar Tarea
              </button>
              <button
                onClick={onClose}
                className="text-primario/70 hover:text-primario transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Nombre personalizado (opcional)
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Deja vacío para usar el nombre de la tarea seleccionada"
              className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50"
            />
            <p className="text-xs text-primario/60 mt-1">
              Si no especificas un nombre, se usará: {tareaSeleccionadaData?.nombre || 'Nombre de la tarea seleccionada'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Líder asignado *
              </label>
              <select
                name="lider"
                value={formData.lider}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
                required
              >
                <option value="">Seleccionar líder</option>
                {lideresDisponibles.map((lider) => (
                  <option key={lider} value={lider}>
                    {lider}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Fecha de fin *
            </label>
            <input
              type="date"
              name="fechaFin"
              value={formData.fechaFin}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
              required
            />
          </div>

          {/* Precedencia */}
          {tareasCompletadas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Tareas que deben completarse antes (Precedencia)
              </label>
              <div className="space-y-2">
                {tareasCompletadas.map((tarea) => (
                  <label key={tarea.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={precedencia.includes(tarea.id)}
                      onChange={() => togglePrecedencia(tarea.id)}
                      className="rounded border-claro text-primario focus:ring-acento"
                    />
                    <span className="text-primario">{tarea.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Checklist de tareas
            </label>
            <div className="space-y-2">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 bg-claro px-3 py-2 rounded-lg text-primario">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtarea(index)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={nuevaSubtarea}
                  onChange={(e) => setNuevaSubtarea(e.target.value)}
                  placeholder="Agregar nueva subtarea"
                  className="flex-1 px-3 py-2 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50"
                />
                <button
                  type="button"
                  onClick={addSubtarea}
                  className="bg-acento text-primario px-3 py-2 rounded-lg hover:bg-acento/90 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Evidencias */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Evidencias (opcional)
            </label>
            <button
              type="button"
              onClick={handleFileUpload}
              className="w-full border-2 border-dashed border-claro rounded-lg p-6 text-center hover:border-primario transition-colors duration-200"
            >
              <div className="text-primario/50 text-4xl mb-2">📸</div>
              <p className="text-primario/70">Haz clic para subir fotos como evidencia</p>
              <p className="text-primario/50 text-sm">PNG, JPG hasta 10MB</p>
            </button>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-claro text-primario py-3 px-4 rounded-lg font-medium hover:bg-claro/80 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primario text-white py-3 px-4 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Tarea</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
