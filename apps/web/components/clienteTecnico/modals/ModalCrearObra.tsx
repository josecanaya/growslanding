'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

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

interface ModalCrearObraProps {
  onClose: () => void;
  onSave: (obra: Omit<Obra, 'id' | 'progreso' | 'tareasActivas' | 'tareasCompletadas' | 'estado'>) => void;
}

export function ModalCrearObra({ onClose, onSave }: ModalCrearObraProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre && formData.ubicacion && formData.fechaInicio && formData.fechaFin) {
      onSave(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primario">Crear Nueva Obra</h3>
          <button
            onClick={onClose}
            className="text-primario/70 hover:text-primario transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Nombre de la obra *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Casa Familiar - Villa Crespo"
              className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Ubicación *
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Villa Crespo, CABA"
              className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50"
              required
            />
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

          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Fecha estimada de fin *
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
              <span>Guardar Obra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
