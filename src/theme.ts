// Shared design tokens — keeps color/type usage consistent across screens
// instead of every file re-declaring its own hex values.
export const colors = {
  page: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F6',
  border: '#E4E7EB',
  borderStrong: '#CBD2D9',

  textPrimary: '#1F2933',
  textSecondary: '#52606D',
  textOnPrimary: '#FFFFFF',

  primary: '#1F6FEB',
  primaryDark: '#1857BD',
  primarySoft: '#E6F0FE',

  success: '#1E9E6B',
  successSoft: '#DCF5E3',
  danger: '#C0392B',
  dangerSoft: '#FBE4E4',
  warning: '#8D5B00',
  warningSoft: '#FFFBEA',
  warningBorder: '#F0B429',
} as const;

export const fonts = {
  heading: 'Lexend_600SemiBold',
  headingBold: 'Lexend_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

// Rotated by list position (not random) so a day's color is stable across
// re-renders, but adjacent days in the planner read as visually distinct.
export const accentPalette = [
  { from: '#1F6FEB', to: '#1857BD' }, // blue
  { from: '#7C3AED', to: '#5B21B6' }, // violet
  { from: '#0D9488', to: '#0F766E' }, // teal
  { from: '#DB2777', to: '#9D174D' }, // pink
  { from: '#EA580C', to: '#C2410C' }, // orange
] as const;

export const shadow = {
  card: {
    shadowColor: '#0F1B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
