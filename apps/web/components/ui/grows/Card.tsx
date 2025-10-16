'use client';

import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  status?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  subtitle,
  status,
  icon,
  footer,
  onClick,
  children,
  className = ''
}: CardProps) {
  const baseClasses = 'bg-grows-surface border border-grows-border rounded-grows-lg shadow-grows-sm transition-all duration-200 opacity-0 animate-fade-in';
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-grows-md hover:-translate-y-0.5 hover:scale-[1.02]' : '';
  const classes = `${baseClasses} ${interactiveClasses} ${className}`;
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <div 
      className={classes}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Header con título, subtítulo e icono */}
      {(title || subtitle || icon || status) && (
        <div className="px-6 py-4 border-b border-grows-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="h-12 w-12 bg-grows-secondary/10 rounded-grows-lg flex items-center justify-center text-grows-primary">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-grows-primary font-semibold text-lg">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-grows-text-secondary text-sm mb-3">{subtitle}</p>
                )}
              </div>
            </div>
            {status && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-grows-secondary/15 text-grows-primary border border-grows-secondary/30">
                {status}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Contenido principal */}
      {children && (
        <div className="p-6">
          {children}
        </div>
      )}
      
      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-grows-border bg-grows-neutral/30">
          {footer}
        </div>
      )}
    </div>
  );
}
