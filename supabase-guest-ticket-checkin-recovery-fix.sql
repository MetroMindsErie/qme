-- qMe guest ticket recovery fix.
--
-- Purpose:
-- A recovered guest check-in can own a queue ticket through tickets.check_in_id
-- even when tickets.guest_session_id was not attached yet. Guest queue pages
-- must still recover and read that authoritative ticket state.

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
    and coalesce(t.status, 'active') <> 'left'
    and coalesce(t.stage, 'waiting') not in ('cancelled', 'left')
    and (
      t.guest_session_id = resolved_session_id
      or exists (
        select 1
        from public.event_check_ins eci
        where eci.id = t.check_in_id
          and eci.event_id = p_event_id
          and eci.guest_session_id = resolved_session_id
      )
    )
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

  if ticket_row.id is not null and ticket_row.guest_session_id is null then
    update public.tickets
    set guest_session_id = resolved_session_id
    where id = ticket_row.id
      and guest_session_id is null
    returning * into ticket_row;
  end if;

  return ticket_row;
end;
$$;

create or replace function public.get_ticket_for_guest(
  p_ticket_id bigint,
  p_guest_token text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  ticket_event_id uuid;
  resolved_session_id uuid;
begin
  select t.*
    into ticket_row
  from public.tickets t
  where t.id = p_ticket_id;

  if ticket_row.id is null then
    raise exception 'ticket not found';
  end if;

  select q.event_id
    into ticket_event_id
  from public.queues q
  where q.id = ticket_row.queue_id;

  resolved_session_id := public.ensure_guest_session(ticket_event_id, p_guest_token);

  if ticket_row.guest_session_id is distinct from resolved_session_id
    and not exists (
      select 1
      from public.event_check_ins eci
      where eci.id = ticket_row.check_in_id
        and eci.event_id = ticket_event_id
        and eci.guest_session_id = resolved_session_id
    )
  then
    raise exception 'ticket belongs to a different guest session';
  end if;

  if ticket_row.guest_session_id is null then
    update public.tickets
    set guest_session_id = resolved_session_id
    where id = p_ticket_id
      and guest_session_id is null
    returning * into ticket_row;
  end if;

  return ticket_row;
end;
$$;

revoke all on function public.get_active_queue_ticket_for_guest(uuid, uuid, text) from public;
grant execute on function public.get_active_queue_ticket_for_guest(uuid, uuid, text) to anon, authenticated;

revoke all on function public.get_ticket_for_guest(bigint, text) from public;
grant execute on function public.get_ticket_for_guest(bigint, text) to anon, authenticated;
