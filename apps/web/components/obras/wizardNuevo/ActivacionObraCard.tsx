'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ChevronRight, MapPin } from 'lucide-react';
import { useWizardStore } from './useWizardStore';
import {
  CANVAS_PROJECT_KIND_LABEL,
  type CanvasProjectKind,
} from '@/lib/canvas/canvasProjectProfile';
import {
  PRECIO_ACTIVACION_OBRA_USD_POR_M2,
  PLANES_ACTIVACION_UI,
  calculateFee,
} from '@/lib/obras/calculateFee';

function formatoMontoUsd(valor: number): string {
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ActivacionObraCard() {
  const router = useRouter();
  const tipoObra = useWizardStore((s) => s.tipoObra);
  const direccion = useWizardStore((s) => s.direccion);
  const planPagoActivacion = useWizardStore((s) => s.planPagoActivacion);
  const setPlanPagoActivacion = useWizardStore((s) => s.setPlanPagoActivacion);
  const confirmarContinuarActivacionParaPago = useWizardStore((s) => s.confirmarContinuarActivacionParaPago);
  const activacionParaPago = useWizardStore((s) => s.activacionParaPago);
  const m2CubiertosTotales = useWizardStore((s) =>
    s.superficies.reduce((acc, sf) => acc + (sf.cubiertos || 0), 0),
  );

  const resultado = useMemo(
    () => calculateFee(m2CubiertosTotales, planPagoActivacion),
    [m2CubiertosTotales, planPagoActivacion],
  );

  const snapshotOk =
    activacionParaPago !== null &&
    activacionParaPago.m2CubiertosTotales === m2CubiertosTotales &&
    activacionParaPago.planPago === planPagoActivacion &&
    activacionParaPago.totalUsd === resultado.totalUsd;

  const puedeContinuarPago = m2CubiertosTotales > 0;

  const tipoLabel =
    tipoObra && tipoObra in CANVAS_PROJECT_KIND_LABEL
      ? CANVAS_PROJECT_KIND_LABEL[tipoObra as CanvasProjectKind]
      : tipoObra || '—';

  const resumenPlan =
    planPagoActivacion === 'contado'
      ? 'Descuento aplicado'
      : `${resultado.installmentsCount} cuotas — sin recargo`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#002b49] p-7 text-white shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-12 size-32 rounded-full bg-[#24a375]/25 blur-[48px]" />

      <div className="relative z-10">
        <h3 className="mb-8 text-2xl font-bold tracking-tight text-white">Resumen del proyecto</h3>

        <div className="flex justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Ubicación
            </p>
            <p className="truncate text-sm font-semibold leading-snug text-white/95">{direccion?.trim() || '—'}</p>
          </div>
          <MapPin className="mt-1 size-9 shrink-0 text-white/30" aria-hidden strokeWidth={1.25} />
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-white/10 py-6">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Superficie</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
              {m2CubiertosTotales.toLocaleString('es-AR')} m² cubiertos
            </p>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Tipo</p>
            <p className="text-sm font-semibold leading-snug text-white/95">{tipoLabel}</p>
          </div>
        </div>

        <div className="pt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6ee7b7]">
                Activación de obra
              </p>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Montos estimados • USD
              </p>
              {m2CubiertosTotales > 0 ? (
                <>
                  <p className="text-[2.65rem] font-extrabold leading-none tracking-tighter text-white sm:text-[2.85rem]">
                    USD {formatoMontoUsd(resultado.totalUsd)}
                  </p>
                  {resultado.installmentUsd !== null ? (
                    <p className="mt-2 text-base font-semibold text-white/85">
                      {resultado.installmentsCount} cuotas de USD {formatoMontoUsd(resultado.installmentUsd)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="max-w-md text-base font-semibold leading-snug text-white/90">
                  Completá los m² para calcular la activación.
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a7fbc9]">
                {resumenPlan}
              </span>
            </div>
          </div>

          <p className="mb-6 text-xs leading-relaxed text-white/70">
            Para comenzar a gestionar esta obra, necesitás activarla. Elegí forma de liquidación estimada —
            después podés abonar cuando integremos el checkout.
          </p>

          <fieldset className="mb-6 space-y-2.5 border-0 p-0">
            <legend className="sr-only">Forma de liquidación estimada</legend>
            {PLANES_ACTIVACION_UI.map((opcion) => {
              const marcado = planPagoActivacion === opcion.id;
              return (
                <label
                  key={opcion.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                    marcado
                      ? 'border-white/[0.42] bg-white/[0.12]'
                      : 'border-transparent bg-white/[0.05] hover:bg-white/[0.08]'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan-activacion-obra"
                    className="size-4 shrink-0 border-white/40 text-[#24a375]"
                    checked={marcado}
                    onChange={() => setPlanPagoActivacion(opcion.id)}
                  />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 text-[13px] sm:text-sm">
                    <span className="font-semibold text-white">{opcion.titulo}</span>
                    <span className="shrink-0 tabular-nums text-[11px] font-bold text-white/60 sm:text-xs">
                      {opcion.detallePct}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {m2CubiertosTotales > 0 ? (
            <div className="mb-8 space-y-2.5 text-sm text-white/75">
              <div className="flex justify-between gap-3 border-b border-white/[0.08] pb-3">
                <span>Precio por m²</span>
                <span className="font-semibold tabular-nums text-white">
                  USD {formatoMontoUsd(PRECIO_ACTIVACION_OBRA_USD_POR_M2)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/[0.08] pb-3">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums text-white">
                  USD {formatoMontoUsd(resultado.subtotalUsd)}
                </span>
              </div>
              {resultado.pctAjusteNumerico < 0 ? (
                <div className="flex justify-between gap-3 pb-3">
                  <span>Descuento (pago único)</span>
                  <span className="font-bold tabular-nums text-[#86efac]">
                    −USD {formatoMontoUsd(Math.abs(resultado.ahorroORecargoUsd))}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-bold tabular-nums text-white">
                  USD {formatoMontoUsd(resultado.totalUsd)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={!puedeContinuarPago}
              onClick={() => confirmarContinuarActivacionParaPago()}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#24a375] px-5 text-lg font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-[1.07] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
            >
              Continuar al pago
              <ChevronRight className="size-5 shrink-0" aria-hidden strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="w-full rounded-xl bg-white/[0.1] py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.16]"
              onClick={() => router.push('/cliente/obras' as Route)}
            >
              Volver a obras sin crear
            </button>
          </div>
          {!puedeContinuarPago ? (
            <p className="mt-4 text-center text-xs font-medium leading-relaxed text-amber-200/95">
              Cargá m² cubiertos en el wizard para obtener el importe de activación estimado.
            </p>
          ) : snapshotOk ? (
            <p className="mt-4 text-center text-[13px] font-semibold text-[#bbf7d0]">
              Listo para el próximo paso de cobro cuando esté disponible el checkout.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
