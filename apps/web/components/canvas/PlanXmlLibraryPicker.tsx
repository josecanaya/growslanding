'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  WIZARD_OBRA_PRODUCT_OPCIONES,
  isObraProductKind,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import { filterCanvasXmlLibrary, listCanvasXmlLibrary } from '@/lib/canvas/canvasXmlLibrary';
import type { TrabajoSimpleDetalle } from '@/lib/canvas/canvasXmlLibraryFilters';
import { CanvasXmlLibraryList } from '@/components/cliente/canvas-editor/CanvasXmlLibraryList';

type Props = {
  defaultObraProductKind?: string | null;
  onApplySlug: (slug: string) => void;
  applyingSlug?: string | null;
  /** Texto corto bajo el título (opcional). */
  hint?: string;
  /**
   * Si hay exactamente un plan filtrado, lo aplica solo (mismo comportamiento del canvas).
   * Desactivá en embeds donde el usuario debe confirmar.
   */
  autoApplySingle?: boolean;
};

/**
 * Mismo picker de la librería XML que usa el canvas (tipo de obra → filtro → plan).
 * Compartido entre CanvasPlanWizardModal y Obra Check.
 */
export function PlanXmlLibraryPicker({
  defaultObraProductKind,
  onApplySlug,
  applyingSlug,
  hint = 'Las preguntas filtran la librería. Al tocar un plan se cargan las tareas del XML (con precedencias).',
  autoApplySingle = false,
}: Props) {
  const initialKind = isObraProductKind(defaultObraProductKind ?? '')
    ? (defaultObraProductKind as ObraProductKind)
    : 'trabajo_simple';

  const [kind, setKind] = useState<ObraProductKind>(initialKind);
  const [detalle, setDetalle] = useState<TrabajoSimpleDetalle>('otro');
  const library = useMemo(() => listCanvasXmlLibrary(), []);

  const filtered = useMemo(
    () =>
      filterCanvasXmlLibrary(library, {
        obraProductKind: kind,
        trabajoSimpleDetalle: kind === 'trabajo_simple' ? detalle : undefined,
      }),
    [library, kind, detalle],
  );

  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoApplySingle) return;
    if (applyingSlug || filtered.length !== 1) return;
    const slug = filtered[0]!.slug;
    if (autoAppliedRef.current === slug) return;
    autoAppliedRef.current = slug;
    onApplySlug(slug);
  }, [autoApplySingle, applyingSlug, filtered, onApplySlug]);

  return (
    <div className="space-y-5">
      {hint ? <p className="text-xs text-[#64748b]">{hint}</p> : null}

      <div>
        <p className="text-sm font-semibold text-[#001629]">Tipo de obra</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WIZARD_OBRA_PRODUCT_OPCIONES.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => {
                setKind(opt.kind);
                autoAppliedRef.current = null;
              }}
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
          <p className="text-sm font-semibold text-[#001629]">Intervención</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ['porton', 'Colocar portón'],
                ['puerta', 'Puerta interior'],
                ['otro', 'Ver todos los trabajos simples'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDetalle(id);
                  autoAppliedRef.current = null;
                }}
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
      ) : null}

      <div>
        <p className="mb-3 text-sm font-semibold text-[#001629]">
          Planes disponibles ({filtered.length})
        </p>
        {autoApplySingle && filtered.length === 1 && !applyingSlug ? (
          <p className="mb-2 text-xs text-[#64748b]">Un solo resultado: se carga automáticamente…</p>
        ) : null}
        <CanvasXmlLibraryList
          entries={filtered}
          applyingSlug={applyingSlug}
          onSelect={onApplySlug}
        />
      </div>
    </div>
  );
}
