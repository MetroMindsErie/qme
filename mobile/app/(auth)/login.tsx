import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing, radius } from '../../lib/theme';
import Input from '../../components/qme/Input';
import Button from '../../components/qme/Button';

export default function LoginScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Please enter your email and password.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Sign In Failed', error.message); return; }
    router.replace('/(tabs)');
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'qme://auth/callback' },
    });
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logo}><Text style={s.logoText}>q</Text></View>
        <Text style={s.heading}>Welcome back</Text>
        <Text style={s.subheading}>Sign in to your qMe account</Text>
      </View>

      {/* Social */}
      <TouchableOpacity style={s.socialBtn} onPress={handleGoogle}>
        <Ionicons name="logo-google" size={20} color="#4285F4" />
        <Text style={s.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>or email</Text>
        <View style={s.dividerLine} />
      </View>

      <Input label="Email" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        placeholder="you@example.com" />

      <Input label="Password" value={password} onChangeText={setPassword}
        secureTextEntry autoComplete="current-password"
        placeholder="••••••••" />

      <Button onPress={handleLogin} loading={loading} fullWidth style={{ marginTop: 4 }}>
        Sign In
      </Button>

      <View style={s.footer}>
        <Text style={s.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity><Text style={s.link}>Sign up</Text></TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.gray50 },
  content:      { padding: spacing.xl, paddingTop: spacing['3xl'] },
  logoWrap:     { alignItems: 'center', marginBottom: spacing['3xl'] },
  logo:         { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoText:     { color: colors.white, fontSize: font.size['3xl'], fontWeight: font.weight.black },
  heading:      { fontSize: font.size['3xl'], fontWeight: font.weight.extrabold, color: colors.gray900 },
  subheading:   { fontSize: font.size.base, color: colors.gray500, marginTop: 4 },
  socialBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white, marginBottom: spacing.md },
  socialText:   { fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.gray700 },
  divider:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  dividerLine:  { flex: 1, height: 1, backgroundColor: colors.gray200 },
  dividerText:  { fontSize: font.size.xs, color: colors.gray400 },
  footer:       { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText:   { fontSize: font.size.base, color: colors.gray500 },
  link:         { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.bold },
});
