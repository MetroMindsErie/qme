/**
 * checkInService.ts — event-level named check-ins for alpha testing.
 */
import { supabase } from './supabase';
import type { CreateEventCheckInInput, EventCheckIn } from '../types';

export async function createEventCheckIn(
  input: CreateEventCheckInInput
): Promise<EventCheckIn> {
  const { data, error } = await supabase
    .from('event_check_ins')
    .insert({
      ...input,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      code: input.code?.trim() || null,
      status: 'waiting',
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export async function listEventCheckIns(
  eventId: string,
  code?: string | null
): Promise<EventCheckIn[]> {
  let query = supabase
    .from('event_check_ins')
    .select('*')
    .eq('event_id', eventId);

  if (code === null) {
    query = query.is('code', null);
  } else if (code) {
    query = query.eq('code', code);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventCheckIn[];
}

export async function updateEventCheckInStatus(
  id: string,
  status: EventCheckIn['status']
): Promise<EventCheckIn> {
  const { data, error } = await supabase
    .from('event_check_ins')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export async function checkInEventGuest(
  id: string,
  ticketType: NonNullable<EventCheckIn['ticket_type']>
): Promise<EventCheckIn> {
  const { data, error } = await supabase
    .from('event_check_ins')
    .update({ status: 'completed', ticket_type: ticketType })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export async function updateEventCheckInTicketType(
  id: string,
  ticketType: NonNullable<EventCheckIn['ticket_type']>
): Promise<EventCheckIn> {
  const { data, error } = await supabase
    .from('event_check_ins')
    .update({ ticket_type: ticketType })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export async function getEventCheckIn(id: string): Promise<EventCheckIn> {
  const { data, error } = await supabase
    .from('event_check_ins')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export function onEventCheckInsChange(
  eventId: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`event-check-ins-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_check_ins',
        filter: `event_id=eq.${eventId}`,
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
