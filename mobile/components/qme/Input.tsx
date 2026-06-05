import { View, Text, TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, font } from '../../lib/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function Input({ label, hint, error, containerStyle, ...props }: Props) {
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label && (
        <Text style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.gray600, marginBottom: 5 }}>
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        style={[{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.gray300,
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: font.size.base,
          color: colors.gray900,
          backgroundColor: colors.white,
        }, props.style]}
        placeholderTextColor={colors.gray400}
      />
      {hint && !error && (
        <Text style={{ fontSize: font.size.xs, color: colors.gray400, marginTop: 4 }}>{hint}</Text>
      )}
      {error && (
        <Text style={{ fontSize: font.size.xs, color: colors.danger, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
