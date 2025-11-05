'use client';

import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

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
}

interface ModalAsignarTareaProps {
  onClose: () => void;
  onSave: (tarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => void;
  obras: Obra[];
}

const plantillasConstructivas = {
  'muro_portante': {
    nombre: 'Muro Portante',
    subtareas: ['Replanteo', 'Excavación', 'Hormigón de cimientos', 'Mampostería', 'Finalización']
  },
  'techo_metalico': {
    nombre: 'Techo Metálico',
    subtareas: ['Replanteo', 'Estructura metálica', 'Cubierta', 'Aislaciones', 'Finalización']
  },
  'instalacion_sanitaria': {
    nombre: 'Instalación Sanitaria',
    subtareas: ['Replanteo', 'Excavación', 'Tuberías principales', 'Conexiones', 'Pruebas', 'Finalización']
  },
  'terminacion_interior': {
    nombre: 'Terminación Interior',
    subtareas: ['Preparación', 'Revoque', 'Pintura', 'Instalaciones', 'Finalización']
  }
};

const lideresDisponibles = [
  'Juan Pérez',
  'María López',
  'Carlos Rodríguez',
  'Ana García',
  'Pedro Martínez'
];

export function ModalAsignarTarea({ onClose, onSave, obras }: ModalAsignarTareaProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    obraId: '',
    lider: '',
    fechaInicio: '',
    fechaFin: '',
    plantilla: ''
  });

  const [checklist, setChecklist] = useState<string[]>(['Seguridad', 'Orden', 'Calidad']);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre && formData.obraId && formData.lider && formData.fechaInicio && formData.fechaFin) {
      onSave({
        ...formData,
        checklist
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlantillaChange = (plantillaKey: string) => {
    setFormData({
      ...formData,
      plantilla: plantillaKey
    });

    // Cargar subtareas de la plantilla
    if (plantillaKey && plantillasConstructivas[plantillaKey as keyof typeof plantillasConstructivas]) {
      const plantilla = plantillasConstructivas[plantillaKey as keyof typeof plantillasConstructivas];
      setChecklist([...plantilla.subtareas]);
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

  const handleFileUpload = () => {
    alert('📸 Funcionalidad de subida de evidencias en desarrollo. Próximamente podrás subir fotos.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primario">Asignar Nueva Tarea</h3>
          <button
            onClick={onClose}
            className="text-primario/70 hover:text-primario transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Nombre de la tarea *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Revoque exterior"
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Obra asignada *
              </label>
              <select
                name="obraId"
                value={formData.obraId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
                required
              >
                <option value="">Seleccionar obra</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nombre}
                  </option>
                ))}
              </select>
            </div>
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
                Plantilla constructiva
              </label>
              <select
                value={formData.plantilla}
                onChange={(e) => handlePlantillaChange(e.target.value)}
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
              >
                <option value="">Seleccionar plantilla</option>
                {Object.entries(plantillasConstructivas).map(([key, plantilla]) => (
                  <option key={key} value={key}>
                    {plantilla.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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
