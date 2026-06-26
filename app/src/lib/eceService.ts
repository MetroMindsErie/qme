import { supabase } from './supabase';
import type { CreateEceInput, Ece, UpdateEceInput } from '../types';

const HEADSHOT_STAGE_COPY = {
  waiting: {
    title: 'Waiting',
    detail: 'You are in the headshot queue. No action is needed yet.',
  },
  standby: {
    title: 'Almost Ready',
    detail: 'Your headshot is coming up soon. Please head to the {{location}}.',
    instruction: "When you arrive at the {{location}}, tap I'm Nearby. Keep this page open.",
  },
  released: {
    title: 'Your Turn',
    detail: 'Step in for your headshot. Staff will mark this complete after your photo.',
  },
  completed: {
    title: 'Completed',
    detail: 'Your headshot is complete. You can return to the event.',
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeEceDisplay(ece: Ece): Ece {
  if (ece.slug !== 'headshot-photo-station') return ece;
  const metadata = asRecord(ece.metadata);
  return {
    ...ece,
    name: 'Headshot Photographer',
    description: 'Join the headshot queue. We will call you when the photo area is ready.',
    location: 'Headshot station',
    metadata: {
      ...metadata,
      stage_copy: HEADSHOT_STAGE_COPY,
    },
  };
}

export async function listEcesForEvent(eventId: string): Promise<Ece[]> {
  const { data, error } = await supabase
    .from('eces')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Ece[]).map(normalizeEceDisplay);
}

export async function listActiveEcesForEvent(eventId: string): Promise<Ece[]> {
  const { data, error } = await supabase
    .from('eces')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Ece[]).map(normalizeEceDisplay);
}

export async function getEce(id: string): Promise<Ece> {
  const { data, error } = await supabase
    .from('eces')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return normalizeEceDisplay(data as Ece);
}

export async function createEce(input: CreateEceInput): Promise<Ece> {
  const { data, error } = await supabase
    .from('eces')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return normalizeEceDisplay(data as Ece);
}

export async function updateEce(id: string, input: UpdateEceInput): Promise<Ece> {
  const { data, error } = await supabase
    .from('eces')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeEceDisplay(data as Ece);
}

export async function deleteEce(id: string): Promise<void> {
  const { error } = await supabase.from('eces').delete().eq('id', id);
  if (error) throw error;
}
