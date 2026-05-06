'use client';

import { cn } from '@/lib/utils';

type EtapaType = 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES';

interface EtapasButtonsProps {
  activeEtapa: EtapaType;
  onEtapaChange: (etapa: EtapaType) => void;
  counts: {
    estructura: number;
    obraGris: number;
    terminaciones: number;
  };
  /** UI alineada a tokens `stitch` (reforma/stitch_socio) */
  stitchMode?: boolean;
}

export function EtapasButtons({
  activeEtapa,
  onEtapaChange,
  counts,
  stitchMode = false,
}: EtapasButtonsProps) {
  const etapas: Array<{ id: EtapaType; label: string; count: number }> = [
    { id: 'ESTRUCTURA', label: 'Estructura', count: counts.estructura },
    { id: 'OBRA_GRIS', label: 'Obra Gris', count: counts.obraGris },
    { id: 'TERMINACIONES', label: 'Terminaciones', count: counts.terminaciones },
  ];

  return (
    <div
      className={cn(
        'px-4 py-3',
        stitchMode ? 'bg-[#f7f9fb]' : 'border-b border-slate-200 bg-white',
      )}
    >
      <p
        className={cn(
          'mb-2 text-[10px] font-bold uppercase tracking-widest',
          stitchMode ? 'text-[#43617c]' : 'text-slate-500',
        )}
      >
        Paquete / etapa
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {etapas.map((etapa) => (
          <button
            key={etapa.id}
            type="button"
            onClick={() => onEtapaChange(etapa.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
              stitchMode
                ? activeEtapa === etapa.id
                  ? 'bg-[#163274] text-white shadow-sm'
                  : 'bg-white text-[#434653] shadow-sm ring-1 ring-[#163274]/10 hover:bg-[#eceef0]'
                : activeEtapa === etapa.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <span className={stitchMode && activeEtapa === etapa.id ? 'font-stitch-headline' : undefined}>
              {etapa.label}
            </span>
            {etapa.count > 0 ? (
              <span
                className={cn(
                  'min-w-[1.25rem] rounded-full px-1.5 py-0 text-[10px] font-bold tabular-nums',
                  stitchMode
                    ? activeEtapa === etapa.id
                      ? 'bg-white/25 text-white'
                      : 'bg-[#d8e2ff]/80 text-[#163274]'
                    : activeEtapa === etapa.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600',
                )}
              >
                {etapa.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

