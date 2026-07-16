'use client';

import { Sparkles, X } from 'lucide-react';
import { PlanXmlLibraryPicker } from '@/components/canvas/PlanXmlLibraryPicker';

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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <PlanXmlLibraryPicker
            defaultObraProductKind={defaultObraProductKind}
            onApplySlug={onApplySlug}
            applyingSlug={applyingSlug}
            autoApplySingle
            title="Buscar en librería"
            hint="Filtrá por m², pisos, ambientes… Al tocar un plan se importa al canvas igual que un XML de Archivo."
          />
        </div>
      </div>
    </div>
  );
}
