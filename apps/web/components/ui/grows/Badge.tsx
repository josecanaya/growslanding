'use client';

import React from 'react';

export interface BadgeProps {
  status?: 'activa' | 'pausada' | 'finalizada' | 'cancelada' | 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({
  status,
  variant = 'default',
  size = 'md',
  children,
  className = ''
}: BadgeProps) {
  // Mapeo de estados a variantes
  const getVariantFromStatus = (status: string) => {
    switch (status) {
      case 'activa':
      case 'completada':
        return 'success';
      case 'pausada':
      case 'pendiente':
        return 'warning';
      case 'finalizada':
        return 'info';
      case 'cancelada':
      case 'bloqueada':
        return 'error';
      default:
        return 'default';
    }
  };

  const finalVariant = status ? getVariantFromStatus(status) : variant;

  // Clases base
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';
  
  // Tamaños
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  // Variantes de color con fondo translúcido y borde suave
  const variantClasses = {
    default: 'bg-grows-neutral/15 text-grows-text-secondary border border-grows-border/30',
    success: 'bg-grows-secondary/15 text-grows-primary border border-grows-secondary/30',
    warning: 'bg-grows-warning/15 text-grows-primary border border-grows-warning/30',
    error: 'bg-grows-error/15 text-grows-error border border-grows-error/30',
    info: 'bg-grows-primary/15 text-grows-primary border border-grows-primary/30',
  };

  // Clases finales
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[finalVariant]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
