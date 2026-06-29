import { supabase } from './supabase';
import type {
  CreateEventGroupOrderItemInput,
  EventGroupOrderItem,
} from '../types';

function normalizeItem(row: EventGroupOrderItem): EventGroupOrderItem {
  return {
    ...row,
    item_name: row.item_name ?? '',
    notes: row.notes ?? '',
    quantity: Number(row.quantity ?? 0),
    status: row.status ?? 'gathering',
    metadata: row.metadata ?? {},
    ordered_at: row.ordered_at ?? null,
  };
}

export async function createGroupOrderItem(
  input: CreateEventGroupOrderItemInput
): Promise<EventGroupOrderItem> {
  const { data, error } = await supabase
    .from('event_group_order_items')
    .insert({
      event_id: input.event_id,
      check_in_id: input.check_in_id,
      item_name: input.item_name.trim(),
      quantity: input.quantity,
      notes: input.notes?.trim() || '',
      status: 'gathering',
      source: 'guest',
    })
    .select()
    .single();
  if (error) throw error;
  return normalizeItem(data as EventGroupOrderItem);
}

export async function markGroupOrderItemsOrdered(
  ids: string[]
): Promise<EventGroupOrderItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('event_group_order_items')
    .update({ status: 'ordered', ordered_at: new Date().toISOString() })
    .in('id', ids)
    .select();
  if (error) throw error;
  return ((data ?? []) as EventGroupOrderItem[]).map(normalizeItem);
}

export async function listGroupOrderItemsForCheckIn(
  checkInId: string
): Promise<EventGroupOrderItem[]> {
  const { data, error } = await supabase
    .from('event_group_order_items')
    .select('*')
    .eq('check_in_id', checkInId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as EventGroupOrderItem[]).map(normalizeItem);
}

export async function listGroupOrderItemsForEvent(
  eventId: string
): Promise<EventGroupOrderItem[]> {
  const { data, error } = await supabase
    .from('event_group_order_items')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as EventGroupOrderItem[]).map(normalizeItem);
}

export async function updateGroupOrderItemQuantity(
  id: string,
  quantity: number
): Promise<EventGroupOrderItem> {
  const { data, error } = await supabase
    .from('event_group_order_items')
    .update({ quantity })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeItem(data as EventGroupOrderItem);
}

export function onGroupOrderItemsChange(eventId: string, callback: () => void) {
  const channel = supabase
    .channel(`event-group-order-items-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_group_order_items',
        filter: `event_id=eq.${eventId}`,
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
