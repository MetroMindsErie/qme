/**
 * supabaseService.ts
 * Drop-in replacement for the Express API calls.
 * Every function here maps 1-to-1 to an old /api/* endpoint.
 */
import { supabase } from './supabase';

// ---------- Tickets ----------

/** POST /api/next-ticket → issue a new ticket via RPC */
export async function nextTicket(): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('next_ticket');
  if (error) throw error;
  // v3 migration returns JSON {id, ticket_number}; legacy returns BIGINT
  if (typeof data === 'number') {
    return { id: data, ticketNumber: data };
  }
  return { id: data.id, ticketNumber: data.ticket_number };
}

/** GET /api/peek-ticket → get last issued ticket number */
export async function peekTicket(): Promise<number> {
  const { data, error } = await supabase.rpc('peek_ticket');
  if (error) throw error;
  return (data as number) ?? 0;
}

/** POST /api/queue/restore → ensure a row exists for an adopted ticket */
export async function restoreTicket(ticketId: number): Promise<{ id: number; ticketNumber: number }> {
  const { data, error } = await supabase.rpc('restore_ticket', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
  // v3 migration returns JSON {id, ticket_number}; legacy returns BIGINT
  if (typeof data === 'number') {
    return { id: ticketId, ticketNumber: data };
  }
  return { id: data.id ?? ticketId, ticketNumber: data.ticket_number ?? data };
}

/** POST /api/queue/check-in */
export async function checkInTicket(ticketId: number): Promise<void> {
  const { error } = await supabase.rpc('check_in_ticket', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
}

/** POST /api/queue/leave */
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

// ---------- Metric1 (NOW SERVING) ----------

/** GET /api/metric1 */
export async function getMetric1(): Promise<{
  value: number;
  ts: number;
}> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['metric1', 'metric1Ts']);
  if (error) throw error;

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    value: Number(map.metric1 ?? 1),
    ts: Number(map.metric1Ts ?? Date.now()),
  };
}

/** POST /api/metric1 */
export async function setMetric1(value: number): Promise<{
  value: number;
  ts: number;
}> {
  const ts = Date.now();
  const { error: e1 } = await supabase
    .from('settings')
    .upsert({ key: 'metric1', value: String(value) });
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('settings')
    .upsert({ key: 'metric1Ts', value: String(ts) });
  if (e2) throw e2;

  return { value, ts };
}

// ---------- Stats ----------

/** GET /api/stats/lost */
export async function getLostCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'left');
  if (error) throw error;
  return count ?? 0;
}

// ---------- Admin ----------

/** GET /api/admin/snapshot */
export async function getAdminSnapshot(): Promise<{
  metric1: number;
  counts: {
    total: number;
    waiting: number;
    checked_in: number;
    left: number;
    served: number;
  };
  lastIssued: number;
}> {
  const { data, error } = await supabase.rpc('admin_snapshot');
  if (error) throw error;
  return data;
}

// ---------- Dev / Reset ----------

/** POST /api/dev/reset */
export async function resetQueue(): Promise<void> {
  const { error } = await supabase.rpc('reset_queue');
  if (error) throw error;
}

// ---------- Realtime helpers ----------

/**
 * Subscribe to changes on the `settings` table.
 * Useful for live updates of NOW SERVING across tabs/devices.
 */
export function onSettingsChange(
  callback: (payload: { key: string; value: string }) => void
) {
  const channel = supabase
    .channel('settings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings' },
      (payload) => {
        const row = payload.new as { key: string; value: string } | undefined;
        if (row) callback(row);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to changes on the `tickets` table.
 * Useful for admin to see live queue changes.
 */
export function onTicketsChange(
  callback: (payload: unknown) => void
) {
  const channel = supabase
    .channel('tickets-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
