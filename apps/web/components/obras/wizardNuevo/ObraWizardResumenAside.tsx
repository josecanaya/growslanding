'use client';

import { useWizardStore } from './useWizardStore';
import {
  OBRA_PRODUCT_KIND_LABEL,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';

/** Resumen lateral del wizard (sin fee de activación). */
export function ObraWizardResumenAside() {
  const obraProductKind = useWizardStore((s) => s.obraProductKind);
  const canvasTemplateSlug = useWizardStore((s) => s.canvasTemplateSlug);
  const canvasTemplateNombre = useWizardStore((s) => s.canvasTemplateNombre);
  const direccion = useWizardStore((s) => s.direccion);
  const propietario = useWizardStore((s) => s.propietario);
  const m2Estimados = useWizardStore((s) => s.m2Estimados);

  const tipoLabel =
    obraProductKind && obraProductKind in OBRA_PRODUCT_KIND_LABEL
      ? OBRA_PRODUCT_KIND_LABEL[obraProductKind as ObraProductKind]
      : '—';

  return (
    <div className="rounded-3xl border border-[#dfe3e7] bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-[#001629]">Tu obra</h3>
      <dl className="space-y-3 text-sm text-[#42474d]">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#596574]">Tipo</dt>
          <dd className="mt-0.5 font-semibold text-[#001629]">{tipoLabel}</dd>
        </div>
        {canvasTemplateNombre ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#596574]">
              Template canvas
            </dt>
            <dd className="mt-0.5 font-semibold text-[#001629]">{canvasTemplateNombre}</dd>
            {canvasTemplateSlug ? (
              <dd className="text-xs text-[#596574]">{canvasTemplateSlug}</dd>
            ) : null}
          </div>
        ) : null}
        {m2Estimados > 0 ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#596574]">m² estimados</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-[#001629]">{m2Estimados}</dd>
          </div>
        ) : null}
        {propietario?.trim() ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#596574]">Propietario</dt>
            <dd className="mt-0.5 font-medium text-[#171c1f]">{propietario}</dd>
          </div>
        ) : null}
        {direccion?.trim() ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#596574]">Dirección</dt>
            <dd className="mt-0.5 font-medium text-[#171c1f]">{direccion}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-5 text-xs leading-relaxed text-[#596574]">
        GROWS es gratis para crear la obra y armar el canvas. La comisión aplica solo cuando validás
        trabajo ejecutado.
      </p>
    </div>
  );
}
