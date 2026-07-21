/**
 * eventService.ts — CRUD operations for events.
 */
import { supabase } from './supabase';
import { isSotcEventSlug, SOTC_PUBLIC_EVENT_SLUG } from './sotc';
import type { QEvent, CreateEventInput, UpdateEventInput } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------- CREATE ----------

export async function createEvent(input: CreateEventInput): Promise<QEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as QEvent;
}

// ---------- READ ----------

export async function listEvents(
  opts: {
    status?: QEvent['status'];
    organizationId?: string;
    organizationIds?: string[];
    eventIds?: string[];
  } = {}
): Promise<QEvent[]> {
  let q = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (opts.status) {
    q = q.eq('status', opts.status);
  }

  if (opts.organizationId) {
    q = q.eq('organization_id', opts.organizationId);
  }

  if (opts.organizationIds) {
    if (opts.organizationIds.length === 0) return [];
    q = q.in('organization_id', opts.organizationIds);
  }

  if (opts.eventIds) {
    if (opts.eventIds.length === 0) return [];
    q = q.in('id', opts.eventIds);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as QEvent[];
}

export async function getEvent(id: string): Promise<QEvent> {
  if (UUID_RE.test(id)) {
    const byId = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (byId.error) throw byId.error;
    if (byId.data) return byId.data as QEvent;
  }

  const bySlug = await supabase
    .from('events')
    .select('*')
    .eq('slug', id)
    .single();
  if (bySlug.error) throw bySlug.error;
  return bySlug.data as QEvent;
}

export async function getEventBySlug(slug: string): Promise<QEvent> {
  if (isSotcEventSlug(slug)) {
    const aliases = [SOTC_PUBLIC_EVENT_SLUG, 'sotc-rock-hall', 'sotc-test-check-in'];
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('slug', aliases);
    if (error) throw error;
    const events = (data ?? []) as QEvent[];
    const exact = events.find((event) => event.slug === slug);
    const canonical = events.find((event) => event.slug === SOTC_PUBLIC_EVENT_SLUG);
    const previousPublic = events.find((event) => event.slug === 'sotc-rock-hall');
    const pilot = events.find((event) => event.slug === 'sotc-test-check-in');
    const resolved = exact ?? canonical ?? previousPublic ?? pilot ?? events[0];
    if (resolved) return resolved;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data as QEvent;
}

// ---------- UPDATE ----------

export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<QEvent> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as QEvent;
}

// ---------- DELETE ----------

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// ---------- TEST DATA RESET ----------

export async function resetEventTestData(id: string): Promise<void> {
  const { error } = await supabase.rpc('reset_event_test_data', {
    p_event_id: id,
  });
  if (error) throw error;
}

// ---------- Realtime ----------

export function onEventsChange(callback: (payload: unknown) => void) {
  const channel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
