/**
 * queueService.ts — CRUD for queues + queue-scoped ticket operations.
 */
import { supabase } from './supabase';
import type { EventGuestMark, Queue, CreateQueueInput, Ticket, UpdateQueueInput, QueueSnapshot } from '../types';

// ===================== QUEUE CRUD =====================

export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Queue;
}

export async function listQueuesForEvent(eventId: string): Promise<Queue[]> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Queue[];
}

export async function getQueue(id: string): Promise<Queue> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Queue;
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
  return data as Queue;
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
  return data as Queue;
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

export async function nextTicketForQueue(queueId: string): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('next_ticket_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  // v3 migration returns JSON {id, ticket_number}; legacy returns BIGINT
  if (typeof data === 'number') {
    return { id: data, ticketNumber: data };
  }
  return { id: data.id, ticketNumber: data.ticket_number };
}

export async function peekTicketForQueue(queueId: string): Promise<number> {
  const { data, error } = await supabase.rpc('peek_ticket_for_queue', {
    p_queue_id: queueId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function restoreTicketForQueue(
  ticketId: number,
  queueId: string
): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('restore_ticket_for_queue', {
    p_ticket_id: ticketId,
    p_queue_id: queueId,
  });
  if (error) throw error;
  // v3 migration returns JSON {id, ticket_number}; legacy returns BIGINT
  if (typeof data === 'number') {
    return { id: ticketId, ticketNumber: data };
  }
  return { id: data.id ?? ticketId, ticketNumber: data.ticket_number ?? data };
}

export async function checkInTicket(ticketId: number): Promise<void> {
  const { error } = await supabase.rpc('check_in_ticket', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
}

export async function leaveQueue(
  ticketId: number,
  reason = 'user'
): Promise<void> {
  const { error } = await supabase.rpc('leave_queue', {
    p_ticket_id: ticketId,
    p_reason: reason,
  });
  if (error) throw error;
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
  input: { firstName: string; lastName: string }
): Promise<Ticket> {
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

export async function getQueueTicket(ticketId: number): Promise<Ticket> {
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

export async function confirmTicketNearby(ticketId: number): Promise<Ticket> {
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
  return updateTicketStage(ticketId, 'released');
}

export async function completeQueueTicketAction(input: {
  eventId: string;
  ticketId: number;
  markKey: string;
  markValue?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<EventGuestMark> {
  await updateTicketStage(input.ticketId, 'completed');

  const payload = {
    event_id: input.eventId,
    ticket_id: input.ticketId,
    mark_key: input.markKey,
    mark_value: input.markValue ?? 'completed',
    source: input.source ?? 'guest',
    metadata: input.metadata ?? {},
  };

  const { data: existing, error: lookupError } = await supabase
    .from('event_guest_marks')
    .select('id')
    .eq('ticket_id', input.ticketId)
    .eq('mark_key', input.markKey)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('event_guest_marks')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as EventGuestMark;
  }

  const { data, error } = await supabase
    .from('event_guest_marks')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as EventGuestMark;
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
