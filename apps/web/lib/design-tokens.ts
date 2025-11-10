import { GROWS_TOKENS } from './design-system/tokens';

export const colors = {
  primary: GROWS_TOKENS.colors.growsBlue,
  secondary: GROWS_TOKENS.colors.growsBlueLight,
  background: GROWS_TOKENS.colors.growsGray,
  surface: GROWS_TOKENS.colors.growsSurface,
  border: GROWS_TOKENS.colors.growsBorder,
  textPrimary: GROWS_TOKENS.colors.growsText,
  textSecondary: GROWS_TOKENS.colors.growsTextMuted,
  error: GROWS_TOKENS.colors.growsError,
};

export const radii = GROWS_TOKENS.radii;
export const shadows = GROWS_TOKENS.shadows;
export const spacing = GROWS_TOKENS.spacing;
export const typography = {
  fontFamily: GROWS_TOKENS.typography.fontFamily,
  fontSize: GROWS_TOKENS.typography.fontSize,
  fontWeight: GROWS_TOKENS.typography.fontWeight,
};

export const tailwindTokens = {
  colors: {
    growsBlue: GROWS_TOKENS.colors.growsBlue,
    growsBlueLight: GROWS_TOKENS.colors.growsBlueLight,
    growsGray: GROWS_TOKENS.colors.growsGray,
    growsSurface: GROWS_TOKENS.colors.growsSurface,
    growsBorder: GROWS_TOKENS.colors.growsBorder,
    growsText: GROWS_TOKENS.colors.growsText,
    growsTextMuted: GROWS_TOKENS.colors.growsTextMuted,
    growsError: GROWS_TOKENS.colors.growsError,
  },
  fontFamily: GROWS_TOKENS.typography.fontFamily,
  boxShadow: GROWS_TOKENS.shadows,
  borderRadius: GROWS_TOKENS.radii,
  spacing: GROWS_TOKENS.spacing,
};
