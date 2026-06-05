export const colors = {
  primary:       '#0D9488',
  primaryLight:  '#F0FDFA',
  primaryBorder: '#99F6E4',
  primaryHover:  '#0F766E',
  admin:         '#1E3A5F',
  success:       '#16A34A',
  successBg:     '#F0FDF4',
  danger:        '#DC2626',
  dangerBg:      '#FEF2F2',
  warning:       '#B45309',
  warningBg:     '#FFFBEB',
  gray50:        '#F8FAFC',
  gray100:       '#F1F5F9',
  gray200:       '#E2E8F0',
  gray300:       '#CBD5E1',
  gray400:       '#94A3B8',
  gray500:       '#64748B',
  gray600:       '#475569',
  gray700:       '#334155',
  gray800:       '#1E293B',
  gray900:       '#0F172A',
  white:         '#FFFFFF',
  black:         '#000000',
} as const;

export const radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  '3xl': 32,
} as const;

export const font = {
  size: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   15,
    lg:   16,
    xl:   18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 36,
  },
  weight: {
    normal:    '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
    black:     '900' as const,
  },
} as const;
