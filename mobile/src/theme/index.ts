// ─── FoodShare Design System ──────────────────────────────────────────────────

export const colors = {
  // Brand
  primary:   '#2D6A4F',   // Deep green — fresh, trustworthy
  secondary: '#F4A261',   // Warm orange — food, energy
  accent:    '#E9C46A',   // Golden yellow — CTA, highlights

  // Backgrounds
  background: '#F7F9F7',
  surface:    '#FFFFFF',
  surfaceAlt: '#F0F4F1',  // Slightly tinted surface

  // Text
  textPrimary:   '#1A1A1A',
  textSecondary: '#6B7280',
  textInverse:   '#FFFFFF',

  // Semantic
  error:   '#DC2626',
  success: '#2D6A4F',
  warning: '#F59E0B',
  info:    '#3B82F6',

  // Borders
  border:       '#E5EAE8',
  borderStrong: '#C9D5D0',

  // Food type
  veg:    '#2D6A4F',
  nonVeg: '#DC2626',
  both:   '#F4A261',

  // Status
  statusLive:      '#2D6A4F',
  statusClaimed:   '#F59E0B',
  statusPickedUp:  '#3B82F6',
  statusDelivered: '#6B7280',
  statusExpired:   '#DC2626',
  statusCancelled: '#9CA3AF',
};

export const gradients = {
  // Main brand gradient — green to slightly lighter green
  hero:       ['#2D6A4F', '#40916C'] as [string, string],
  // Warm sunset for receiver/food screens
  warm:       ['#F4A261', '#E76F51'] as [string, string],
  // Subtle card gradient
  card:       ['#FFFFFF', '#F7F9F7'] as [string, string],
  // Overlay for image hero sections
  imageOverlay: ['transparent', 'rgba(0,0,0,0.55)'] as [string, string],
  // Urgency gradient for courier cards
  urgent:     ['#2D6A4F', '#F59E0B', '#DC2626'] as [string, string, string],
};

export const typography = {
  displayLg: { fontSize: 32, fontFamily: 'Inter_700Bold',  color: colors.textPrimary, lineHeight: 38 },
  display:   { fontSize: 28, fontFamily: 'Inter_700Bold',  color: colors.textPrimary, lineHeight: 34 },
  heading:   { fontSize: 22, fontFamily: 'Inter_700Bold',  color: colors.textPrimary, lineHeight: 28 },
  subhead:   { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, lineHeight: 22 },
  body:      { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary, lineHeight: 22 },
  bodyMd:    { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  caption:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 16 },
  label:     { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, lineHeight: 14, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

export const spacing = {
  xs:  4,
  s:   8,
  sm:  12,
  m:   16,
  l:   24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#1A3A2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A3A2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A3A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glowOrange: {
    shadowColor: '#F4A261',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Food type helpers
export const foodTypeConfig = {
  veg:     { label: 'VEG',     color: colors.veg,    bg: colors.veg    + '18', emoji: '🥗' },
  non_veg: { label: 'NON-VEG', color: colors.nonVeg, bg: colors.nonVeg + '18', emoji: '🍗' },
  both:    { label: 'BOTH',    color: colors.both,   bg: colors.both   + '20', emoji: '🍱' },
};

export const statusConfig: Record<string, { label: string; color: string }> = {
  live:      { label: 'LIVE',      color: colors.statusLive },
  claimed:   { label: 'CLAIMED',   color: colors.statusClaimed },
  picked_up: { label: 'PICKED UP', color: colors.statusPickedUp },
  delivered: { label: 'DELIVERED', color: colors.statusDelivered },
  expired:   { label: 'EXPIRED',   color: colors.statusExpired },
  cancelled: { label: 'CANCELLED', color: colors.statusCancelled },
};
