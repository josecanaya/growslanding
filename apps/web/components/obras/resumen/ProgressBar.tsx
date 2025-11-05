'use client';

type ProgressBarProps = {
  percent: number;
  height?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
};

export default function ProgressBar({ 
  percent, 
  height = 'md', 
  color = '#003C6E',
  showLabel = false,
  className = ''
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso</span>
          <span className="text-sm font-bold" style={{ color }}>{Math.round(percent)}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-gray-200 ${heightClasses[height]}`}>
        <div 
          className={`rounded-full transition-all duration-500 ${heightClasses[height]}`}
          style={{ 
            width: `${Math.min(100, Math.max(0, percent))}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
    </div>
  );
}

