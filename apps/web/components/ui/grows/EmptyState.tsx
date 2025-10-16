'use client';

import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-10 bg-grows-surface rounded-grows-lg shadow-grows-sm border border-grows-border ${className}`}
    >
      {/* Icono */}
      {icon && (
        <div className="text-grows-secondary mb-4 text-4xl">
          {icon}
        </div>
      )}
      
      {/* Título */}
      <h3 className="text-grows-primary font-semibold text-lg mb-2">
        {title}
      </h3>
      
      {/* Descripción */}
      {description && (
        <p className="text-grows-text-secondary text-sm mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {/* Acción */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
