'use client';

import { useMemo, useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useWizardStore, type TipoObra } from './useWizardStore';
import { WIZARD_TIPO_OBRA_OPCIONES } from '@/lib/canvas/canvasProjectProfile';
import DireccionAutocomplete from '../wizard/DireccionAutocomplete';
import ModalMapa from '../wizard/ModalMapa';
import {
  hubSectionShell,
  hubLabel,
  hubInput,
  hubPrimaryButton,
  hubSecondaryButton,
} from './nuevaObraHubStyles';

interface PasoDatosBasicosProps {
  onNext: () => void;
}

export default function PasoDatosBasicos({ onNext }: PasoDatosBasicosProps) {
  const id = useWizardStore((s) => s.id);
  const propietario = useWizardStore((s) => s.propietario);
  const tipoObra = useWizardStore((s) => s.tipoObra);
  const direccion = useWizardStore((s) => s.direccion);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const fecha_inicio_estimada = useWizardStore((s) => s.fecha_inicio_estimada);
  const plantas = useWizardStore((s) => s.plantas);
  const superficies = useWizardStore((s) => s.superficies);
  const modoObra = useWizardStore((s) => s.modoObra);
  const setField = useWizardStore((s) => s.setField);
  const ensureId = useWizardStore((s) => s.ensureId);
  const setTipoObra = useWizardStore((s) => s.setTipoObra);
  const setPlantas = useWizardStore((s) => s.setPlantas);
  const updatePlantaSuperficie = useWizardStore((s) => s.updatePlantaSuperficie);

  const m2CubiertosPlanta1 = superficies.find((s) => s.planta === 1)?.cubiertos || 0;

  useEffect(() => {
    ensureId();
  }, [ensureId]);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [otroDetalle, setOtroDetalle] = useState('');

  const puedeContinuar = useMemo(() => {
    const dir = (direccion ?? '').trim();
    const prop = (propietario ?? '').trim();
    const fechaValida =
      !!fecha_inicio_estimada && fecha_inicio_estimada >= new Date().toISOString().split('T')[0];
    const otroOk = tipoObra !== 'otro' || (otroDetalle?.trim().length ?? 0) >= 2;
    return dir.length > 3 && prop.length > 2 && !!tipoObra && fechaValida && otroOk;
  }, [direccion, propietario, tipoObra, fecha_inicio_estimada, otroDetalle]);

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

            <div className="flex flex-col gap-1.5">
              <label className={hubLabel()}>
                Fecha de inicio estimada <span className="font-bold text-[#ba1a1a]">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={fecha_inicio_estimada ?? ''}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = new Date().toISOString().split('T')[0];
                  if (selectedDate && selectedDate < today) {
                    return;
                  }
                  setField('fecha_inicio_estimada', selectedDate || undefined);
                }}
                className={hubInput()}
              />
              {!fecha_inicio_estimada ? (
                <p className="text-xs text-[#42474d]">Obligatoria. Solo fechas desde hoy en adelante.</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className={hubLabel()}>Tipo de obra</label>
            <div className="flex flex-wrap gap-2">
              {WIZARD_TIPO_OBRA_OPCIONES.map((opt) => {
                const active = tipoObra === opt.kind;
                return (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() => {
                      setTipoObra(opt.kind as TipoObra);
                      if (opt.kind !== 'otro') setOtroDetalle('');
                    }}
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

            {tipoObra === 'otro' ? (
              <input
                placeholder="Describí el tipo de obra"
                value={otroDetalle}
                onChange={(e) => setOtroDetalle(e.target.value)}
                className={hubInput()}
              />
            ) : null}
          </div>

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
              <label className={hubLabel()}>Metros cubiertos (plantas baja / resumen rápido)</label>
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

          {modoObra === 'ESTRUCTURADA' ? (
            <div className="flex gap-3 rounded-xl border border-[#cfe5ff]/80 bg-[#f6fafe] p-4">
              <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#002b49]" />
              <p className="text-sm font-medium text-[#274969]">
                Activamos herramientas avanzadas por el tamaño/tipo de obra.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#eaeef2] pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={!puedeContinuar}
              onClick={onNext}
              className={`${hubPrimaryButton()} w-full px-12 sm:w-auto`}
              data-onboarding="crear-obra"
            >
              Siguiente
            </button>
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
