'use client';

import { useMemo } from 'react';
import { useWizardStore } from './useWizardStore';

type PasoSuperficiesProps = {
  onPrev: () => void;
  onNext: () => void;
};

export default function PasoSuperficies({ onPrev, onNext }: PasoSuperficiesProps) {
  const plantas = useWizardStore((s) => s.plantas);
  const terreno = useWizardStore((s) => s.terreno);
  const superficies = useWizardStore((s) => s.superficies);
  const setField = useWizardStore((s) => s.setField);
  const setPlantas = useWizardStore((s) => s.setPlantas);
  const updatePlantaSuperficie = useWizardStore((s) => s.updatePlantaSuperficie);
  const getTotalConstruido = useWizardStore((s) => s.getTotalConstruido);

  const totalConstruido = useMemo(() => getTotalConstruido(), [superficies, getTotalConstruido]);

  const puedeContinuar = useMemo(() => plantas >= 1 && plantas <= 5, [plantas]);

  // Calcular FOS (Factor de Ocupación del Suelo)
  // FOS = (área construida en planta baja / superficie total del terreno) × 100
  const FOS = useMemo(() => {
    if (!terreno || terreno <= 0) return 0;
    const plantaBaja = superficies.find((s) => s.planta === 1);
    if (!plantaBaja) return 0;
    const areaPlantaBaja = (plantaBaja.cubiertos || 0) + (plantaBaja.descubiertos || 0);
    return (areaPlantaBaja / terreno) * 100;
  }, [terreno, superficies]);

  // Calcular FOT (Factor de Ocupación Total)
  // FOT = (superficie total construida en todas las plantas / superficie total del terreno)
  const FOT = useMemo(() => {
    if (!terreno || terreno <= 0) return 0;
    return totalConstruido / terreno;
  }, [terreno, totalConstruido]);

  // Determinar si los valores están dentro del rango permitido
  // Valores típicos: FOS < 60%, FOT < 1.2 (ajustar según normativa local)
  const FOS_VALIDO = FOS <= 60;
  const FOT_VALIDO = FOT <= 1.2;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold" style={{ color: '#003C6E' }}>
            Superficies y estructura
          </h2>
          <p className="text-sm text-gray-600">
            Definí la estructura principal y la distribución de superficies
          </p>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad de plantas</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              value={plantas}
              onChange={(e) => setPlantas(Math.min(5, Math.max(1, Number(e.target.value))))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Superficie total del terreno (m²)</label>
            <input
              type="number"
              min={0}
              value={terreno || ''}
              onChange={(e) => setField('terreno', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: 300"
            />
          </div>
        </div>

        <div className="px-5 pb-5">
          {superficies.map((p, idx) => (
            <div key={p.planta} className="mt-4 rounded-xl border border-gray-200 p-4">
              <div className="mb-3 text-sm font-semibold" style={{ color: '#003C6E' }}>
                Planta {p.planta}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">m² cubiertos</label>
                  <input
                    type="number"
                    min={0}
                    value={p.cubiertos || ''}
                    onChange={(e) =>
                      updatePlantaSuperficie(idx, 'cubiertos', Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ej: 120"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">m² descubiertos</label>
                  <input
                    type="number"
                    min={0}
                    value={p.descubiertos || ''}
                    onChange={(e) =>
                      updatePlantaSuperficie(idx, 'descubiertos', Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ej: 40"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicadores urbanísticos */}
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-4 text-base font-semibold" style={{ color: '#003C6E' }}>
              Indicadores urbanísticos
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">FOS (Factor de Ocupación del Suelo)</div>
                <div
                  className={`text-3xl font-bold ${FOS_VALIDO ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {FOS.toFixed(2)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">FOT (Factor de Ocupación Total)</div>
                <div
                  className={`text-3xl font-bold ${FOT_VALIDO ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {FOT.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              El FOS y FOT se calculan automáticamente según los datos cargados.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-center justify-center gap-3 p-5">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Atrás
          </button>
          <button
            type="button"
            disabled={!puedeContinuar}
            onClick={onNext}
            className={`rounded-lg px-6 py-2.5 font-semibold text-white transition ${
              puedeContinuar ? '' : 'opacity-60'
            }`}
            style={{ backgroundColor: '#0055A4' }}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
