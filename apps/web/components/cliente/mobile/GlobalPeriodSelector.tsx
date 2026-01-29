'use client';

interface GlobalPeriodSelectorProps {
  periodRange: number;
  totalSemanas: number;
  onPeriodChange: (range: number) => void;
}

export function GlobalPeriodSelector({
  periodRange,
  totalSemanas,
  onPeriodChange,
}: GlobalPeriodSelectorProps) {
  const options = [
    { value: 4, label: '4 sem' },
    { value: 8, label: '8 sem' },
    { value: 12, label: '12 sem' },
    { value: totalSemanas, label: 'Total' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-gray-700">Período de análisis</h4>
          <p className="text-[10px] text-gray-500">Afecta todos los gráficos</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => {
          const isActive = periodRange === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`
                px-2 py-2 rounded-lg text-xs font-medium transition-all
                min-h-[36px] flex items-center justify-center
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {/* Indicador de semanas mostradas */}
      <div className="mt-2 text-[10px] text-gray-500 text-center">
        {(() => {
          const inicioSlice =
            periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
          const semanaInicio = inicioSlice + 1;
          const semanaFin =
            inicioSlice + (periodRange >= totalSemanas ? totalSemanas : periodRange);
          return `Mostrando S${semanaInicio}–S${semanaFin}`;
        })()}
      </div>
    </div>
  );
}




