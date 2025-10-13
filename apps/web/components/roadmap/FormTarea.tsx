'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus } from '@/lib/roadmap/types';

interface FormTareaProps {
  tarea?: Task | null;
  objetivoId: string;
  grupoId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function FormTarea({ tarea, objetivoId, grupoId, isOpen, onClose, onSave }: FormTareaProps) {
  const [form, setForm] = useState({
    texto: '',
    descripcion: '',
    estado: 'pending' as TaskStatus,
    estimateHrs: 0,
    responsable: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tarea) {
      setForm({
        texto: tarea.text || '',
        descripcion: tarea.description || '',
        estado: tarea.status || 'pending',
        estimateHrs: tarea.estimateHrs || 0,
        responsable: tarea.responsable || '',
      });
    } else {
      setForm({
        texto: '',
        descripcion: '',
        estado: 'pending',
        estimateHrs: 0,
        responsable: '',
      });
    }
  }, [tarea, isOpen]);

  const handleSubmit = async () => {
    if (!form.texto.trim()) {
      alert('El título de la tarea es requerido');
      return;
    }

    setLoading(true);
    try {
      const method = tarea ? 'PATCH' : 'POST';
      const body = tarea
        ? { id: tarea.id, ...form, done: form.estado === 'done' }
        : { ...form, objetivoId, grupoId, done: form.estado === 'done' };

      const response = await fetch('/api/roadmap/tareas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Error al guardar tarea');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-[#e0e3eb] rounded-2xl">
        <DialogHeader className="border-b border-[#e0e3eb] pb-4">
          <DialogTitle className="text-xl font-bold text-[#1b263b]">
            {tarea ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título de la tarea */}
          <div>
            <label className="block text-sm font-medium text-[#1b263b] mb-2">
              Título de la Tarea *
            </label>
            <input
              type="text"
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="Ej: Configurar OAuth con Google"
              className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-[#1b263b] mb-2">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-[#1b263b] mb-2">
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value as TaskStatus })}
                className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
              >
                <option value="pending">🔴 Pendiente</option>
                <option value="inProgress">🟣 En Curso</option>
                <option value="done">✅ Completada</option>
                <option value="review">🧩 En Revisión</option>
              </select>
            </div>

            {/* Horas estimadas */}
            <div>
              <label className="block text-sm font-medium text-[#1b263b] mb-2">
                Horas Estimadas
              </label>
              <input
                type="number"
                value={form.estimateHrs}
                onChange={(e) => setForm({ ...form, estimateHrs: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
              />
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-sm font-medium text-[#1b263b] mb-2">
              Responsable
            </label>
            <input
              type="text"
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
              placeholder="Nombre del responsable"
              className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-[#e0e3eb] pt-4">
          <Button
            className="bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc]"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#6c63ff] hover:bg-[#5850ec] text-white font-medium"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : tarea ? '💾 Actualizar Tarea' : '➕ Crear Tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


