-- qME Headshot ticket/check-in linkage repair.
-- Run after the guest-session and queue hardening migrations.
--
-- Why this exists:
-- - Headshot queue tickets need to remember the event_check_in they came from.
-- - Admin "Mark Served" consumes the Headshot credit only when that check-in id
--   is available.
-- - Existing completed Headshot tickets are reconciled conservatively so exports
--   reflect credits used by either guest self-completion or staff completion.

alter table public.tickets
  add column if not exists check_in_id uuid references public.event_check_ins(id) on delete set null;

create index if not exists tickets_check_in_id_idx
  on public.tickets(check_in_id)
  where check_in_id is not null;

drop function if exists public.next_ticket_for_queue(uuid, text);

create or replace function public.next_ticket_for_queue(
  p_queue_id uuid,
  p_guest_token text,
  p_check_in_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_ticket jsonb;
  resolved_ticket_id bigint;
  resolved_session_id uuid;
  resolved_event_id uuid;
  check_in_event_id uuid;
  check_in_session_id uuid;
  check_in_status text;
  existing_check_in_id uuid;
begin
  select event_id into resolved_event_id
  from public.queues
  where id = p_queue_id;

  if resolved_event_id is null then
    raise exception 'queue not found';
  end if;

  resolved_session_id := public.ensure_guest_session(resolved_event_id, p_guest_token);

  if p_check_in_id is not null then
    select event_id, guest_session_id, status
      into check_in_event_id, check_in_session_id, check_in_status
    from public.event_check_ins
    where id = p_check_in_id;

    if check_in_event_id is null then
      raise exception 'check-in not found';
    end if;

    if check_in_event_id <> resolved_event_id then
      raise exception 'check-in belongs to a different event';
    end if;

    if check_in_session_id is null or check_in_session_id <> resolved_session_id then
      raise exception 'check-in belongs to a different guest session';
    end if;

    if check_in_status <> 'completed' then
      raise exception 'check-in must be completed before joining this queue';
    end if;
  end if;

  resolved_ticket := to_jsonb(public.next_ticket_for_queue(p_queue_id));
  if jsonb_typeof(resolved_ticket) = 'number' then
    resolved_ticket_id := (resolved_ticket #>> '{}')::bigint;
  else
    resolved_ticket_id := coalesce(
      nullif(resolved_ticket ->> 'id', '')::bigint,
      nullif(resolved_ticket ->> 'ticket_number', '')::bigint
    );
  end if;

  if resolved_ticket_id is null then
    raise exception 'ticket could not be resolved';
  end if;

  select check_in_id into existing_check_in_id
  from public.tickets
  where id = resolved_ticket_id
    and queue_id = p_queue_id;

  if p_check_in_id is not null
    and existing_check_in_id is not null
    and existing_check_in_id <> p_check_in_id then
    raise exception 'ticket belongs to a different check-in';
  end if;

  update public.tickets
  set
    guest_session_id = coalesce(guest_session_id, resolved_session_id),
    check_in_id = coalesce(check_in_id, p_check_in_id)
  where id = resolved_ticket_id
    and queue_id = p_queue_id;

  return resolved_ticket;
end;
$$;

revoke all on function public.next_ticket_for_queue(uuid, text, uuid) from public;
grant execute on function public.next_ticket_for_queue(uuid, text, uuid) to anon, authenticated;

-- Reconcile old completed Headshot tickets to their check-ins when the name is
-- unique within the event. Duplicate-name cases are intentionally skipped.
with unique_completed_check_ins as (
  select
    event_id,
    lower(trim(first_name)) as normalized_first_name,
    lower(trim(last_name)) as normalized_last_name,
    (array_agg(id))[1] as check_in_id
  from public.event_check_ins
  where status = 'completed'
    and nullif(trim(first_name), '') is not null
    and nullif(trim(last_name), '') is not null
  group by event_id, lower(trim(first_name)), lower(trim(last_name))
  having count(*) = 1
),
completed_headshot_tickets as (
  select
    tickets.id,
    queues.event_id,
    lower(trim(tickets.first_name)) as normalized_first_name,
    lower(trim(tickets.last_name)) as normalized_last_name
  from public.tickets
  join public.queues on queues.id = tickets.queue_id
  where queues.slug = 'headshot-photo-station'
    and tickets.stage = 'completed'
    and tickets.check_in_id is null
    and nullif(trim(tickets.first_name), '') is not null
    and nullif(trim(tickets.last_name), '') is not null
)
update public.tickets
set check_in_id = unique_completed_check_ins.check_in_id
from completed_headshot_tickets
join unique_completed_check_ins
  on unique_completed_check_ins.event_id = completed_headshot_tickets.event_id
  and unique_completed_check_ins.normalized_first_name = completed_headshot_tickets.normalized_first_name
  and unique_completed_check_ins.normalized_last_name = completed_headshot_tickets.normalized_last_name
where tickets.id = completed_headshot_tickets.id;

with completed_headshot_check_ins as (
  select distinct tickets.check_in_id
  from public.tickets
  join public.queues on queues.id = tickets.queue_id
  where queues.slug = 'headshot-photo-station'
    and tickets.stage = 'completed'
    and tickets.check_in_id is not null
  union
  select distinct check_in_id
  from public.event_guest_marks
  where mark_key in ('professional_headshot_complete', 'headshot_service_started')
    and check_in_id is not null
)
update public.event_guest_credits
set
  used_quantity = greatest(used_quantity, least(quantity, 1)),
  updated_at = now()
from completed_headshot_check_ins
where event_guest_credits.check_in_id = completed_headshot_check_ins.check_in_id
  and event_guest_credits.credit_key = 'professional_headshot'
  and event_guest_credits.quantity > 0
  and event_guest_credits.used_quantity < 1;

notify pgrst, 'reload schema';
