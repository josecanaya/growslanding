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
        'border-b px-4 py-2',
        stitchMode
          ? 'border-stitch-primary/10 bg-stitch-surface-container-low'
          : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex gap-2">
        {etapas.map((etapa) => (
          <button
            key={etapa.id}
            onClick={() => onEtapaChange(etapa.id)}
            className={cn(
              'flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-colors',
              'flex items-center justify-center gap-2',
              stitchMode
                ? activeEtapa === etapa.id
                  ? 'bg-stitch-primary text-white shadow-sm'
                  : 'bg-stitch-surface-container-lowest text-stitch-on-surface ring-1 ring-stitch-primary/10 hover:bg-stitch-surface-container-high/80'
                : activeEtapa === etapa.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <span className={stitchMode && activeEtapa === etapa.id ? 'font-stitch-headline' : undefined}>
              {etapa.label}
            </span>
            {etapa.count > 0 && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center',
                  stitchMode
                    ? activeEtapa === etapa.id
                      ? 'bg-white/20 text-white'
                      : 'bg-stitch-surface-container-high text-stitch-primary'
                    : activeEtapa === etapa.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600',
                )}
              >
                {etapa.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

