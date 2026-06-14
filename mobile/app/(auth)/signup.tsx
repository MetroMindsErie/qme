import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing, radius } from '../../lib/theme';
import Input from '../../components/qme/Input';
import Button from '../../components/qme/Button';
import type { UserRole } from '../../lib/profileService';

export default function SignupScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role,     setRole]     = useState<UserRole>('guest');
  const [loading,  setLoading]  = useState(false);

  async function handleSignup() {
    if (!email || !password) { Alert.alert('Error', 'Email and password are required.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role, full_name: fullName } },
    });
    setLoading(false);
    if (error) { Alert.alert('Sign Up Failed', error.message); return; }
    Alert.alert('Account Created!', 'Complete your profile to get started.', [
      { text: 'Continue', onPress: () => router.replace('/profile/setup') },
    ]);
  }

  const roles: { value: UserRole; label: string; desc: string; icon: string }[] = [
    { value: 'guest',     label: 'Guest',        desc: 'Join event queues',      icon: '👤' },
    { value: 'org_admin', label: 'Organizer',     desc: 'Create & manage events', icon: '🏢' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.logoWrap}>
        <View style={s.logo}><Text style={s.logoText}>q</Text></View>
        <Text style={s.heading}>Create your account</Text>
        <Text style={s.subheading}>Join qMe to manage or join event queues</Text>
      </View>

      {/* Role selector */}
      <Text style={s.roleLabel}>I want to…</Text>
      <View style={s.roleRow}>
        {roles.map(r => (
          <TouchableOpacity key={r.value} onPress={() => setRole(r.value)}
            style={[s.roleCard, role === r.value && s.roleCardActive]}>
            <Text style={s.roleIcon}>{r.icon}</Text>
            <Text style={[s.roleTitle, role === r.value && { color: colors.primary }]}>{r.label}</Text>
            <Text style={s.roleDesc}>{r.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Full Name" value={fullName} onChangeText={setFullName}
        autoComplete="name" placeholder="Jordan Easter" />

      <Input label="Email" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        placeholder="you@example.com" />

      <Input label="Password" value={password} onChangeText={setPassword}
        secureTextEntry autoComplete="new-password"
        placeholder="Min. 6 characters" />

      <Button onPress={handleSignup} loading={loading} fullWidth style={{ marginTop: 4 }}>
        Create Account
      </Button>

      <View style={s.footer}>
        <Text style={s.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity><Text style={s.link}>Sign in</Text></TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.gray50 },
  content:        { padding: spacing.xl, paddingTop: spacing['3xl'] },
  logoWrap:       { alignItems: 'center', marginBottom: spacing.xl },
  logo:           { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoText:       { color: colors.white, fontSize: font.size['3xl'], fontWeight: font.weight.black },
  heading:        { fontSize: font.size['3xl'], fontWeight: font.weight.extrabold, color: colors.gray900 },
  subheading:     { fontSize: font.size.base, color: colors.gray500, marginTop: 4 },
  roleLabel:      { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.gray600, marginBottom: spacing.sm },
  roleRow:        { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleCard:       { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.gray200, backgroundColor: colors.white, alignItems: 'center' },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleIcon:       { fontSize: 24, marginBottom: 4 },
  roleTitle:      { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.gray700, marginBottom: 2 },
  roleDesc:       { fontSize: font.size.xs, color: colors.gray400, textAlign: 'center' },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText:     { fontSize: font.size.base, color: colors.gray500 },
  link:           { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.bold },
});
