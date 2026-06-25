'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  WIZARD_OBRA_PRODUCT_OPCIONES,
  isObraProductKind,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import { filterCanvasXmlLibrary, listCanvasXmlLibrary } from '@/lib/canvas/canvasXmlLibrary';
import type { TrabajoSimpleDetalle } from '@/lib/canvas/canvasXmlLibraryFilters';
import { CanvasXmlLibraryList } from './CanvasXmlLibraryList';

type Props = {
  open: boolean;
  onClose: () => void;
  defaultObraProductKind?: string | null;
  onApplySlug: (slug: string) => void;
  applyingSlug?: string | null;
};

export function CanvasPlanWizardModal({
  open,
  onClose,
  defaultObraProductKind,
  onApplySlug,
  applyingSlug,
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
    if (!open) {
      autoAppliedRef.current = null;
      return;
    }
    if (applyingSlug || filtered.length !== 1) return;
    const slug = filtered[0]!.slug;
    if (autoAppliedRef.current === slug) return;
    autoAppliedRef.current = slug;
    onApplySlug(slug);
  }, [open, applyingSlug, filtered, onApplySlug]);

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
              Elegir plan desde la librería XML
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f1f5f9]" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="border-b border-[#f1f5f9] px-5 py-2 text-xs text-[#64748b]">
          Las preguntas filtran la librería. Al tocar un plan se importa al canvas igual que un XML de Archivo.
        </p>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
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
            {filtered.length === 1 && !applyingSlug ? (
              <p className="mb-2 text-xs text-[#64748b]">Un solo resultado: se carga automáticamente al canvas…</p>
            ) : null}
            <CanvasXmlLibraryList
              entries={filtered}
              applyingSlug={applyingSlug}
              onSelect={onApplySlug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
