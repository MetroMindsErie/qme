import { supabase } from './supabase';
import type { CreateEceInput, Ece, UpdateEceInput } from '../types';

function normalizeEceDisplay(ece: Ece): Ece {
  if (ece.slug !== 'headshot-photo-station') return ece;
  return {
    ...ece,
    name: 'Headshot Photographer',
    location: ece.location === 'Headshot photo station' ? 'Headshot photographer' : ece.location,
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
