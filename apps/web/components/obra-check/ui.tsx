'use client';

/**
 * Primitivos de UI de Obra Check con los tokens de marca Grows confirmados en tailwind.config
 * (colores planos growsBlue/growsGold/...). Se estiliza con inline styles/clases seguras para no
 * depender de clases `grows-*` que no resuelven en este proyecto.
 */

import React from 'react';
import { Check } from 'lucide-react';

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
  size = 'md',
  disabled,
  loading,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: BRAND.gold,
      color: BRAND.blue,
      border: 'none',
      boxShadow: '0 2px 8px rgba(232,197,71,0.35)',
    },
    dark: { background: BRAND.blue, color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: BRAND.blue, border: `1.5px solid ${BRAND.blue}` },
    ghost: { background: 'transparent', color: BRAND.muted, border: 'none' },
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3.5 text-base rounded-xl',
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${className}`}
      style={styles[variant]}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
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
      style={{ border: `1px solid ${BRAND.border}`, boxShadow: '0 1px 3px rgba(12,29,54,0.05)', ...style }}
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

/** Encabezado de pantalla: título + subtítulo + chips de resumen opcionales. */
export function ScreenHeader({
  title,
  subtitle,
  chips,
}: {
  title: string;
  subtitle?: React.ReactNode;
  chips?: Array<{ label: string; tone?: 'default' | 'gold' | 'green' }>;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: BRAND.blue }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
          {subtitle}
        </p>
      )}
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <OCChip key={c.label} tone={c.tone}>
              {c.label}
            </OCChip>
          ))}
        </div>
      )}
    </div>
  );
}

export function OCChip({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'gold' | 'green';
}) {
  const tones: Record<string, React.CSSProperties> = {
    default: { background: '#fff', color: BRAND.muted, border: `1px solid ${BRAND.border}` },
    gold: { background: '#FFFBEB', color: '#92600A', border: `1px solid ${BRAND.gold}` },
    green: { background: '#ECFDF5', color: BRAND.green, border: `1px solid #A7F3D0` },
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

/** Barra de progreso de 3 pasos: Cargar → Armar → Enviar. */
export function StepBar({ current }: { current: number }) {
  const steps = ['Cargar', 'Armar el plan', 'Enviar'];
  return (
    <div className="mb-7">
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 76 }}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all"
                  style={{
                    background: done ? BRAND.green : active ? BRAND.blue : '#fff',
                    color: done || active ? '#fff' : BRAND.muted,
                    border: active
                      ? `2.5px solid ${BRAND.gold}`
                      : done
                        ? 'none'
                        : `1.5px solid ${BRAND.border}`,
                    boxShadow: active ? '0 2px 10px rgba(12,29,54,0.25)' : 'none',
                  }}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? BRAND.blue : done ? BRAND.green : BRAND.muted }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="relative mx-1 mb-5 h-1 flex-1 overflow-hidden rounded-full" style={{ background: BRAND.border }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ background: BRAND.green, width: i < current ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Barra fija inferior con CTA — mantiene la acción principal siempre visible. */
export function StickyActionBar({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-6 border-t px-4 py-3 backdrop-blur-sm sm:rounded-t-xl"
      style={{ background: 'rgba(255,255,255,0.92)', borderColor: BRAND.border }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="min-w-0 text-xs" style={{ color: BRAND.muted }}>
          {hint}
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
