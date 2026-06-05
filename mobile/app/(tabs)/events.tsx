import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listEvents, type QEvent } from '../../lib/eventService';
import { formatDate, formatTime } from '../../lib/utils';
import { colors, spacing, font, radius } from '../../lib/theme';
import Card from '../../components/qme/Card';

export default function EventsScreen() {
  const router = useRouter();
  const [events,    setEvents]    = useState<QEvent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listEvents({ status: 'active' });
      setEvents(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <FlatList
      data={events}
      keyExtractor={ev => ev.id}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
          <Text style={s.emptyText}>No live events right now</Text>
        </View>
      }
      renderItem={({ item: ev }) => (
        <TouchableOpacity onPress={() => router.push(`/events/${ev.slug}`)}>
          <Card style={s.card} padding={0}>
            <View style={{ flexDirection: 'row', gap: 14, padding: spacing.md }}>
              {ev.image_url ? (
                <Image source={{ uri: ev.image_url }} style={s.thumb} resizeMode="cover" />
              ) : (
                <View style={[s.thumb, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: font.size['3xl'], fontWeight: font.weight.black, color: colors.primary }}>{ev.name[0]}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={s.eventName} numberOfLines={2}>{ev.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Ionicons name="calendar-outline" size={11} color={colors.gray400} />
                  <Text style={s.meta}>{formatDate(ev.event_date) || 'Today'}</Text>
                  <Text style={s.meta}>·</Text>
                  <Text style={s.meta}>{formatTime(ev.start_time) || '—'}</Text>
                </View>
                {ev.location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location-outline" size={11} color={colors.gray400} />
                    <Text style={s.meta} numberOfLines={1}>{ev.location}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ backgroundColor: colors.successBg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.success }}>LIVE</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const s = StyleSheet.create({
  list:      { padding: spacing.lg },
  card:      { marginBottom: spacing.sm },
  thumb:     { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden' },
  eventName: { fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.gray900, flex: 1 },
  meta:      { fontSize: font.size.xs, color: colors.gray500 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: font.size.md, color: colors.gray500 },
});
