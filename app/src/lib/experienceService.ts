import { supabase } from './supabase';
import type { Experience } from '../types';

export async function listExperiencesForEvent(eventId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Experience[];
}
