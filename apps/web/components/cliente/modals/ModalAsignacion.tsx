'use client';

import { useState } from 'react';
import { X, Users, Check, AlertTriangle, User, Building2 } from 'lucide-react';

interface ModalAsignacionProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (asignacion: AsignacionTarea) => void;
  tarea: {
    id: string;
    nombre: string;
    obra: string;
    responsable: string;
  };
  socios: Array<{ id: string; nombre: string; tipo: string }>;
  cuadrillas?: Array<{ id: string; nombre: string; miembros: number }>;
}

interface AsignacionTarea {
  tipo: 'socio' | 'cuadrilla';
  asignacionId: string;
  asignacionNombre: string;
  comentarios?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export function ModalAsignacion({ 
  isOpen, 
  onClose, 
  onAssign, 
  tarea, 
  socios, 
  cuadrillas = [] 
}: ModalAsignacionProps) {
  const [formData, setFormData] = useState<AsignacionTarea>({
    tipo: 'socio',
    asignacionId: '',
    asignacionNombre: '',
    comentarios: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [asignando, setAsignando] = useState(false);

  const handleInputChange = (field: keyof AsignacionTarea, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.asignacionId) {
      nuevosErrores.asignacion = `Debe seleccionar un ${formData.tipo}`;
    }

    if (formData.fechaInicio && formData.fechaFin) {
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaFin = new Date(formData.fechaFin);
      
      if (fechaInicio >= fechaFin) {
        nuevosErrores.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setAsignando(true);
      
      // Simular asignación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onAssign(formData);
      
      // Resetear formulario
      setFormData({
        tipo: 'socio',
        asignacionId: '',
        asignacionNombre: '',
        comentarios: '',
        fechaInicio: '',
        fechaFin: ''
      });
      setErrores({});
      setAsignando(false);
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      tipo: 'socio',
      asignacionId: '',
      asignacionNombre: '',
      comentarios: '',
      fechaInicio: '',
      fechaFin: ''
    });
    setErrores({});
    setAsignando(false);
    onClose();
  };

  const getOpcionesAsignacion = () => {
    if (formData.tipo === 'socio') {
      return socios.map(socio => ({
        id: socio.id,
        nombre: socio.nombre,
        detalle: `${socio.tipo}`,
        disponible: true
      }));
    } else {
      return cuadrillas.map(cuadrilla => ({
        id: cuadrilla.id,
        nombre: cuadrilla.nombre,
        detalle: `${cuadrilla.miembros} miembros`,
        disponible: true
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Asignar Tarea</h2>
              <p className="text-sm text-gray-600">Asignar la tarea a un socio o cuadrilla</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={asignando}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la tarea */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tarea a asignar</h3>
            <p className="text-sm text-gray-700">{tarea.nombre}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {tarea.obra}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Responsable actual: {tarea.responsable}
              </span>
            </div>
          </div>

          {/* Tipo de asignación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de asignación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  handleInputChange('tipo', 'socio');
                  handleInputChange('asignacionId', '');
                  handleInputChange('asignacionNombre', '');
                }}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'socio'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={asignando}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Socio</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Asignar a una persona</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleInputChange('tipo', 'cuadrilla');
                  handleInputChange('asignacionId', '');
                  handleInputChange('asignacionNombre', '');
                }}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'cuadrilla'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={asignando}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Cuadrilla</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Asignar a un equipo</p>
              </button>
            </div>
          </div>

          {/* Selección de socio/cuadrilla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.tipo === 'socio' ? 'Socio' : 'Cuadrilla'} *
            </label>
            <select
              value={formData.asignacionId}
              onChange={(e) => {
                const opcionSeleccionada = getOpcionesAsignacion().find(o => o.id === e.target.value);
                handleInputChange('asignacionId', e.target.value);
                handleInputChange('asignacionNombre', opcionSeleccionada?.nombre || '');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errores.asignacion ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={asignando}
            >
              <option value="">Seleccionar {formData.tipo}</option>
              {getOpcionesAsignacion().map(opcion => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.nombre} ({opcion.detalle})
                </option>
              ))}
            </select>
            {errores.asignacion && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.asignacion}
              </p>
            )}
            {getOpcionesAsignacion().length === 0 && (
              <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                No hay {formData.tipo === 'socio' ? 'socios' : 'cuadrillas'} disponibles
              </p>
            )}
          </div>

          {/* Fechas opcionales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio (opcional)
              </label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={asignando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin (opcional)
              </label>
              <input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                min={formData.fechaInicio || new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errores.fechaFin ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={asignando}
              />
              {errores.fechaFin && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errores.fechaFin}
                </p>
              )}
            </div>
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={formData.comentarios}
              onChange={(e) => handleInputChange('comentarios', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Agrega cualquier información adicional sobre la asignación..."
              disabled={asignando}
            />
          </div>

          {/* Información adicional */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="h-3 w-3 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-900">Confirmación de asignación</h4>
                <p className="text-sm text-purple-700 mt-1">
                  La tarea será asignada al {formData.tipo} seleccionado y recibirán una notificación.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={asignando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={asignando}
            >
              {asignando ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Asignación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
