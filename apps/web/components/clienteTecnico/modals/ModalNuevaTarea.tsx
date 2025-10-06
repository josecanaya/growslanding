'use client';

import { useState } from 'react';
import { X, Save, Calendar, User, Building2, AlertTriangle, FileText } from 'lucide-react';

interface ModalNuevaTareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tarea: NuevaTarea) => void;
  obras: Array<{ id: string; nombre: string }>;
  socios: Array<{ id: string; nombre: string; tipo: string }>;
}

interface NuevaTarea {
  nombre: string;
  descripcion: string;
  obra: string;
  responsable: string;
  fechaVencimiento?: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  presupuesto?: number;
}

export function ModalNuevaTarea({ isOpen, onClose, onSave, obras, socios }: ModalNuevaTareaProps) {
  const [formData, setFormData] = useState<NuevaTarea>({
    nombre: '',
    descripcion: '',
    obra: '',
    responsable: '',
    fechaVencimiento: '',
    prioridad: 'Media',
    presupuesto: undefined
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof NuevaTarea, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre de la tarea es requerido';
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es requerida';
    }

    if (!formData.obra) {
      nuevosErrores.obra = 'Debe seleccionar una obra';
    }

    if (!formData.responsable) {
      nuevosErrores.responsable = 'Debe asignar un responsable';
    }

    if (formData.fechaVencimiento) {
      const fechaVencimiento = new Date(formData.fechaVencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaVencimiento < hoy) {
        nuevosErrores.fechaVencimiento = 'La fecha de vencimiento no puede ser anterior a hoy';
      }
    }

    if (formData.presupuesto && formData.presupuesto < 0) {
      nuevosErrores.presupuesto = 'El presupuesto no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      onSave(formData);
      // Resetear formulario
      setFormData({
        nombre: '',
        descripcion: '',
        obra: '',
        responsable: '',
        fechaVencimiento: '',
        prioridad: 'Media',
        presupuesto: undefined
      });
      setErrores({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      obra: '',
      responsable: '',
      fechaVencimiento: '',
      prioridad: 'Media',
      presupuesto: undefined
    });
    setErrores({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Tarea</h2>
              <p className="text-sm text-gray-600">Crear una nueva tarea para una obra</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre de la tarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la tarea *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errores.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Instalación eléctrica planta baja"
            />
            {errores.nombre && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.nombre}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errores.descripcion ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe los detalles de la tarea a realizar..."
            />
            {errores.descripcion && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.descripcion}
              </p>
            )}
          </div>

          {/* Obra y Responsable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Obra *
              </label>
              <select
                value={formData.obra}
                onChange={(e) => handleInputChange('obra', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errores.obra ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar obra</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.nombre}>
                    {obra.nombre}
                  </option>
                ))}
              </select>
              {errores.obra && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errores.obra}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Responsable *
              </label>
              <select
                value={formData.responsable}
                onChange={(e) => handleInputChange('responsable', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errores.responsable ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar responsable</option>
                {socios.map(socio => (
                  <option key={socio.id} value={socio.nombre}>
                    {socio.nombre} ({socio.tipo})
                  </option>
                ))}
              </select>
              {errores.responsable && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errores.responsable}
                </p>
              )}
            </div>
          </div>

          {/* Fecha de vencimiento y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errores.fechaVencimiento ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errores.fechaVencimiento && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errores.fechaVencimiento}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => handleInputChange('prioridad', e.target.value as 'Baja' | 'Media' | 'Alta')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto estimado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.presupuesto || ''}
                onChange={(e) => handleInputChange('presupuesto', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errores.presupuesto ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errores.presupuesto && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.presupuesto}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
