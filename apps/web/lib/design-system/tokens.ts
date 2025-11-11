/**
 * GROWS Design System Tokens
 * Única fuente de verdad para colores, tipografía, radios, sombras y espaciados.
 * ⚠️ growsGold se usa exclusivamente en el hover del SidebarClienteTecnico.
 */

export const GROWS_TOKENS = {
  colors: {
    // Paleta base
    growsBlue: '#0C1D36', // Azul petróleo principal
    growsBlueLight: '#4A6FA5', // Azul pálido (reemplaza dorado)
    growsGold: '#E8C547', // Dorado (solo hover sidebar)
    growsGray: '#F5F6F7', // Fondo general claro
    growsSurface: '#FFFFFF', // Fondo de cards
    growsText: '#1A1A1A', // Texto principal
    growsTextMuted: '#5A5A5A', // Texto secundario
    growsBorder: '#E0E0E0', // Bordes
    growsError: '#A32A2A', // Errores o alertas
    growsGreen: '#2B8A3E', // Estados completados
    growsYellow: '#E5A100', // Alertas suaves
  },
  typography: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.75rem', // 28px
    },
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const;

export type GrowsTokenKeys = typeof GROWS_TOKENS;

