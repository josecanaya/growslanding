'use client';

import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface BaseCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BaseCard({
  title,
  subtitle,
  icon,
  footer,
  onClick,
  children,
  className,
  style,
}: BaseCardProps) {
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-grows-surface border border-grows-border rounded-grows-lg shadow-grows-sm hover:shadow-grows-md p-4 md:p-6 transition-all duration-200 hover:-translate-y-0.5 animate-fade-in',
        clickableClasses,
        className,
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {(title || icon) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon ? <div className="text-growsBlueLight">{icon}</div> : null}
            {title ? (
              <h3 className="text-growsBlue font-semibold text-lg">{title}</h3>
            ) : null}
          </div>
        </div>
      )}
      {subtitle ? (
        <p className="text-growsTextMuted text-sm mb-4">{subtitle}</p>
      ) : null}
      {children ? <div className="space-y-2">{children}</div> : null}
      {footer ? (
        <div className="border-t border-grows-border mt-4 pt-3">{footer}</div>
      ) : null}
    </div>
  );
}

