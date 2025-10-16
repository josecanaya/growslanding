/**
 * GROWS Design System Tokens
 * Sistema de design tokens centralizado para la identidad visual de GROWS
 * Paleta verde-neutral profesional sin amarillo dorado
 */

export const colors = {
  primary: '#0C1D36',      // Azul petróleo (base principal)
  secondary: '#E8C547',    // Dorado (acento principal)
  background: '#F5F6F7',   // Fondo gris claro
  surface: '#FFFFFF',      // Superficie principal
  border: '#E0E0E0',       // Líneas y separadores
  textPrimary: '#0C1D36',  // Texto principal (azul petróleo)
  textSecondary: '#444444',// Texto secundario
  error: '#A32A2A',        // Rojo apagado y elegante
  success: '#0C1D36',      // Éxito (azul petróleo)
  warning: '#E8C547',      // Advertencia (dorado)
  neutral: '#F5F6F7',      // Neutral base
}

export const radii = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
}

export const typography = {
  fontFamily: 'Inter, Rubik, sans-serif',
  fontSize: {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}

/**
 * Mapeo de tokens para Tailwind CSS
 * Permite usar los tokens con la sintaxis grows-*
 */
export const tailwindTokens = {
  colors: {
    grows: {
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      border: colors.border,
      'text-primary': colors.textPrimary,
      'text-secondary': colors.textSecondary,
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
      neutral: colors.neutral,
    }
  },
  fontFamily: {
    grows: typography.fontFamily.split(', '),
  },
  boxShadow: {
    grows: {
      sm: shadows.sm,
      md: shadows.md,
      lg: shadows.lg,
      xl: shadows.xl,
    }
  },
  borderRadius: {
    grows: {
      sm: radii.sm,
      md: radii.md,
      lg: radii.lg,
      xl: radii.xl,
      full: radii.full,
    }
  },
  spacing: {
    grows: {
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
    }
  }
}

/**
 * Clases CSS personalizadas para GROWS
 * Genera las clases grows-* automáticamente
 */
export const growsClasses = {
  // Colores de fondo
  'bg-grows-primary': `background-color: ${colors.primary}`,
  'bg-grows-secondary': `background-color: ${colors.secondary}`,
  'bg-grows-background': `background-color: ${colors.background}`,
  'bg-grows-surface': `background-color: ${colors.surface}`,
  'bg-grows-neutral': `background-color: ${colors.neutral}`,
  
  // Colores de texto
  'text-grows-primary': `color: ${colors.primary}`,
  'text-grows-secondary': `color: ${colors.secondary}`,
  'text-grows-text-primary': `color: ${colors.textPrimary}`,
  'text-grows-text-secondary': `color: ${colors.textSecondary}`,
  
  // Bordes
  'border-grows-border': `border-color: ${colors.border}`,
  'border-grows-primary': `border-color: ${colors.primary}`,
  
  // Estados semánticos
  'text-grows-error': `color: ${colors.error}`,
  'text-grows-success': `color: ${colors.success}`,
  'text-grows-warning': `color: ${colors.warning}`,
  'bg-grows-error': `background-color: ${colors.error}`,
  'bg-grows-success': `background-color: ${colors.success}`,
  'bg-grows-warning': `background-color: ${colors.warning}`,
}
