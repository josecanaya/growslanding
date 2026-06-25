'use client';

import { useMemo, useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useWizardStore } from './useWizardStore';
import { WIZARD_OBRA_PRODUCT_OPCIONES } from '@/lib/canvas/obraProductKind';
import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import DireccionAutocomplete from '../wizard/DireccionAutocomplete';
import ModalMapa from '../wizard/ModalMapa';
import {
  hubSectionShell,
  hubLabel,
  hubInput,
  hubPrimaryButton,
  hubSecondaryButton,
} from './nuevaObraHubStyles';

import { isLightObraProductKind } from '@/lib/canvas/obraProductKind';
import { useCrearObraFromWizard } from '@/lib/hooks/useCrearObraFromWizard';

interface PasoDatosBasicosProps {
  onNext?: () => void;
  isLight?: boolean;
  onFinish: () => void;
}

export default function PasoDatosBasicos({ onNext, isLight = false, onFinish }: PasoDatosBasicosProps) {
  const id = useWizardStore((s) => s.id);
  const propietario = useWizardStore((s) => s.propietario);
  const obraProductKind = useWizardStore((s) => s.obraProductKind);
  const light = isLight || isLightObraProductKind(obraProductKind);
  const { crear, isSaving, error, setError } = useCrearObraFromWizard();
  const direccion = useWizardStore((s) => s.direccion);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const plantas = useWizardStore((s) => s.plantas);
  const superficies = useWizardStore((s) => s.superficies);
  const modoObra = useWizardStore((s) => s.modoObra);
  const setField = useWizardStore((s) => s.setField);
  const ensureId = useWizardStore((s) => s.ensureId);
  const setObraProductKind = useWizardStore((s) => s.setObraProductKind);
  const setPlantas = useWizardStore((s) => s.setPlantas);
  const updatePlantaSuperficie = useWizardStore((s) => s.updatePlantaSuperficie);

  const m2CubiertosPlanta1 = superficies.find((s) => s.planta === 1)?.cubiertos || 0;

  useEffect(() => {
    ensureId();
  }, [ensureId]);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const puedeContinuar = useMemo(() => {
    const dir = (direccion ?? '').trim();
    const prop = (propietario ?? '').trim();
    if (!obraProductKind) return false;
    if (light) {
      return prop.length >= 2 || dir.length >= 2;
    }
    return dir.length > 3 && prop.length > 2;
  }, [direccion, propietario, obraProductKind, light]);

  const handleDireccionChange = (value: { direccion: string; lat?: number; lng?: number }) => {
    setField('direccion', value.direccion);
    if (typeof value.lat === 'number') {
      setField('latitud', value.lat);
    }
    if (typeof value.lng === 'number') {
      setField('longitud', value.lng);
    }
  };

  const handleConfirmarMapa = (value: { direccion: string; lat: number; lng: number }) => {
    setField('direccion', value.direccion);
    setField('latitud', value.lat);
    setField('longitud', value.lng);
    setIsMapModalOpen(false);
  };

  return (
    <>
      <section className={hubSectionShell()}>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 flex-shrink-0 text-[#001629]" strokeWidth={1.75} />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#001629] md:text-xl">
                Datos del proyecto
              </h2>
              <p className="mt-0.5 text-sm text-[#42474d]">Ubicación, propiedad y clasificación inicial</p>
            </div>
          </div>
          {id ? (
            <span className="rounded-full bg-[#d7e4f5] px-3 py-1 text-xs font-bold text-[#002b49]">
              #{id}
            </span>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={hubLabel()}>Dirección de obra</label>
              <DireccionAutocomplete
                value={direccion ?? ''}
                onChange={handleDireccionChange}
                placeholder="Ej. Av. Libertador 1200, CABA"
                className={hubInput()}
              />
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className={`${hubSecondaryButton()} mt-2 w-full md:mt-3 md:inline-flex md:w-auto`}
              >
                Seleccionar en mapa
              </button>
              {latitud !== undefined && longitud !== undefined ? (
                <div className="mt-3 rounded-xl border border-[#24a375]/25 bg-emerald-50/80 px-4 py-3 text-xs leading-relaxed text-[#065f46]">
                  <span className="font-semibold">Coordenadas</span>{' '}
                  {latitud.toFixed(6)}, {longitud.toFixed(6)}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={hubLabel()}>Propietario</label>
              <input
                value={propietario ?? ''}
                onChange={(e) => setField('propietario', e.target.value)}
                placeholder="Nombre completo"
                className={hubInput()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className={hubLabel()}>Tipo de obra</label>
            <div className="flex flex-wrap gap-2">
              {WIZARD_OBRA_PRODUCT_OPCIONES.map((opt) => {
                const active = obraProductKind === opt.kind;
                return (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() => setObraProductKind(opt.kind as ObraProductKind)}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
                      active
                        ? 'bg-[#002b49] text-white shadow-sm'
                        : 'bg-[#d7e4f5] text-[#596574] hover:bg-[#c9d9ec]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!light ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={hubLabel()}>Cantidad de plantas</label>
              <select
                className={`${hubInput()} appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2342474d' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                }}
                value={plantas}
                onChange={(e) => setPlantas(Number(e.target.value) || 1)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'planta' : 'plantas'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={hubLabel()}>m² estimados</label>
              <div className="flex items-center overflow-hidden rounded-lg bg-[#f0f4f8] ring-2 ring-transparent focus-within:ring-[#24a375]">
                <input
                  type="number"
                  min={0}
                  value={m2CubiertosPlanta1 || ''}
                  placeholder="0.00"
                  onChange={(e) => {
                    const planta1Index = superficies.findIndex((s) => s.planta === 1);
                    if (planta1Index >= 0) {
                      updatePlantaSuperficie(planta1Index, 'cubiertos', Number(e.target.value) || 0);
                    }
                  }}
                  className="min-h-[48px] w-full flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <span className="pr-4 text-sm font-medium text-[#42474d]">m²</span>
              </div>
              <p className="text-xs text-[#42474d]">
                Podés afinar todas las plantas en el siguiente paso.
              </p>
            </div>
          </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#eaeef2] pt-8 sm:flex-row sm:justify-end">
            {light ? (
              <button
                type="button"
                disabled={!puedeContinuar || isSaving}
                onClick={() => {
                  setError(null);
                  void crear();
                }}
                className={`${hubPrimaryButton()} w-full px-12 sm:w-auto`}
                data-onboarding="crear-obra"
              >
                {isSaving ? 'Creando…' : 'Crear obra y abrir canvas'}
              </button>
            ) : (
              <button
                type="button"
                disabled={!puedeContinuar}
                onClick={onNext}
                className={`${hubPrimaryButton()} w-full px-12 sm:w-auto`}
                data-onboarding="crear-obra"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </section>

      <ModalMapa
        open={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialDireccion={direccion ?? ''}
        initialLat={latitud}
        initialLng={longitud}
        onConfirm={handleConfirmarMapa}
      />
    </>
  );
}
