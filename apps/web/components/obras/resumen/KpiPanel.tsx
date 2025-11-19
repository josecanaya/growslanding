'use client';

import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useObraStore } from './useObraStore';

type CategoriaResumen = {
  nombre: string;
  porcentaje: number;
  elementos: number;
};

type KpiPanelProps = {
  global: {
    metrosTotales: number;
    metrosCubiertos: number;
    metrosDescubiertos: number;
    progreso: number;
    tareasActivas: number;
    tareasCompletadas: number;
    totalElementos: number;
    categorias: CategoriaResumen[];
  };
};

export function KpiPanel({ global }: KpiPanelProps) {
  const pisos = useObraStore((state) => state.pisos);
  const pisoId = useObraStore((state) => state.pisoId);

  const pisoSeleccionado = useMemo(
    () => pisos.find((piso) => piso.id === pisoId),
    [pisos, pisoId],
  );

  const metrosTotales = pisoSeleccionado?.metrosTotales ?? global.metrosTotales;
  const metrosCubiertos = pisoSeleccionado?.metrosCubiertos ?? global.metrosCubiertos;
  const metrosDescubiertos = pisoSeleccionado?.metrosDescubiertos ?? global.metrosDescubiertos;
  const progreso = pisoSeleccionado?.porcentaje ?? global.progreso;
  const elementos = pisoSeleccionado?.elementos ?? global.totalElementos;

  const categorias = (pisoSeleccionado?.categorias ?? global.categorias).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-onboarding="estadisticas-metros">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Metros totales</p>
          <p className="text-2xl font-semibold text-slate-800">{metrosTotales} m²</p>
          {pisoSeleccionado && (
            <p className="mt-1 text-[11px] text-slate-500">
              Piso seleccionado: <span className="font-medium">{pisoSeleccionado.nombre}</span>
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Cubiertos</p>
          <p className="text-2xl font-semibold text-[#0052CC]">{metrosCubiertos} m²</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Descubiertos</p>
          <p className="text-2xl font-semibold text-[#22C55E]">{metrosDescubiertos} m²</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Avance del piso</h3>
              <p className="text-xs text-slate-500">
                Seguimiento del progreso {pisoSeleccionado ? `de ${pisoSeleccionado.nombre}` : 'total'}
              </p>
            </div>
            <span className="text-lg font-semibold text-[#0052CC]">
              {Math.round(progreso)}%
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-[#0052CC]"
              style={{ width: `${Math.min(100, Math.round(progreso))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 text-xs text-slate-500">
            <span>{global.tareasActivas} tareas activas</span>
            <span>{global.tareasCompletadas} completadas</span>
            <span>{elementos} elementos</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0052CC]" />
            <h3 className="text-sm font-semibold text-slate-700">Categorías destacadas</h3>
          </div>
          <div className="mt-4 space-y-3">
            {categorias.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Todavía no hay categorías con elementos cargados.
              </p>
            ) : (
              categorias.map((cat) => (
                <div
                  key={cat.nombre}
                  className="flex items-center justify-between rounded-xl border border-blue-100/80 bg-blue-50/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{cat.nombre}</p>
                    <p className="text-xs text-slate-500">{cat.elementos} elementos</p>
                  </div>
                  <span className="text-sm font-semibold text-[#0052CC]">
                    {Math.round(cat.porcentaje)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

