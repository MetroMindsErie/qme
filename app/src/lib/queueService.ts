/**
 * queueService.ts — CRUD for queues + queue-scoped ticket operations.
 */
import { supabase } from './supabase';
import { getGuestSessionToken, getGuestTokenForQueue } from './guestSessionService';
import type { EventGuestMark, Queue, CreateQueueInput, Ticket, UpdateQueueInput, QueueSnapshot } from '../types';

export type QueueStageSummary = {
  waiting: number;
  gathering: number;
  nearby: number;
  released: number;
  completed: number;
};

// ===================== QUEUE CRUD =====================

function normalizeQueueDisplay(queue: Queue): Queue {
  if (queue.slug !== 'headshot-photo-station') return queue;
  return {
    ...queue,
    name: 'Headshot Photographer',
    description: 'Join the headshot queue. We will call you when the photo area is ready.',
  };
}

export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return normalizeQueueDisplay(data as Queue);
}

export async function listQueuesForEvent(eventId: string): Promise<Queue[]> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Queue[]).map(normalizeQueueDisplay);
}

export async function getQueue(id: string): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return normalizeQueueDisplay(data as Queue);
}

export async function getQueueBySlug(
  eventId: string,
  slug: string
): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('event_id', eventId)
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return normalizeQueueDisplay(data as Queue);
}

export async function updateQueue(
  id: string,
  input: UpdateQueueInput
): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeQueueDisplay(data as Queue);
}

export async function deleteQueue(id: string): Promise<void> {
  const { error } = await supabase.from('queues').delete().eq('id', id);
  if (error) throw error;
}

// ===================== NOW-SERVING (per queue) =====================

export async function getNowServing(queueId: string): Promise<number> {
  const { data, error } = await supabase
    .from('queues')
    .select('now_serving')
    .eq('id', queueId)
    .single();
  if (error) throw error;
  return data?.now_serving ?? 1;
}

export async function setNowServing(
  queueId: string,
  value: number
): Promise<number> {
  const safe = Math.max(1, Math.round(value));
  const { data, error } = await supabase
    .from('queues')
    .update({ now_serving: safe })
    .eq('id', queueId)
    .select('now_serving')
    .single();
  if (error) throw error;
  return data?.now_serving ?? safe;
}

// ===================== QUEUE-SCOPED TICKET OPS =====================

function normalizeTicketRpcResult(
  data: unknown,
  fallbackTicketId?: number
): { id: number; ticketNumber: number } {
  if (typeof data === 'number') {
    return { id: fallbackTicketId ?? data, ticketNumber: data };
  }
  const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const id = Number(record.id ?? fallbackTicketId ?? record.ticket_number ?? 0);
  const ticketNumber = Number(record.ticket_number ?? record.ticketNumber ?? record.id ?? id);
  return { id, ticketNumber };
}

async function nextTicketForQueueLegacy(queueId: string): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('next_ticket_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  const result = normalizeTicketRpcResult(data);
  await applyQueuePilotFlow(queueId);
  return result;
}

export async function nextTicketForQueue(
  queueId: string,
  eventId?: string | null
): Promise<{ id: number; ticketNumber: number }> {
  if (!eventId) return nextTicketForQueueLegacy(queueId);

  const { data, error } = await supabase.rpc('next_ticket_for_queue', {
    p_queue_id: queueId,
    p_guest_token: getGuestTokenForQueue(queueId, eventId),
  });
  if (error) {
    throw error;
  }
  const result = normalizeTicketRpcResult(data);
  await applyQueuePilotFlow(queueId);
  return result;
}

export async function peekTicketForQueue(queueId: string): Promise<number> {
  const { data, error } = await supabase.rpc('peek_ticket_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

async function restoreTicketForQueueLegacy(
  ticketId: number,
  queueId: string
): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('restore_ticket_for_queue', {
    p_ticket_id: ticketId,
    p_queue_id: queueId,
  });
  if (error) throw error;
  return normalizeTicketRpcResult(data, ticketId);
}

export async function restoreTicketForQueue(
  ticketId: number,
  queueId: string,
  eventId?: string | null
): Promise<{ id: number; ticketNumber: number }> {
  if (!eventId) return restoreTicketForQueueLegacy(ticketId, queueId);

  const { data, error } = await supabase.rpc('restore_ticket_for_queue', {
    p_ticket_id: ticketId,
    p_queue_id: queueId,
    p_guest_token: getGuestTokenForQueue(queueId, eventId),
  });
  if (error) {
    throw error;
  }
  return normalizeTicketRpcResult(data, ticketId);
}

async function checkInTicketLegacy(ticketId: number): Promise<void> {
  const { error } = await supabase.rpc('check_in_ticket', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
}

export async function checkInTicket(
  ticketId: number,
  queueId?: string | null,
  eventId?: string | null
): Promise<void> {
  if (!queueId || !eventId) return checkInTicketLegacy(ticketId);

  const { error } = await supabase.rpc('check_in_ticket', {
    p_ticket_id: ticketId,
    p_guest_token: getGuestTokenForQueue(queueId, eventId),
  });
  if (error) {
    throw error;
  }
}

async function leaveQueueLegacy(
  ticketId: number,
  reason = 'user'
): Promise<void> {
  const { error } = await supabase.rpc('leave_queue', {
    p_ticket_id: ticketId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function leaveQueue(
  ticketId: number,
  reason = 'user',
  queueId?: string | null,
  eventId?: string | null
): Promise<void> {
  if (!queueId || !eventId) return leaveQueueLegacy(ticketId, reason);

  const { error } = await supabase.rpc('leave_queue', {
    p_ticket_id: ticketId,
    p_reason: reason,
    p_guest_token: getGuestTokenForQueue(queueId, eventId),
  });
  if (error) {
    throw error;
  }
  await applyQueuePilotFlow(queueId);
}

export async function getAdminSnapshotForQueue(
  queueId: string
): Promise<QueueSnapshot> {
  const { data, error } = await supabase.rpc('admin_snapshot_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  return data as QueueSnapshot;
}

export async function getLostCountForQueue(queueId: string): Promise<number> {
  const { data, error } = await supabase.rpc('lost_count_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function resetQueueTickets(queueId: string): Promise<void> {
  const { error } = await supabase.rpc('reset_queue_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
}

// ===================== SOTC QUEUE PILOT STAGES =====================

export async function updateTicketGuestName(
  ticketId: number,
  input: { firstName: string; lastName: string },
  queueId?: string | null,
  eventId?: string | null
): Promise<Ticket> {
  if (queueId && eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('update_ticket_guest_name_for_guest', {
      p_ticket_id: ticketId,
      p_guest_token: getGuestTokenForQueue(queueId, eventId),
      p_first_name: input.firstName,
      p_last_name: input.lastName,
    });
    if (!scopedError) return scopedData as Ticket;
    throw scopedError;
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
    })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function listQueuePilotTickets(queueId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('queue_id', queueId)
    .order('ticket_number', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

export async function getActiveTicketCountForQueue(queueId: string): Promise<number> {
  const { data, error } = await supabase.rpc('active_ticket_count_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function getQueueStageSummary(queueId: string): Promise<QueueStageSummary> {
  const { data, error } = await supabase.rpc('queue_stage_summary', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  const summary = (data ?? {}) as Partial<QueueStageSummary>;
  return {
    waiting: Number(summary.waiting ?? 0),
    gathering: Number(summary.gathering ?? 0),
    nearby: Number(summary.nearby ?? 0),
    released: Number(summary.released ?? 0),
    completed: Number(summary.completed ?? 0),
  };
}

export async function getQueueTicket(
  ticketId: number,
  queueId?: string | null,
  eventId?: string | null
): Promise<Ticket> {
  if (queueId && eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('get_ticket_for_guest', {
      p_ticket_id: ticketId,
      p_guest_token: getGuestTokenForQueue(queueId, eventId),
    });
    if (!scopedError) return scopedData as Ticket;
    throw scopedError;
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function updateTicketStage(
  ticketId: number,
  stage: NonNullable<Ticket['stage']>
): Promise<Ticket> {
  const updates: Partial<Ticket> = { stage };
  const now = new Date().toISOString();
  if (stage === 'released') {
    updates.released_at = now;
  }
  if (stage === 'standby' || stage === 'released' || stage === 'completed') {
    updates.gathering_snoozed_at = null;
  }
  if (stage === 'completed') {
    updates.status = 'served';
    updates.completed_at = now;
  } else if (stage === 'left' || stage === 'cancelled') {
    updates.status = 'left';
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function confirmTicketNearby(
  ticketId: number,
  queueId?: string | null,
  eventId?: string | null
): Promise<Ticket> {
  if (queueId && eventId) {
    const { data: scopedData, error: scopedError } = await supabase.rpc('confirm_ticket_nearby_for_guest', {
      p_ticket_id: ticketId,
      p_guest_token: getGuestTokenForQueue(queueId, eventId),
    });
    if (!scopedError) return scopedData as Ticket;
    throw scopedError;
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ nearby_confirmed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function releaseQueueTicket(ticketId: number): Promise<Ticket> {
  const { data, error } = await supabase.rpc('admin_release_queue_ticket', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
  return data as Ticket;
}

export async function markReleasedTicketNotHere(ticketId: number): Promise<Ticket> {
  const { data, error } = await supabase.rpc('admin_mark_queue_ticket_not_here', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
  return data as Ticket;
}

export async function returnGatheringTicketToWaiting(ticketId: number): Promise<Ticket> {
  const { data, error } = await supabase.rpc('admin_return_queue_ticket_to_waiting', {
    p_ticket_id: ticketId,
    p_reason: 'staff_return',
  });
  if (error) throw error;
  return data as Ticket;
}

function ticketIsNearbyConfirmed(ticket: Ticket) {
  return !Object.prototype.hasOwnProperty.call(ticket, 'nearby_confirmed_at') || Boolean(ticket.nearby_confirmed_at);
}

export async function applyQueuePilotFlow(queueId: string): Promise<void> {
  const { error: rpcError } = await supabase.rpc('apply_queue_pilot_flow', {
    p_queue_id: queueId,
  });
  if (!rpcError) return;
  throw rpcError;
}

export async function adminApplyQueuePilotFlow(queueId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_apply_queue_pilot_flow', {
    p_queue_id: queueId,
  });
  if (error) throw error;
}

export async function completeQueueTicketAction(input: {
  eventId: string;
  ticketId: number;
  markKey: string;
  markValue?: string;
  checkInId?: string | null;
  consumeCreditKey?: string;
  creditGuestName?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<EventGuestMark> {
  if ((input.source ?? 'guest') === 'guest') {
    const { data: scopedData, error: scopedError } = await supabase.rpc('complete_queue_ticket_for_guest', {
      p_event_id: input.eventId,
      p_ticket_id: input.ticketId,
      p_guest_token: getGuestSessionToken(input.eventId),
      p_mark_key: input.markKey,
      p_mark_value: input.markValue ?? 'completed',
      p_check_in_id: input.checkInId ?? null,
      p_consume_credit_key: input.consumeCreditKey ?? null,
      p_credit_guest_name: input.creditGuestName ?? null,
      p_metadata: input.metadata ?? {},
    });
    if (!scopedError) return scopedData as EventGuestMark;
    throw scopedError;
  }

  const { data, error } = await supabase.rpc('admin_complete_queue_ticket', {
    p_event_id: input.eventId,
    p_ticket_id: input.ticketId,
    p_mark_key: input.markKey,
    p_mark_value: input.markValue ?? 'completed',
    p_check_in_id: input.checkInId ?? null,
    p_consume_credit_key: input.consumeCreditKey ?? null,
    p_credit_guest_name: input.creditGuestName ?? null,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  return data as EventGuestMark;
}

export async function markQueueServiceStartedForGuest(input: {
  eventId: string;
  ticketId: number;
  queueId: string;
  markKey?: string;
  checkInId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<EventGuestMark> {
  const { data, error } = await supabase.rpc('mark_queue_service_started_for_guest', {
    p_event_id: input.eventId,
    p_ticket_id: input.ticketId,
    p_guest_token: getGuestTokenForQueue(input.queueId, input.eventId),
    p_mark_key: input.markKey ?? 'headshot_service_started',
    p_check_in_id: input.checkInId ?? null,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  return data as EventGuestMark;
}

export async function getQueueServiceMarkForGuest(input: {
  eventId: string;
  ticketId: number;
  queueId: string;
  markKey?: string;
}): Promise<EventGuestMark | null> {
  const { data, error } = await supabase.rpc('get_queue_service_mark_for_guest', {
    p_event_id: input.eventId,
    p_ticket_id: input.ticketId,
    p_guest_token: getGuestTokenForQueue(input.queueId, input.eventId),
    p_mark_key: input.markKey ?? 'headshot_service_started',
  });
  if (error) throw error;
  const mark = (data as EventGuestMark | null) ?? null;
  return mark?.id ? mark : null;
}

export async function listEventGuestMarksForTickets(
  eventId: string,
  ticketIds: number[],
  markKey: string
): Promise<EventGuestMark[]> {
  if (ticketIds.length === 0) return [];
  const { data, error } = await supabase
    .from('event_guest_marks')
    .select('*')
    .eq('event_id', eventId)
    .eq('mark_key', markKey)
    .in('ticket_id', ticketIds);
  if (error) throw error;
  return (data ?? []) as EventGuestMark[];
}

// ===================== REALTIME =====================

export function onQueuesChange(
  eventId: string,
  callback: (payload: unknown) => void
) {
  const channel = supabase
    .channel(`queues-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queues',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function onQueueChange(
  queueId: string,
  callback: (queue: Queue) => void
) {
  const channel = supabase
    .channel(`queue-${queueId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'queues',
        filter: `id=eq.${queueId}`,
      },
      (payload) => {
        if (payload.new) callback(payload.new as Queue);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function onQueueTicketsChange(
  queueId: string,
  callback: (payload: unknown) => void
) {
  const channel = supabase
    .channel(`queue-tickets-${queueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `queue_id=eq.${queueId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
