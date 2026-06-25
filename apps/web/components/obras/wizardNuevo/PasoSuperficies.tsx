'use client';

import { useMemo } from 'react';
import { Ruler } from 'lucide-react';
import { useWizardStore } from './useWizardStore';
import {
  hubSectionShell,
  hubLabel,
  hubInput,
  hubPrimaryButton,
  hubSecondaryButton,
} from './nuevaObraHubStyles';
import { useCrearObraFromWizard } from '@/lib/hooks/useCrearObraFromWizard';

type PasoSuperficiesProps = {
  onPrev: () => void;
  onFinish: () => void;
};

export default function PasoSuperficies({ onPrev, onFinish }: PasoSuperficiesProps) {
  const { crear, isSaving, error, setError } = useCrearObraFromWizard();
  const plantas = useWizardStore((s) => s.plantas);
  const terreno = useWizardStore((s) => s.terreno);
  const superficies = useWizardStore((s) => s.superficies);
  const setField = useWizardStore((s) => s.setField);
  const setPlantas = useWizardStore((s) => s.setPlantas);
  const updatePlantaSuperficie = useWizardStore((s) => s.updatePlantaSuperficie);
  const getTotalConstruido = useWizardStore((s) => s.getTotalConstruido);

  const totalConstruido = useMemo(() => getTotalConstruido(), [superficies, getTotalConstruido]);
  const puedeContinuar = useMemo(() => plantas >= 1 && plantas <= 5, [plantas]);

  const FOS = useMemo(() => {
    if (!terreno || terreno <= 0) return 0;
    const plantaBaja = superficies.find((s) => s.planta === 1);
    if (!plantaBaja) return 0;
    const areaPlantaBaja = (plantaBaja.cubiertos || 0) + (plantaBaja.descubiertos || 0);
    return (areaPlantaBaja / terreno) * 100;
  }, [terreno, superficies]);

  const FOT = useMemo(() => {
    if (!terreno || terreno <= 0) return 0;
    return totalConstruido / terreno;
  }, [terreno, totalConstruido]);

  const FOS_VALIDO = FOS <= 60;
  const FOT_VALIDO = FOT <= 1.2;

  return (
    <section className={hubSectionShell()}>
      <div className="mb-8 flex items-center gap-3">
        <Ruler className="h-6 w-6 flex-shrink-0 text-[#001629]" strokeWidth={1.75} />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#001629]">Superficie y plantas</h2>
          <p className="mt-0.5 text-sm text-[#42474d]">Terreno, cubiertos y descubiertos por nivel</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={hubLabel()}>Superficie total del terreno</label>
            <div className="flex items-center overflow-hidden rounded-lg bg-[#f0f4f8] ring-2 ring-transparent focus-within:ring-[#24a375]">
              <input
                type="number"
                min={0}
                value={terreno || ''}
                placeholder="Ej. 300"
                onChange={(e) => setField('terreno', Number(e.target.value))}
                className="min-h-[48px] w-full flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <span className="pr-4 text-sm font-medium text-[#42474d]">m²</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={hubLabel()}>Cantidad de plantas</label>
            <select
              className={`${hubInput()} appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2342474d' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              }}
              value={plantas}
              onChange={(e) => setPlantas(Math.min(5, Math.max(1, Number(e.target.value))))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'planta' : 'plantas'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {superficies.map((p, idx) => (
            <div key={p.planta} className="rounded-xl border border-[#dfe3e7] bg-[#f6fafc] px-5 py-4">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#002b49]">
                Planta {p.planta}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={hubLabel()}>Cubiertos</label>
                  <input
                    type="number"
                    min={0}
                    value={p.cubiertos || ''}
                    onChange={(e) =>
                      updatePlantaSuperficie(idx, 'cubiertos', Number(e.target.value))
                    }
                    className={hubInput()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={hubLabel()}>Descubiertos</label>
                  <input
                    type="number"
                    min={0}
                    value={p.descubiertos || ''}
                    onChange={(e) =>
                      updatePlantaSuperficie(idx, 'descubiertos', Number(e.target.value))
                    }
                    className={hubInput()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-[#c3c7ce] bg-[#f6fafe] p-6 text-center opacity-95">
          <p className="text-sm font-semibold text-[#001629]">Planos preliminares</p>
          <p className="mt-1 text-xs text-[#42474d]">Opcional • PDF o DWG (próximamente)</p>
        </div>

        <div className="rounded-xl border border-[#dfe3e7] bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-[#001629]">Indicadores urbanísticos</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#42474d]">FOS</p>
              <p className={`mt-1 text-3xl font-extrabold ${FOS_VALIDO ? 'text-[#146c43]' : 'text-[#b45309]'}`}>
                {FOS.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#42474d]">FOT</p>
              <p className={`mt-1 text-3xl font-extrabold ${FOT_VALIDO ? 'text-[#146c43]' : 'text-[#b45309]'}`}>
                {FOT.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[#596574]">
            Se calculan en vivo con los datos cargados arriba.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-[#eaeef2] pt-8 sm:flex-row sm:justify-between">
          <button type="button" onClick={onPrev} className={`${hubSecondaryButton()} w-full sm:w-auto`}>
            Atrás
          </button>
          <button
            type="button"
            disabled={!puedeContinuar || isSaving}
            onClick={() => {
              setError(null);
              void crear();
            }}
            className={`${hubPrimaryButton()} w-full px-12 sm:w-auto`}
          >
            {isSaving ? 'Creando…' : 'Crear obra y abrir canvas'}
          </button>
        </div>
      </div>
    </section>
  );
}
