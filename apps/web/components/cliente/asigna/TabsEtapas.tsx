'use client';

import { cn } from '@/lib/utils';

const STAGE_DEFINITIONS = [
  {
    key: 'estructura' as const,
    label: 'Estructura',
    description: 'Fundaciones, columnas y vigas principales.',
  },
  {
    key: 'obra gris' as const,
    label: 'Obra Gris',
    description: 'Mampostería, instalaciones y cerramientos.',
  },
  {
    key: 'terminaciones' as const,
    label: 'Terminaciones',
    description: 'Acabados finales, pintura y carpinterías.',
  },
] as const;

export type StageKey = (typeof STAGE_DEFINITIONS)[number]['key'];

interface TabsEtapasProps {
  etapaActiva: StageKey;
  onEtapaChange: (etapa: StageKey) => void;
  conteos: {
    estructura: number;
    obraGris: number;
    terminaciones: number;
  };
}

export function TabsEtapas({ etapaActiva, onEtapaChange, conteos }: TabsEtapasProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAGE_DEFINITIONS.map((definition) => {
        const count = conteos[definition.key === 'obra gris' ? 'obraGris' : definition.key as 'estructura' | 'terminaciones'];
        const isActive = etapaActiva === definition.key;

        return (
          <button
            key={definition.key}
            onClick={() => onEtapaChange(definition.key)}
            className={cn(
              'flex min-w-[160px] flex-1 items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-all',
              isActive
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
            )}
          >
            <div>
              <p className="text-sm font-semibold">{definition.label}</p>
              <p className="text-xs text-slate-500">{definition.description}</p>
            </div>
            <span className="ml-3 text-base font-semibold">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

