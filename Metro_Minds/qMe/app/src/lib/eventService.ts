/**
 * eventService.ts — CRUD operations for events.
 */
import { supabase } from './supabase';
import type { QEvent, CreateEventInput, UpdateEventInput } from '../types';

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
  opts: { status?: QEvent['status'] } = {}
): Promise<QEvent[]> {
  let q = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (opts.status) {
    q = q.eq('status', opts.status);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as QEvent[];
}

export async function getEvent(id: string): Promise<QEvent> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as QEvent;
}

export async function getEventBySlug(slug: string): Promise<QEvent> {
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
