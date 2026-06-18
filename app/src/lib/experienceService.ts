import { supabase } from './supabase';
import type { CreateExperienceInput, Experience, UpdateExperienceInput } from '../types';

export async function listExperiencesForEvent(eventId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Experience[];
}

export async function listActiveExperiencesForEvent(eventId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Experience[];
}

export async function getExperience(id: string): Promise<Experience> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Experience;
}

export async function createExperience(input: CreateExperienceInput): Promise<Experience> {
  const { data, error } = await supabase
    .from('experiences')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Experience;
}

export async function updateExperience(
  id: string,
  input: UpdateExperienceInput
): Promise<Experience> {
  const { data, error } = await supabase
    .from('experiences')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Experience;
}

export async function deleteExperience(id: string): Promise<void> {
  const { error } = await supabase.from('experiences').delete().eq('id', id);
  if (error) throw error;
}
