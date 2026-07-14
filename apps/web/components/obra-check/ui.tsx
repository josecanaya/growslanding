'use client';

/**
 * Primitivos de UI de Obra Check con los tokens de marca Grows confirmados en tailwind.config
 * (colores planos growsBlue/growsGold/...). Se estiliza con inline styles/clases seguras para no
 * depender de clases `grows-*` que no resuelven en este proyecto.
 */

import React from 'react';

export const BRAND = {
  blue: '#0C1D36',
  blueLight: '#4A6FA5',
  gold: '#E8C547',
  gray: '#F5F6F7',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#5A5A5A',
  border: '#E0E0E0',
  green: '#2B8A3E',
  error: '#A32A2A',
} as const;

export function OCButton({
  children,
  variant = 'primary',
  disabled,
  loading,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: BRAND.gold, color: BRAND.blue, border: 'none' },
    secondary: { background: 'transparent', color: BRAND.blue, border: `1.5px solid ${BRAND.blue}` },
    ghost: { background: 'transparent', color: BRAND.muted, border: 'none' },
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 ${className}`}
      style={styles[variant]}
    >
      {loading ? '…' : children}
    </button>
  );
}

export function OCCard({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl bg-white p-5 ${className}`}
      style={{ border: `1px solid ${BRAND.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', ...style }}
    >
      {children}
    </div>
  );
}

export function OCField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: BRAND.text }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs" style={{ color: BRAND.muted }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '0.5rem',
  border: `1px solid ${BRAND.border}`,
  fontSize: '0.9rem',
  outline: 'none',
  color: BRAND.text,
  background: '#fff',
};

export function StepBar({ current }: { current: number }) {
  const steps = ['Inicio', 'Cargar', 'Ordenar', 'Asignar', 'Enviar'];
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: i <= current ? BRAND.blue : BRAND.gray,
                color: i <= current ? '#fff' : BRAND.muted,
                border: i === current ? `2px solid ${BRAND.gold}` : 'none',
              }}
            >
              {i + 1}
            </div>
            <span
              className="hidden text-xs font-medium sm:inline"
              style={{ color: i <= current ? BRAND.blue : BRAND.muted }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && <div className="h-px flex-1" style={{ background: BRAND.border }} />}
        </React.Fragment>
      ))}
    </div>
  );
}
