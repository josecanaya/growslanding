'use client';

import { useState } from 'react';
import { X, Send, DollarSign, User, MessageSquare, AlertTriangle } from 'lucide-react';

interface ModalPresupuestoProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (solicitud: SolicitudPresupuesto) => void;
  tarea: {
    id: string;
    nombre: string;
    obra: string;
    presupuesto?: number;
  };
  socios: Array<{ id: string; nombre: string; tipo: string }>;
}

interface SolicitudPresupuesto {
  socioId: string;
  socioNombre: string;
  comentarios: string;
  presupuestoEstimado?: number;
}

export function ModalPresupuesto({ isOpen, onClose, onSend, tarea, socios }: ModalPresupuestoProps) {
  const [formData, setFormData] = useState<SolicitudPresupuesto>({
    socioId: '',
    socioNombre: '',
    comentarios: '',
    presupuestoEstimado: tarea.presupuesto || undefined
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const handleInputChange = (field: keyof SolicitudPresupuesto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.socioId) {
      nuevosErrores.socio = 'Debe seleccionar un socio';
    }

    if (formData.presupuestoEstimado && formData.presupuestoEstimado < 0) {
      nuevosErrores.presupuestoEstimado = 'El presupuesto no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setEnviando(true);
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSend(formData);
      
      // Resetear formulario
      setFormData({
        socioId: '',
        socioNombre: '',
        comentarios: '',
        presupuestoEstimado: tarea.presupuesto || undefined
      });
      setErrores({});
      setEnviando(false);
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      socioId: '',
      socioNombre: '',
      comentarios: '',
      presupuestoEstimado: tarea.presupuesto || undefined
    });
    setErrores({});
    setEnviando(false);
    onClose();
  };

  const sociosLideres = socios.filter(socio => socio.tipo === 'Líder');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Solicitar Presupuesto</h2>
              <p className="text-sm text-gray-600">Enviar solicitud a un socio líder</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={enviando}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la tarea */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tarea</h3>
            <p className="text-sm text-gray-700">{tarea.nombre}</p>
            <p className="text-sm text-gray-600 mt-1">Obra: {tarea.obra}</p>
            {tarea.presupuesto && (
              <p className="text-sm text-gray-600">
                Presupuesto actual: ${tarea.presupuesto.toLocaleString()}
              </p>
            )}
          </div>

          {/* Selección de socio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Socio líder *
            </label>
            <select
              value={formData.socioId}
              onChange={(e) => {
                const socioSeleccionado = sociosLideres.find(s => s.id === e.target.value);
                handleInputChange('socioId', e.target.value);
                handleInputChange('socioNombre', socioSeleccionado?.nombre || '');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errores.socio ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={enviando}
            >
              <option value="">Seleccionar socio líder</option>
              {sociosLideres.map(socio => (
                <option key={socio.id} value={socio.id}>
                  {socio.nombre}
                </option>
              ))}
            </select>
            {errores.socio && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.socio}
              </p>
            )}
            {sociosLideres.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                No hay socios líderes disponibles
              </p>
            )}
          </div>

          {/* Presupuesto estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto estimado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.presupuestoEstimado || ''}
                onChange={(e) => handleInputChange('presupuestoEstimado', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errores.presupuestoEstimado ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={enviando}
              />
            </div>
            {errores.presupuestoEstimado && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errores.presupuestoEstimado}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Este valor es solo una estimación. El socio proporcionará el presupuesto final.
            </p>
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={formData.comentarios}
              onChange={(e) => handleInputChange('comentarios', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Agrega cualquier información adicional que pueda ser útil para el presupuesto..."
              disabled={enviando}
            />
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Información importante</h4>
                <p className="text-sm text-blue-700 mt-1">
                  La solicitud será enviada al socio líder seleccionado. Recibirás una notificación cuando responda con el presupuesto detallado.
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
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
