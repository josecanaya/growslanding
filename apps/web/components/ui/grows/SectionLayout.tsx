'use client';

import React from 'react';

export interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleAlign?: 'left' | 'center' | 'right';
  titleClassName?: string;
  subtitleClassName?: string;
}

export function SectionLayout({
  title,
  subtitle,
  children,
  className = '',
  titleAlign = 'left',
  titleClassName,
  subtitleClassName,
}: SectionLayoutProps) {
  const alignmentClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  const baseTitleClasses = 'text-2xl font-semibold text-grows-primary mb-2';
  const baseSubtitleClasses = 'text-base text-grows-text-secondary';

  return (
    <section className={`px-10 py-8 bg-grows-background min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header unificado */}
        <div className={`mt-10 animate-fade-in flex flex-col ${alignmentClasses[titleAlign]}`}>
          <h2 className={`${baseTitleClasses} ${titleClassName || ''}`}>{title}</h2>
          {subtitle && (
            <p className={`${baseSubtitleClasses} ${subtitleClassName || ''}`}>{subtitle}</p>
          )}
        </div>

        {/* Contenido */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
