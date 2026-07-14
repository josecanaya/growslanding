'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { fetchCanvasTemplateXml } from '@/lib/canvas/importCanvasTemplateFromXml';
import { projectXmlToTasks } from '@/lib/obra-check/xmlAdapter';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { PlanXmlLibraryPicker } from '@/components/canvas/PlanXmlLibraryPicker';
import { BRAND } from './ui';

/**
 * Mismo asistente de precarga XML que el canvas: filtra la librería y convierte el
 * Project XML elegido a ObraCheckTask[] (con precedencias del archivo).
 */
export function ObraCheckPlanFromLibrary({
  defaultObraProductKind,
  onLoaded,
}: {
  defaultObraProductKind?: string | null;
  onLoaded: (tasks: ObraCheckTask[]) => void;
}) {
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applySlug(slug: string) {
    setError(null);
    setApplyingSlug(slug);
    try {
      const xml = await fetchCanvasTemplateXml(slug);
      const { tasks } = projectXmlToTasks(xml);
      if (tasks.length === 0) {
        setError('Ese plan no tiene tareas ejecutables. Probá otro.');
        return;
      }
      onLoaded(tasks);
    } catch (e) {
      setError((e as Error).message || 'No se pudo cargar el plan.');
    } finally {
      setApplyingSlug(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} style={{ color: BRAND.green }} />
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Elegí un plan de la librería XML
        </p>
      </div>
      <PlanXmlLibraryPicker
        defaultObraProductKind={defaultObraProductKind}
        onApplySlug={(slug) => void applySlug(slug)}
        applyingSlug={applyingSlug}
        hint="Es el mismo flujo que en el canvas de Grows: filtrás y cargás el XML. Las precedencias vienen del plan."
      />
      {error && (
        <p className="mt-3 text-sm" style={{ color: BRAND.error }}>
          {error}
        </p>
      )}
    </div>
  );
}
