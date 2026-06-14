import { supabase } from './supabase';

export interface Queue {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  now_serving: number;
  status: 'active' | 'paused' | 'closed';
  sla_threshold_minutes?: number;
  created_at: string;
  updated_at: string;
}

export async function listQueuesForEvent(eventId: string): Promise<Queue[]> {
  const { data, error } = await supabase
    .from('queues').select('*').eq('event_id', eventId).order('name');
  if (error) throw error;
  return (data ?? []) as Queue[];
}

export async function getQueueBySlug(eventId: string, slug: string): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues').select('*').eq('event_id', eventId).eq('slug', slug).single();
  if (error) throw error;
  return data as Queue;
}

export async function getNowServing(queueId: string): Promise<number> {
  const { data, error } = await supabase
    .from('queues').select('now_serving').eq('id', queueId).single();
  if (error) throw error;
  return (data as { now_serving: number }).now_serving;
}

export async function joinQueue(queueId: string): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('next_ticket_for_queue', { p_queue_id: queueId });
  if (error) throw error;
  return data as { id: number; ticketNumber: number };
}

export async function checkInTicket(ticketId: number): Promise<void> {
  const { error } = await supabase.rpc('check_in_ticket', { p_ticket_id: ticketId });
  if (error) throw error;
}

export async function leaveQueue(ticketId: number, reason = 'user'): Promise<void> {
  const { error } = await supabase.rpc('leave_queue', { p_ticket_id: ticketId, p_reason: reason });
  if (error) throw error;
}
