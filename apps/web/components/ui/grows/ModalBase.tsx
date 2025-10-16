'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalBaseProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ModalBase({
  title,
  children,
  footer,
  onClose,
  size = 'md',
  className = ''
}: ModalBaseProps) {
  // Tamaños del modal
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Cerrar modal al hacer click en el backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-grows-surface rounded-grows-xl shadow-grows-lg w-full ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <header className="flex justify-between items-center p-6 border-b border-grows-border">
            <h2 
              id="modal-title"
              className="text-lg font-semibold text-grows-text-primary"
            >
              {title}
            </h2>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!p-2"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </header>
        )}
        
        {/* Contenido */}
        <div className={`${title ? 'p-6' : 'p-6'}`}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <footer className="p-6 border-t border-grows-border bg-grows-neutral/20">
            <div className="flex justify-end space-x-3">
              {footer}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
