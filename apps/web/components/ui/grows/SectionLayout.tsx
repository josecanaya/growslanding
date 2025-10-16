'use client';

import React from 'react';

export interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionLayout({
  title,
  subtitle,
  children,
  className = ''
}: SectionLayoutProps) {
  return (
    <section className={`px-10 py-8 bg-grows-background min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header unificado */}
        <div className="mt-10 animate-fade-in">
          <h2 className="text-2xl font-semibold text-grows-primary mb-2">{title}</h2>
          {subtitle && (
            <p className="text-base text-grows-text-secondary">{subtitle}</p>
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
