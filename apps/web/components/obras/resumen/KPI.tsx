'use client';

import { type LucideIcon } from 'lucide-react';
import ProgressBar from './ProgressBar';

type KPIProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  type?: 'number' | 'progress';
  progressValue?: number;
  className?: string;
};

export default function KPI({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = '#003C6E',
  type = 'number',
  progressValue,
  className = ''
}: KPIProps) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        {Icon && <Icon className="h-8 w-8" style={{ color: iconColor }} />}
        {type === 'number' && (
          <span className="text-3xl font-bold" style={{ color: '#003C6E' }}>{value}</span>
        )}
        {type === 'progress' && progressValue !== undefined && (
          <span className="text-3xl font-bold" style={{ color: '#003C6E' }}>
            {progressValue}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {type === 'progress' && progressValue !== undefined && (
        <div className="mt-3">
          <ProgressBar percent={progressValue} height="sm" color={iconColor} />
        </div>
      )}
    </div>
  );
}

