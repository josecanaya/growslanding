'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Objective, Priority } from '@/lib/roadmap/types';

interface FormObjetivoProps {
  objetivo?: Objective | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function FormObjetivo({ objetivo, isOpen, onClose, onSave }: FormObjetivoProps) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA' as Priority,
    targetWeeks: 0,
    dueDate: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (objetivo) {
      setForm({
        titulo: objetivo.title || '',
        descripcion: objetivo.description || '',
        prioridad: objetivo.priority || 'MEDIA',
        targetWeeks: objetivo.targetWeeks || 0,
        dueDate: objetivo.dueDate || '',
      });
    } else {
      setForm({
        titulo: '',
        descripcion: '',
        prioridad: 'MEDIA',
        targetWeeks: 0,
        dueDate: '',
      });
    }
  }, [objetivo, isOpen]);

  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      alert('El título es requerido');
      return;
    }

    setLoading(true);
    try {
      const method = objetivo ? 'PATCH' : 'POST';
      const body = objetivo
        ? { id: objetivo.id, ...form, titulo: form.titulo, descripcion: form.descripcion }
        : { ...form, titulo: form.titulo, descripcion: form.descripcion };

      const response = await fetch('/api/roadmap/objetivos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Error al guardar objetivo');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el objetivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-[#e0e3eb] rounded-2xl">
        <DialogHeader className="border-b border-[#e0e3eb] pb-4">
          <DialogTitle className="text-xl font-bold text-[#1b263b]">
            {objetivo ? '✏️ Editar Objetivo' : '➕ Nuevo Objetivo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[#1b263b] mb-2">
              Título del Objetivo *
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Implementar sistema de autenticación"
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
              placeholder="Detalles del objetivo..."
              rows={3}
              className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b] resize-none"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-[#1b263b] mb-2">
              Prioridad
            </label>
            <select
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as Priority })}
              className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
            >
              <option value="ALTA">🔴 Alta</option>
              <option value="MEDIA">🟡 Media</option>
              <option value="BAJA">🟢 Baja</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semanas estimadas */}
            <div>
              <label className="block text-sm font-medium text-[#1b263b] mb-2">
                Semanas Estimadas
              </label>
              <input
                type="number"
                value={form.targetWeeks}
                onChange={(e) => setForm({ ...form, targetWeeks: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
              />
            </div>

            {/* Fecha límite */}
            <div>
              <label className="block text-sm font-medium text-[#1b263b] mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-[#e0e3eb] rounded-lg focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff] text-[#1b263b]"
              />
            </div>
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
            {loading ? '⏳ Guardando...' : objetivo ? '💾 Actualizar' : '➕ Crear Objetivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


