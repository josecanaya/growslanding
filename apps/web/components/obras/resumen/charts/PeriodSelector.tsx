'use client';

interface PeriodSelectorProps {
  rangoTemporal: number;
  totalSemanas: number;
  onPeriodChange: (periodo: number) => void;
  className?: string;
  size?: 'small' | 'normal';
}

export function PeriodSelector({
  rangoTemporal,
  totalSemanas,
  onPeriodChange,
  className = "",
  size = 'normal'
}: PeriodSelectorProps) {
  const periodos = [4, 8, 12, totalSemanas];
  // Filtrar duplicados para evitar keys duplicadas
  const periodosUnicos = Array.from(new Set(periodos));
  const isSmall = size === 'small';
  
  return (
    <div className={`flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200 ${className}`}>
      {periodosUnicos.map((semanasValue) => (
        <button
          key={`period-${semanasValue}`}
          onClick={() => onPeriodChange(semanasValue)}
          className={`
            rounded-md transition-colors font-medium
            ${isSmall 
              ? 'px-2 py-1 text-[10px]' 
              : 'px-3 py-1.5 text-xs'
            }
            ${
              rangoTemporal === semanasValue
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {semanasValue === totalSemanas ? 'Total obra' : `${semanasValue} sem`}
        </button>
      ))}
    </div>
  );
}
