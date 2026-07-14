-- qME Headshot guest-service acknowledgement prototype.
-- Run after supabase-guest-action-rls-tightening.sql.
--
-- This records "I've Been Called" / service-start acknowledgement as a durable
-- event_guest_mark without introducing a new ticket stage.

create or replace function public.mark_queue_service_started_for_guest(
  p_event_id uuid,
  p_ticket_id bigint,
  p_guest_token text,
  p_mark_key text default 'headshot_service_started',
  p_check_in_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.event_guest_marks
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  check_in_row public.event_check_ins;
  ticket_event_id uuid;
  mark_row public.event_guest_marks;
begin
  ticket_row := public.get_ticket_for_guest(p_ticket_id, p_guest_token);

  select q.event_id
    into ticket_event_id
  from public.queues q
  where q.id = ticket_row.queue_id;

  if ticket_event_id is distinct from p_event_id then
    raise exception 'ticket does not belong to the requested event';
  end if;

  if ticket_row.stage is distinct from 'released' then
    raise exception 'service can only be started after the guest is called';
  end if;

  if p_check_in_id is not null then
    check_in_row := public.get_event_check_in_for_guest(p_check_in_id, p_guest_token);
    if check_in_row.event_id is distinct from p_event_id then
      raise exception 'check-in does not belong to the requested event';
    end if;
  end if;

  insert into public.event_guest_marks (
    event_id,
    ticket_id,
    check_in_id,
    mark_key,
    mark_value,
    source,
    metadata
  )
  values (
    p_event_id,
    p_ticket_id,
    p_check_in_id,
    coalesce(nullif(p_mark_key, ''), 'headshot_service_started'),
    'started',
    'guest',
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (ticket_id, mark_key) where ticket_id is not null do update
  set
    check_in_id = coalesce(event_guest_marks.check_in_id, excluded.check_in_id),
    mark_value = event_guest_marks.mark_value,
    source = event_guest_marks.source,
    metadata = event_guest_marks.metadata || excluded.metadata
  returning * into mark_row;

  return mark_row;
end;
$$;

create or replace function public.get_queue_service_mark_for_guest(
  p_event_id uuid,
  p_ticket_id bigint,
  p_guest_token text,
  p_mark_key text default 'headshot_service_started'
)
returns public.event_guest_marks
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  ticket_event_id uuid;
  mark_row public.event_guest_marks;
begin
  ticket_row := public.get_ticket_for_guest(p_ticket_id, p_guest_token);

  select q.event_id
    into ticket_event_id
  from public.queues q
  where q.id = ticket_row.queue_id;

  if ticket_event_id is distinct from p_event_id then
    raise exception 'ticket does not belong to the requested event';
  end if;

  select *
    into mark_row
  from public.event_guest_marks
  where event_id = p_event_id
    and ticket_id = p_ticket_id
    and mark_key = coalesce(nullif(p_mark_key, ''), 'headshot_service_started')
  limit 1;

  if mark_row.id is null then
    return null;
  end if;

  return mark_row;
end;
$$;

revoke all on function public.mark_queue_service_started_for_guest(uuid, bigint, text, text, uuid, jsonb) from public;
grant execute on function public.mark_queue_service_started_for_guest(uuid, bigint, text, text, uuid, jsonb) to anon, authenticated;

revoke all on function public.get_queue_service_mark_for_guest(uuid, bigint, text, text) from public;
grant execute on function public.get_queue_service_mark_for_guest(uuid, bigint, text, text) to anon, authenticated;
