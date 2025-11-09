'use client';

import { useObraStore } from './useObraStore';

type FloorSelectorProps = {
  onSelect?: (pisoId: string) => void;
};

export function FloorSelector({ onSelect }: FloorSelectorProps) {
  const pisos = useObraStore((state) => state.pisos);
  const pisoId = useObraStore((state) => state.pisoId);
  const setPiso = useObraStore((state) => state.setPiso);

  if (pisos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Aún no hay plantas registradas para esta obra.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pisos.map((piso) => {
        const isActive = piso.id === pisoId;
        return (
          <button
            key={piso.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              setPiso(piso.id);
              onSelect?.(piso.id);
            }}
            className={[
              'group flex w-full flex-col rounded-2xl border p-4 text-left transition',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052CC]',
              isActive
                ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-[0_4px_18px_rgba(0,82,204,0.12)]'
                : 'border-slate-200 bg-white hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{piso.nombre}</p>
                <p className="text-xs text-slate-500">{piso.metrosTotales} m² totales</p>
              </div>
              <span className="rounded-full bg-[#0052CC]/10 px-3 py-1 text-xs font-semibold text-[#0052CC]">
                {Math.round(piso.porcentaje)}%
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-2 rounded-full bg-[#0052CC] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(piso.porcentaje))}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Cubiertos:{' '}
                <span className="font-semibold text-[#0052CC]">{piso.metrosCubiertos} m²</span>
              </span>
              <span>
                Elementos:{' '}
                <span className="font-semibold text-[#0052CC]">{piso.elementos}</span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

