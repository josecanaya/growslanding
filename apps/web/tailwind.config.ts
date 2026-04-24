import type { Config } from 'tailwindcss';

// Tokens inline para que Tailwind/Turbopack resuelva sin depender de ./lib (evita "Module not found")
const GROWS = {
  colors: {
    growsBlue: '#0C1D36',
    growsBlueLight: '#4A6FA5',
    growsGold: '#E8C547',
    growsGray: '#F5F6F7',
    growsSurface: '#FFFFFF',
    growsText: '#1A1A1A',
    growsTextMuted: '#5A5A5A',
    growsBorder: '#E0E0E0',
    growsError: '#A32A2A',
    growsGreen: '#2B8A3E',
    growsYellow: '#E5A100',
  },
  typography: { fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  shadows: { sm: '0 1px 2px rgba(0, 0, 0, 0.05)', md: '0 4px 6px rgba(0, 0, 0, 0.08)', lg: '0 10px 15px rgba(0, 0, 0, 0.1)' },
  radii: { sm: '0.25rem', md: '0.5rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
};

const fontStack = GROWS.typography.fontFamily
  .split(',')
  .map((font) => font.trim().replace(/^"(.*)"$/, '$1'));

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...GROWS.colors,
        /** Design system ref. `reforma/stitch_socio` (Stitch / Material) */
        stitch: {
          surface: '#f7f9fb',
          'on-surface': '#191c1e',
          primary: '#163274',
          'primary-container': '#314a8d',
          'on-primary': '#ffffff',
          'on-primary-container': '#a8bcff',
          tertiary: '#003473',
          outline: '#737784',
          'surface-container': '#eceef0',
          'surface-container-low': '#f2f4f6',
          'surface-container-lowest': '#ffffff',
          'surface-container-high': '#e6e8ea',
          error: '#ba1a1a',
        },
      },
      fontFamily: {
        sans: fontStack,
        grows: fontStack,
        'stitch-headline': [
          'Manrope',
          'var(--font-manrope, system-ui)',
          'system-ui',
          'sans-serif',
        ],
        'stitch-body': [
          'Inter',
          'var(--font-inter, system-ui)',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'grows-sm': GROWS.shadows.sm,
        'grows-md': GROWS.shadows.md,
        'grows-lg': GROWS.shadows.lg,
        /** Barra inferior socio (Stitch) */
        'stitch-nav': '0 -4px 20px -2px rgba(22, 50, 116, 0.05)',
      },
      borderRadius: {
        'grows-sm': GROWS.radii.sm,
        'grows-md': GROWS.radii.md,
        'grows-lg': GROWS.radii.lg,
        'grows-xl': GROWS.radii.xl,
        'grows-full': GROWS.radii.full,
      },
      spacing: {
        'grows-xs': GROWS.spacing.xs,
        'grows-sm': GROWS.spacing.sm,
        'grows-md': GROWS.spacing.md,
        'grows-lg': GROWS.spacing.lg,
        'grows-xl': GROWS.spacing.xl,
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

