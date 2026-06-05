import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors, font, spacing, radius } from '../../lib/theme';
import Button from '../../components/qme/Button';
import Card from '../../components/qme/Card';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, role, signOut } = useAuth();

  if (!user) {
    return (
      <View style={s.center}>
        <Ionicons name="person-circle-outline" size={72} color={colors.gray300} />
        <Text style={s.title}>Sign in to qMe</Text>
        <Text style={s.sub}>Manage events, join queues, and track your tickets</Text>
        <Button onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.xl }}>Sign In</Button>
        <Button variant="ghost" onPress={() => router.push('/(auth)/signup')} style={{ marginTop: spacing.sm }}>Create Account</Button>
      </View>
    );
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'org_admin' ? 'Organizer' : 'Guest';
  const roleColor = role === 'super_admin' ? '#8B5CF6' : role === 'org_admin' ? colors.primary : colors.gray500;

  const menuItems = [
    ...(role === 'org_admin' || role === 'super_admin' ? [
      { icon: 'grid-outline', label: 'Admin Dashboard', onPress: () => router.push('/admin') },
    ] : []),
    { icon: 'create-outline',    label: 'Edit Profile',   onPress: () => router.push('/profile/setup') },
    { icon: 'calendar-outline',  label: 'Browse Events',  onPress: () => router.push('/(tabs)/events') },
    { icon: 'ticket-outline',    label: 'My Tickets',     onPress: () => router.push('/(tabs)/tickets') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[colors.admin, '#1E4A6F']} style={s.header}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.white, fontSize: font.size['3xl'], fontWeight: font.weight.black }}>
              {(profile?.full_name || user.email || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={s.name}>{profile?.full_name || 'qMe User'}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}>
          <Text style={{ color: colors.white, fontSize: font.size.sm, fontWeight: font.weight.bold }}>{roleLabel}</Text>
        </View>
      </LinearGradient>

      <View style={{ padding: spacing.lg }}>
        {/* Bio */}
        {profile?.bio ? (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: font.size.sm, color: colors.gray600, lineHeight: 20 }}>{profile.bio}</Text>
          </Card>
        ) : null}

        {/* Menu */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.md }}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={item.label} onPress={item.onPress}
              style={[s.menuItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.gray100 }]}>
              <Ionicons name={item.icon as any} size={20} color={colors.gray500} />
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
          ))}
        </Card>

        <Button variant="ghost" onPress={handleSignOut} fullWidth
          style={{ borderColor: colors.dangerBg }}>
          <Text style={{ color: colors.danger, fontWeight: font.weight.bold }}>Sign Out</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['3xl'], backgroundColor: colors.gray50 },
  title:    { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.gray800, marginTop: spacing.md },
  sub:      { fontSize: font.size.base, color: colors.gray500, textAlign: 'center', marginTop: spacing.sm },
  header:   { alignItems: 'center', paddingTop: 48, paddingBottom: spacing['3xl'] },
  avatar:   { width: 88, height: 88, borderRadius: 44, marginBottom: spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  name:     { fontSize: font.size['2xl'], fontWeight: font.weight.extrabold, color: colors.white },
  email:    { fontSize: font.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  menuLabel:{ flex: 1, fontSize: font.size.base, color: colors.gray700, fontWeight: font.weight.medium },
});
