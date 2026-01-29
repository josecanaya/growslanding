'use client';

interface PeriodSelectorGlobalProps {
  periodRange: number;
  totalSemanas: number;
  onPeriodChange: (range: number) => void;
}

export function PeriodSelectorGlobal({
  periodRange,
  totalSemanas,
  onPeriodChange,
}: PeriodSelectorGlobalProps) {
  const options = [
    { value: 4, label: '4 sem' },
    { value: 8, label: '8 sem' },
    { value: 12, label: '12 sem' },
    { value: totalSemanas, label: 'Total' },
  ];

  // Calcular semanas mostradas
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const semanaInicio = inicioSlice + 1;
  const semanaFin = inicioSlice + (periodRange >= totalSemanas ? totalSemanas : periodRange);

  return (
    <div className="space-y-2">
      {/* Segmented control */}
      <div className="relative bg-gray-100 rounded-xl p-1 flex">
        {options.map((option) => {
          const isActive = periodRange === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`
                flex-1 h-9 px-3 rounded-lg text-xs font-medium transition-all relative z-10
                ${isActive
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {option.label}
              {/* Pill animado */}
              {isActive && (
                <div className="absolute inset-0 bg-white shadow-sm rounded-lg z-[-1] transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Indicador de semanas */}
      <div className="text-[11px] text-gray-500 text-center mt-2">
        Mostrando S{semanaInicio}–S{semanaFin}
      </div>
    </div>
  );
}

