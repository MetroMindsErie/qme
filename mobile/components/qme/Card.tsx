import { View, type ViewStyle } from 'react-native';
import { colors, radius } from '../../lib/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function Card({ children, style, padding = 16 }: Props) {
  return (
    <View style={[{
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.gray200,
      padding,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    }, style]}>
      {children}
    </View>
  );
}
