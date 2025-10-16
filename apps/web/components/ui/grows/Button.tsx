'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Clases base comunes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variantes de color coherentes con GROWS
  const variantClasses = {
    primary: 'bg-grows-secondary text-grows-primary hover:bg-grows-secondary/90 focus:ring-grows-secondary shadow-grows-sm',
    secondary: 'bg-transparent text-grows-primary border border-grows-secondary hover:bg-grows-secondary/10 focus:ring-grows-secondary',
    ghost: 'bg-transparent text-grows-text-secondary hover:bg-grows-neutral hover:text-grows-primary focus:ring-grows-primary',
    danger: 'bg-grows-error text-grows-surface hover:bg-grows-error/90 focus:ring-grows-error shadow-grows-sm',
  };
  
  // Tamaños
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-grows-md',
    md: 'px-4 py-2 text-base rounded-grows-md',
    lg: 'px-6 py-3 text-lg rounded-grows-lg',
  };
  
  // Clases finales
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  // Spinner para estado loading
  const Spinner = () => (
    <Loader2 className="animate-spin h-4 w-4 mr-2" />
  );
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
