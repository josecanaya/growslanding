'use client';

import { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  WIZARD_OBRA_PRODUCT_OPCIONES,
  isObraProductKind,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import {
  resolveTemplateSlugFromPlanWizard,
  type TrabajoSimpleDetalle,
} from '@/lib/canvas/resolvePlanFromAnswers';
import { getOfficialTemplateBySlug } from '@/lib/canvas/officialCanvasTemplates';

type Props = {
  open: boolean;
  onClose: () => void;
  defaultObraProductKind?: string | null;
  onApplySlug: (slug: string) => void;
  applying?: boolean;
};

export function CanvasPlanWizardModal({
  open,
  onClose,
  defaultObraProductKind,
  onApplySlug,
  applying,
}: Props) {
  const initialKind = isObraProductKind(defaultObraProductKind ?? '')
    ? defaultObraProductKind
    : 'trabajo_simple';

  const [kind, setKind] = useState<ObraProductKind>(initialKind as ObraProductKind);
  const [detalle, setDetalle] = useState<TrabajoSimpleDetalle>('otro');

  const previewSlug = useMemo(
    () =>
      resolveTemplateSlugFromPlanWizard({
        obraProductKind: kind,
        trabajoSimpleDetalle: kind === 'trabajo_simple' ? detalle : undefined,
      }),
    [kind, detalle],
  );

  const preview = getOfficialTemplateBySlug(previewSlug);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="plan-wizard-title"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#24a375]" />
            <h2 id="plan-wizard-title" className="text-lg font-bold text-[#001629]">
              Armar plan inicial
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f1f5f9]" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-[#001629]">1. ¿Qué tipo de obra es?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WIZARD_OBRA_PRODUCT_OPCIONES.map((opt) => (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setKind(opt.kind)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    kind === opt.kind
                      ? 'border-[#002b49] bg-[#002b49] text-white'
                      : 'border-[#cbd5e1] bg-white text-[#334155] hover:border-[#94a3b8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {kind === 'trabajo_simple' ? (
            <div>
              <p className="text-sm font-semibold text-[#001629]">2. ¿Qué intervención es?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ['porton', 'Colocar portón'],
                    ['puerta', 'Puerta interior'],
                    ['otro', 'Otro trabajo acotado'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDetalle(id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      detalle === id
                        ? 'border-[#24a375] bg-[#ecfdf5] font-semibold text-[#065f46]'
                        : 'border-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">
              Usamos el plan base de la librería para este tipo. Después podés sumar packs o editar tareas en el
              canvas.
            </p>
          )}

          {preview ? (
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Vista previa</p>
              <p className="mt-1 font-semibold text-[#001629]">{preview.nombre}</p>
              {preview.descripcion ? (
                <p className="mt-1 text-xs text-[#64748b]">{preview.descripcion}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-[#475569]">{preview.tareas.length} tareas en secuencia</p>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-[#e2e8f0] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#cbd5e1] py-2.5 text-sm font-semibold text-[#334155]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={applying || !previewSlug}
            onClick={() => onApplySlug(previewSlug)}
            className="flex-1 rounded-lg bg-[#002b49] py-2.5 text-sm font-semibold text-white hover:bg-[#02446f] disabled:opacity-50"
          >
            {applying ? 'Generando…' : 'Generar plan en el canvas'}
          </button>
        </div>
      </div>
    </div>
  );
}
