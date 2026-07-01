import { supabase } from './supabase';
import { getGuestSessionToken } from './guestSessionService';
import type { EventGuestCredit } from '../types';

export async function getGuestCreditForCheckIn(
  checkInId: string,
  creditKey: string,
  eventId?: string | null
): Promise<EventGuestCredit | null> {
  if (eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('get_guest_credit_for_check_in_guest', {
      p_check_in_id: checkInId,
      p_guest_token: getGuestSessionToken(eventId),
      p_credit_key: creditKey,
    });
    if (!scopedError) {
      const credit = scopedData as EventGuestCredit | null;
      return credit?.id ? credit : null;
    }
    throw scopedError;
  }

  const { data, error } = await supabase
    .from('event_guest_credits')
    .select('*')
    .eq('check_in_id', checkInId)
    .eq('credit_key', creditKey)
    .maybeSingle();
  if (error) throw error;
  return (data as EventGuestCredit | null) ?? null;
}

export async function listGuestCreditsForEvent(
  eventId: string,
  creditKey: string
): Promise<EventGuestCredit[]> {
  const { data, error } = await supabase
    .from('event_guest_credits')
    .select('*')
    .eq('event_id', eventId)
    .eq('credit_key', creditKey);
  if (error) throw error;
  return (data ?? []) as EventGuestCredit[];
}

export async function adminGrantGuestCreditForCheckIn(input: {
  checkInId: string;
  creditKey: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}): Promise<EventGuestCredit> {
  const { data, error } = await supabase.rpc('admin_grant_guest_credit_for_check_in', {
    p_check_in_id: input.checkInId,
    p_credit_key: input.creditKey,
    p_quantity: input.quantity ?? 1,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  return data as EventGuestCredit;
}

export async function upsertGuestCreditForCheckIn(input: {
  eventId: string;
  checkInId: string;
  creditKey: string;
  quantity?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<EventGuestCredit> {
  const payload = {
    event_id: input.eventId,
    check_in_id: input.checkInId,
    credit_key: input.creditKey,
    quantity: input.quantity ?? 1,
    source: input.source ?? 'staff',
    metadata: input.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await supabase
    .from('event_guest_credits')
    .select('id')
    .eq('check_in_id', input.checkInId)
    .eq('credit_key', input.creditKey)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('event_guest_credits')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as EventGuestCredit;
  }

  const { data, error } = await supabase
    .from('event_guest_credits')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as EventGuestCredit;
}
