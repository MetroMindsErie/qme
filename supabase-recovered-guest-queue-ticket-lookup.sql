-- qMe recovered guest queue-ticket lookup.
-- Run after supabase-sotc-already-checked-in-recovery.sql and guest-session hardening.
--
-- Purpose:
-- When a guest recovers an existing event check-in on a browser that has lost
-- local queue-ticket storage, the guest app needs to find any existing ticket
-- owned by the recovered guest session instead of offering a duplicate Join.

create or replace function public.get_active_queue_ticket_for_guest(
  p_event_id uuid,
  p_queue_id uuid,
  p_guest_token text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_session_id uuid;
  queue_event_id uuid;
  ticket_row public.tickets;
begin
  if p_event_id is null or p_queue_id is null then
    raise exception 'Event and queue are required.';
  end if;

  select q.event_id
    into queue_event_id
  from public.queues q
  where q.id = p_queue_id;

  if queue_event_id is null then
    raise exception 'Queue not found.';
  end if;

  if queue_event_id is distinct from p_event_id then
    raise exception 'Queue does not belong to event.';
  end if;

  resolved_session_id := public.ensure_guest_session(p_event_id, p_guest_token);

  select t.*
    into ticket_row
  from public.tickets t
  where t.queue_id = p_queue_id
    and t.guest_session_id = resolved_session_id
    and coalesce(t.status, 'active') <> 'left'
    and coalesce(t.stage, 'waiting') not in ('cancelled', 'left')
  order by
    case coalesce(t.stage, 'waiting')
      when 'released' then 1
      when 'standby' then 2
      when 'waiting' then 3
      when 'completed' then 4
      else 5
    end,
    coalesce(t.stage_updated_at, t.completed_at, t.created_at) desc,
    t.id desc
  limit 1;

  return ticket_row;
end;
$$;

revoke all on function public.get_active_queue_ticket_for_guest(uuid, uuid, text) from public;
grant execute on function public.get_active_queue_ticket_for_guest(uuid, uuid, text) to anon, authenticated;
