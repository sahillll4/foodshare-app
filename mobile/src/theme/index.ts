export const colors = {
  primary: '#2563EB',
  accent: '#E9C46A',
  background: '#FAFAF8',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  error: '#DC2626',
  success: '#16A34A',
  border: '#E5E7EB',
};

export const typography = {
  heading: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  subhead: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary },
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};
