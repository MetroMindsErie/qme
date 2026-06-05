import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { listEvents, type QEvent } from '../../lib/eventService';
import { listQueuesForEvent, type Queue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import { colors, spacing, font, radius } from '../../lib/theme';
import Button from '../../components/qme/Button';
import Card from '../../components/qme/Card';

interface EventWithECEs extends QEvent { eces: Queue[] }

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [events,    setEvents]    = useState<EventWithECEs[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const evs = await listEvents({ status: 'active' });
      const withECEs = await Promise.all(
        evs.map(async ev => ({ ...ev, eces: await listQueuesForEvent(ev.id).catch(() => []) }))
      );
      setEvents(withECEs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const onRefresh = () => { setRefreshing(true); loadFeed(); };

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}>

      {/* Hero */}
      {!user ? (
        <LinearGradient colors={[colors.admin, '#0D6E65']} style={s.hero}>
          <Text style={s.heroTitle}>Skip the line.{'\n'}Join the queue.</Text>
          <Text style={s.heroSub}>Real-time queue management for live events.</Text>
          <View style={s.heroButtons}>
            <Button onPress={() => router.push('/(auth)/signup')} style={{ marginRight: 10 }}>Get Started</Button>
            <Button variant="ghost" onPress={() => router.push('/(auth)/login')}
              style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
              <Text style={{ color: colors.white, fontWeight: font.weight.bold }}>Sign In</Text>
            </Button>
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient colors={[colors.admin, '#1E4A6F']} style={s.welcomeBar}>
          <View>
            <Text style={s.welcomeText}>
              {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]} 👋` : 'Welcome back 👋'}
            </Text>
            <Text style={s.welcomeSub}>{role === 'guest' ? 'Browse live events and join queues' : 'Manage your events or browse the feed'}</Text>
          </View>
          {(role === 'org_admin' || role === 'super_admin') && (
            <TouchableOpacity onPress={() => router.push('/admin')} style={s.adminBtn}>
              <Ionicons name="grid" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      )}

      <View style={s.body}>
        {/* Stats */}
        {user && events.length > 0 && (
          <View style={s.statsRow}>
            {[
              { label: 'Live Events', value: events.length, color: colors.success },
              { label: 'Active ECEs', value: events.reduce((n, e) => n + e.eces.filter(q => q.status === 'active').length, 0), color: colors.primary },
            ].map(({ label, value, color }) => (
              <Card key={label} style={{ flex: 1, marginHorizontal: 4, alignItems: 'center', padding: 14 }}>
                <Text style={{ fontSize: font.size['4xl'], fontWeight: font.weight.black, color }}>{value}</Text>
                <Text style={{ fontSize: font.size.xs, color: colors.gray500, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Section header */}
        <View style={s.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={s.liveDot} />
            <Text style={s.sectionTitle}>Happening Now</Text>
          </View>
          <TouchableOpacity onPress={loadFeed}>
            <Text style={{ fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.semibold }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: spacing['3xl'] }}>
            <Ionicons name="calendar-outline" size={40} color={colors.gray300} />
            <Text style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.gray600, marginTop: 12 }}>No live events right now</Text>
            <Text style={{ fontSize: font.size.base, color: colors.gray400, marginTop: 4 }}>Check back soon!</Text>
          </Card>
        ) : (
          events.map(ev => <EventCard key={ev.id} ev={ev} />)
        )}
      </View>
    </ScrollView>
  );
}

function EventCard({ ev }: { ev: EventWithECEs }) {
  const router = useRouter();
  const activeECEs = ev.eces.filter(q => q.status === 'active');

  return (
    <Card style={{ marginBottom: spacing.md, padding: 0, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => router.push(`/events/${ev.slug}`)}>
        {ev.image_url ? (
          <View style={{ height: 150 }}>
            <Image source={{ uri: ev.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
              <Text style={{ color: colors.white, fontSize: font.size.xl, fontWeight: font.weight.extrabold }}>{ev.name}</Text>
            </View>
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: colors.success, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.bold }}>LIVE</Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
            <Text style={{ fontSize: font.size.lg, fontWeight: font.weight.extrabold, color: colors.gray900 }}>{ev.name}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Meta */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar-outline" size={12} color={colors.gray400} />
          <Text style={{ fontSize: font.size.xs, color: colors.gray500 }}>{formatDate(ev.event_date) || 'Today'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={colors.gray400} />
          <Text style={{ fontSize: font.size.xs, color: colors.gray500 }}>{formatTime(ev.start_time) || '—'}</Text>
        </View>
        {ev.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={12} color={colors.gray400} />
            <Text style={{ fontSize: font.size.xs, color: colors.gray500 }}>{ev.location}</Text>
          </View>
        ) : null}
      </View>

      {/* ECEs */}
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.gray400, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
          {activeECEs.length} Experience{activeECEs.length !== 1 ? 's' : ''}
        </Text>
        {activeECEs.slice(0, 3).map(ece => (
          <TouchableOpacity key={ece.id} onPress={() => router.push(`/events/${ev.slug}/q/${ece.slug}`)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ece.status === 'active' ? colors.success : colors.gray300, marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.gray800 }}>{ece.name}</Text>
              <Text style={{ fontSize: font.size.xs, color: colors.gray500 }}>Now serving <Text style={{ color: colors.primary, fontWeight: font.weight.bold }}>#{ece.now_serving}</Text></Text>
            </View>
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.bold }}>Join</Text>
            </View>
          </TouchableOpacity>
        ))}
        {activeECEs.length > 3 && (
          <TouchableOpacity onPress={() => router.push(`/events/${ev.slug}`)} style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.semibold }}>+{activeECEs.length - 3} more experiences →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.gray50 },
  hero:          { padding: spacing['3xl'], paddingTop: 48 },
  heroTitle:     { fontSize: font.size['4xl'], fontWeight: font.weight.black, color: colors.white, lineHeight: 36, marginBottom: 10 },
  heroSub:       { fontSize: font.size.base, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  heroButtons:   { flexDirection: 'row' },
  welcomeBar:    { padding: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcomeText:   { fontSize: font.size.xl, fontWeight: font.weight.extrabold, color: colors.white },
  welcomeSub:    { fontSize: font.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  adminBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body:          { padding: spacing.lg },
  statsRow:      { flexDirection: 'row', marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle:  { fontSize: font.size.md, fontWeight: font.weight.extrabold, color: colors.gray800 },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
});
