/**
 * checkInService.ts — event-level named check-ins for alpha testing.
 */
import { supabase } from './supabase';
import { getGuestSessionToken } from './guestSessionService';
import type { CreateEventCheckInInput, EventCheckIn } from '../types';

export async function createEventCheckIn(
  input: CreateEventCheckInInput
): Promise<EventCheckIn> {
  const guestToken = getGuestSessionToken(input.event_id);
  const { data: scopedData, error: scopedError } = await supabase.rpc('create_event_check_in_for_guest', {
    p_event_id: input.event_id,
    p_guest_token: guestToken,
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_code: input.code?.trim() || null,
    p_email: input.email?.trim() || null,
    p_phone: input.phone?.trim() || null,
  });
  if (!scopedError) return scopedData as EventCheckIn;
  throw scopedError;
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

  const { data, error } = await query.order('created_at', { ascending: true });
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

export async function adminCompleteEventCheckIn(
  id: string,
  ticketType?: NonNullable<EventCheckIn['ticket_type']> | null
): Promise<EventCheckIn> {
  const { data, error } = await supabase.rpc('admin_complete_event_check_in', {
    p_check_in_id: id,
    p_ticket_type: ticketType ?? null,
  });
  if (error) throw error;
  return data as EventCheckIn;
}

export async function checkInEventGuest(
  id: string,
  ticketType: NonNullable<EventCheckIn['ticket_type']>,
  eventId?: string | null
): Promise<EventCheckIn> {
  if (eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('complete_event_check_in_for_guest', {
      p_check_in_id: id,
      p_guest_token: getGuestSessionToken(eventId),
      p_ticket_type: ticketType,
    });
    if (!scopedError) return scopedData as EventCheckIn;
    throw scopedError;
  }

  const { data, error } = await supabase
    .from('event_check_ins')
    .update({ status: 'completed', ticket_type: ticketType })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as EventCheckIn;
}

export async function adminUpdateEventCheckInTicketType(
  id: string,
  ticketType: NonNullable<EventCheckIn['ticket_type']>
): Promise<EventCheckIn> {
  const { data, error } = await supabase.rpc('admin_update_event_check_in_ticket_type', {
    p_check_in_id: id,
    p_ticket_type: ticketType,
  });
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

export async function getEventCheckIn(
  id: string,
  eventId?: string | null
): Promise<EventCheckIn> {
  if (eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('get_event_check_in_for_guest', {
      p_check_in_id: id,
      p_guest_token: getGuestSessionToken(eventId),
    });
    if (!scopedError) return scopedData as EventCheckIn;
    throw scopedError;
  }

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
