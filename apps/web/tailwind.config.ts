import type { Config } from 'tailwindcss';
import { GROWS_TOKENS } from './lib/design-system/tokens';

const fontStack = GROWS_TOKENS.typography.fontFamily
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
        growsBlue: GROWS_TOKENS.colors.growsBlue,
        growsBlueLight: GROWS_TOKENS.colors.growsBlueLight,
        growsGold: GROWS_TOKENS.colors.growsGold,
        growsGray: GROWS_TOKENS.colors.growsGray,
        growsSurface: GROWS_TOKENS.colors.growsSurface,
        growsText: GROWS_TOKENS.colors.growsText,
        growsTextMuted: GROWS_TOKENS.colors.growsTextMuted,
        growsBorder: GROWS_TOKENS.colors.growsBorder,
        growsError: GROWS_TOKENS.colors.growsError,
      },
      fontFamily: {
        sans: fontStack,
        grows: fontStack,
      },
      boxShadow: {
        'grows-sm': GROWS_TOKENS.shadows.sm,
        'grows-md': GROWS_TOKENS.shadows.md,
        'grows-lg': GROWS_TOKENS.shadows.lg,
      },
      borderRadius: {
        'grows-sm': GROWS_TOKENS.radii.sm,
        'grows-md': GROWS_TOKENS.radii.md,
        'grows-lg': GROWS_TOKENS.radii.lg,
        'grows-xl': GROWS_TOKENS.radii.xl,
        'grows-full': GROWS_TOKENS.radii.full,
      },
      spacing: {
        'grows-xs': GROWS_TOKENS.spacing.xs,
        'grows-sm': GROWS_TOKENS.spacing.sm,
        'grows-md': GROWS_TOKENS.spacing.md,
        'grows-lg': GROWS_TOKENS.spacing.lg,
        'grows-xl': GROWS_TOKENS.spacing.xl,
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

