import { supabase } from './supabase';

export interface QEvent {
  id: string;
  org_id?: string | null;
  name: string;
  slug: string;
  description: string;
  location: string;
  image_url: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  venue?: string;
  max_capacity?: number;
  created_at: string;
  updated_at: string;
}

export async function listEvents(opts: { status?: QEvent['status']; org_id?: string } = {}): Promise<QEvent[]> {
  let q = supabase.from('events').select('*').order('event_date', { ascending: true });
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.org_id)  q = q.eq('org_id', opts.org_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as QEvent[];
}

export async function getEvent(id: string): Promise<QEvent> {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error) throw error;
  return data as QEvent;
}

export async function getEventBySlug(slug: string): Promise<QEvent> {
  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data as QEvent;
}
