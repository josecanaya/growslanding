'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { fetchCanvasTemplateXml } from '@/lib/canvas/importCanvasTemplateFromXml';
import { projectXmlToTasks } from '@/lib/obra-check/xmlAdapter';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { PlanXmlLibraryPicker } from '@/components/canvas/PlanXmlLibraryPicker';
import { BRAND } from './ui';

/**
 * Búsqueda filtrada en la librería XML (mismo catálogo del canvas).
 * Convierte el Project XML elegido a ObraCheckTask[] con precedencias.
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
        <Search size={18} style={{ color: BRAND.green }} />
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Buscar en librería
        </p>
      </div>
      <PlanXmlLibraryPicker
        defaultObraProductKind={defaultObraProductKind}
        onApplySlug={(slug) => void applySlug(slug)}
        applyingSlug={applyingSlug}
        title="Buscar en librería"
        hint="Filtrá por m², pisos, ambientes, complejidad… y elegí el plan. Las precedencias vienen del XML."
      />
      {error && (
        <p className="mt-3 text-sm" style={{ color: BRAND.error }}>
          {error}
        </p>
      )}
    </div>
  );
}
