'use client';

import { useMemo, useState } from 'react';
import { Button, ModalBase } from '@/components/ui/grows';
import type { ProjectImportPreview } from '@/lib/project/importProjectXml';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { CANVAS_PROJECT_KIND_LABEL } from '@/lib/canvas/canvasProjectProfile';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  preview: ProjectImportPreview | null;
  parseError: string | null;
  canvasHasNodes: boolean;
  /** Perfil de obra actual: la importación respeta esta profundidad al rellenar niveles. */
  projectKind?: CanvasProjectKind;
  onClose: () => void;
  onConfirmImport?: () => void;
  importing?: boolean;
};

export function ProjectXmlImportPreviewModal({
  open,
  preview,
  parseError,
  canvasHasNodes,
  projectKind,
  onClose,
  onConfirmImport,
  importing = false,
}: Props) {
  const [treeOpen, setTreeOpen] = useState(true);

  const edgeLabels = useMemo(() => {
    if (!preview) return null;
    return preview.edgesPreview.reduce(
      (acc, e) => {
        acc[e.kind] = (acc[e.kind] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [preview]);

  const canImport = Boolean(preview && !parseError && onConfirmImport);

  if (!open) return null;

  return (
    <ModalBase
      title="Previsualizar importación Project"
      onClose={onClose}
      size="xl"
      className="!max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canImport || importing}
            onClick={() => onConfirmImport?.()}
          >
            {importing ? 'Importando…' : 'Importar al canvas y guardar en la nube'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[min(72vh,640px)] flex-col gap-4 overflow-y-auto pr-1 text-sm text-grows-text-primary">
        {parseError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">
            {parseError}
          </div>
        )}

        {projectKind ? (
          <div className="rounded-lg border border-[#dbeafe] bg-[#f0f9ff] px-3 py-2 text-[13px] text-[#1e3a5f]">
            Tipo de obra en el lienzo: <strong>{CANVAS_PROJECT_KIND_LABEL[projectKind]}</strong>. Los niveles
            intermedios del XML se adaptan a esta profundidad (sin forzar departamento si el perfil no lo usa).
          </div>
        ) : null}

        {canvasHasNodes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
            Esta obra ya tiene estructura cargada en el canvas. Al confirmar la importación se{' '}
            <strong>reemplazará por completo</strong> la estructura, nodos y precedencias guardadas en este
            dispositivo para esta obra.
          </div>
        )}

        {preview && (
          <>
            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-grows-text-secondary">
                1 · Resumen general
              </h3>
              <ul className="grid gap-1.5 rounded-xl border border-grows-border bg-white/80 p-3 text-[13px] leading-relaxed">
                <li>
                  <strong>Proyecto:</strong> {preview.projectName}
                </li>
                <li>
                  <strong>Inicio:</strong> {preview.projectStart ?? '—'}
                </li>
                <li>
                  <strong>Fin:</strong> {preview.projectFinish ?? '—'}
                </li>
                <li>
                  <strong>Tareas leídas:</strong> {preview.tasksTotal}
                </li>
                <li>
                  <strong>Resumen / contenedores:</strong> {preview.summaryTasksTotal}
                </li>
                <li>
                  <strong>Operativas (hoja):</strong> {preview.operativeTasksTotal}
                </li>
                <li>
                  <strong>PredecessorLink en XML:</strong> {preview.predecessorsReadTotal}
                </li>
                {preview.collapsedRootUid != null && (
                  <li className="text-[12px] text-grows-text-secondary">
                    Raíz única de proyecto detectada (UID {preview.collapsedRootUid}): se usa para compactar
                    niveles y nombre de obra si hace falta.
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-grows-text-secondary">
                2 · Mapeo a Grows
              </h3>
              <ul className="grid gap-1 rounded-xl border border-grows-border bg-white/80 p-3 text-[13px] sm:grid-cols-2">
                <li>Etapas: {preview.mappingSummary.etapas}</li>
                <li>Plantas / sectores gral.: {preview.mappingSummary.plantas}</li>
                <li>Sectores internos: {preview.mappingSummary.sectores}</li>
                <li>Ambientes / áreas: {preview.mappingSummary.ambientes}</li>
                <li>Tareas operativas: {preview.mappingSummary.tareas}</li>
              </ul>
              <p className="mt-2 text-[12px] leading-snug text-grows-text-secondary">
                Regla aplicada: nivel relativo bajo el contenedor detectado → etapa, planta, sector, ambiente;
                hojas siempre como tarea. Profundidad extra en contenedores se mantiene como «ambiente» hasta
                llegar a la hoja.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-grows-text-secondary">
                3 · Árbol preview
              </h3>
              <button
                type="button"
                onClick={() => setTreeOpen((v) => !v)}
                className="mb-2 text-xs font-bold text-[#0042c8] underline-offset-2 hover:underline"
              >
                {treeOpen ? 'Ocultar' : 'Mostrar'} árbol
              </button>
              {treeOpen && (
                <pre
                  className={cn(
                    'max-h-48 overflow-auto rounded-xl border border-grows-border bg-[#f6fafe] p-3 font-mono text-[11px] leading-snug',
                  )}
                >
                  {preview.treeLines.join('\n')}
                </pre>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-grows-text-secondary">
                4 · Precedencias
              </h3>
              <ul className="rounded-xl border border-grows-border bg-white/80 p-3 text-[13px]">
                <li>Total leídas (enlaces en XML): {preview.predecessorsReadTotal}</li>
                <li className="text-emerald-800">Válidas (hojas hermanas en Grows): {preview.validPredecessors}</li>
                <li className="text-amber-900">
                  Con advertencia (resumen o distinto padre): {preview.warningPredecessors}
                </li>
                <li className="text-red-900">No resueltas (UID faltante): {preview.unresolvedPredecessors}</li>
                {edgeLabels && (
                  <li className="mt-2 border-t border-grows-border pt-2 text-[12px] text-grows-text-secondary">
                    Detalle aristas preview: {JSON.stringify(edgeLabels)}
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-grows-text-secondary">
                5 · Warnings
              </h3>
              {preview.warnings.length === 0 ? (
                <p className="rounded-xl border border-grows-border bg-white/80 p-3 text-[13px] text-emerald-900">
                  Sin advertencias de importación detectadas en esta pasada.
                </p>
              ) : (
                <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-grows-border bg-white/80 p-3 text-[12px] leading-snug">
                  {preview.warnings.map((w, i) => (
                    <li key={i} className="border-b border-grows-border/60 pb-1.5 last:border-0">
                      <span className="font-mono text-[10px] uppercase text-grows-text-secondary">{w.kind}</span>
                      {' · '}
                      {w.message}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {!preview && !parseError && (
          <p className="text-grows-text-secondary">No hay datos de previsualización.</p>
        )}
      </div>
    </ModalBase>
  );
}
