import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, font } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'admin';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:   { bg: colors.primary,   text: colors.white,  border: colors.primary },
  secondary: { bg: colors.white,     text: colors.primary, border: colors.primaryBorder },
  ghost:     { bg: 'transparent',    text: colors.gray600, border: colors.gray200 },
  danger:    { bg: colors.danger,    text: colors.white,  border: colors.danger },
  admin:     { bg: colors.admin,     text: colors.white,  border: colors.admin },
};

const sizeStyles = {
  sm: { paddingH: 12, paddingV: 7,  fontSize: font.size.sm,   borderRadius: radius.md },
  md: { paddingH: 16, paddingV: 10, fontSize: font.size.base, borderRadius: radius.lg },
  lg: { paddingH: 20, paddingV: 13, fontSize: font.size.md,   borderRadius: radius.lg },
};

export default function Button({ children, onPress, variant = 'primary', size = 'md', loading, disabled, style, fullWidth }: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: 1,
          borderRadius: s.borderRadius,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: font.weight.bold }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
