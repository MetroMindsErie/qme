import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, font, spacing } from '../../lib/theme';
import Button from '../../components/qme/Button';
import { useRouter } from 'expo-router';

export default function TicketsScreen() {
  const { user } = useAuth();
  const router   = useRouter();

  if (!user) {
    return (
      <View style={s.center}>
        <Ionicons name="ticket-outline" size={56} color={colors.gray300} />
        <Text style={s.title}>Your Tickets</Text>
        <Text style={s.sub}>Sign in to view your active queue tickets</Text>
        <Button onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.xl }}>Sign In</Button>
      </View>
    );
  }

  return (
    <View style={s.center}>
      <Ionicons name="ticket-outline" size={56} color={colors.gray300} />
      <Text style={s.title}>No Active Tickets</Text>
      <Text style={s.sub}>Join a queue at any live event to see your ticket here</Text>
      <Button variant="secondary" onPress={() => router.push('/(tabs)/events')} style={{ marginTop: spacing.xl }}>Browse Events</Button>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['3xl'], backgroundColor: colors.gray50 },
  title:  { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.gray800, marginTop: spacing.md },
  sub:    { fontSize: font.size.base, color: colors.gray500, textAlign: 'center', marginTop: spacing.sm },
});
