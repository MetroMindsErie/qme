-- qME admin/staff queue action RPCs.
-- Run after:
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-sotc-queue-pilot.sql
-- - supabase-queue-auto-flow-rpc.sql
--
-- Intent:
-- - move sensitive queue staff actions behind named SECURITY DEFINER RPCs
-- - check the actor's event/queue role server-side
-- - reduce browser reliance on broad direct ticket/mark/credit updates

grant usage on schema public to authenticated;

create or replace function public.can_manage_queue_guest_action(
  target_event_id uuid,
  target_queue_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_event_staff_role(
    target_event_id,
    array['event_admin', 'check_in_staff', 'service_staff', 'service_provider', 'station_account'],
    target_queue_id,
    null
  )
$$;

create or replace function public.admin_release_queue_ticket(
  p_ticket_id bigint
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  target_event_id uuid;
  target_org_id uuid;
  actor_id uuid;
begin
  select *
    into ticket_row
  from public.tickets
  where id = p_ticket_id;

  if ticket_row.id is null then
    raise exception 'ticket not found';
  end if;

  select q.event_id, e.organization_id
    into target_event_id, target_org_id
  from public.queues q
  join public.events e on e.id = q.event_id
  where q.id = ticket_row.queue_id;

  if not public.can_manage_queue_guest_action(target_event_id, ticket_row.queue_id) then
    raise exception 'not allowed to release this ticket';
  end if;

  update public.tickets
  set
    stage = 'released',
    gathering_snoozed_at = null,
    released_at = now()
  where id = p_ticket_id
  returning * into ticket_row;

  actor_id := public.current_admin_principal_id();
  if actor_id is not null then
    insert into public.admin_audit_logs (
      organization_id,
      event_id,
      actor_principal_id,
      action,
      target_type,
      target_id,
      metadata
    )
    values (
      target_org_id,
      target_event_id,
      actor_id,
      'queue.ticket_release',
      'ticket',
      p_ticket_id::text,
      jsonb_build_object('queue_id', ticket_row.queue_id)
    );
  end if;

  return ticket_row;
end;
$$;

create or replace function public.admin_return_queue_ticket_to_waiting(
  p_ticket_id bigint,
  p_reason text default 'staff_return'
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  target_event_id uuid;
  target_org_id uuid;
  actor_id uuid;
begin
  select *
    into ticket_row
  from public.tickets
  where id = p_ticket_id;

  if ticket_row.id is null then
    raise exception 'ticket not found';
  end if;

  select q.event_id, e.organization_id
    into target_event_id, target_org_id
  from public.queues q
  join public.events e on e.id = q.event_id
  where q.id = ticket_row.queue_id;

  if not public.can_manage_queue_guest_action(target_event_id, ticket_row.queue_id) then
    raise exception 'not allowed to return this ticket';
  end if;

  update public.tickets
  set
    stage = 'waiting',
    gathering_snoozed_at = now(),
    nearby_confirmed_at = null,
    released_at = null
  where id = p_ticket_id
  returning * into ticket_row;

  perform public.apply_queue_pilot_flow(ticket_row.queue_id);

  actor_id := public.current_admin_principal_id();
  if actor_id is not null then
    insert into public.admin_audit_logs (
      organization_id,
      event_id,
      actor_principal_id,
      action,
      target_type,
      target_id,
      metadata
    )
    values (
      target_org_id,
      target_event_id,
      actor_id,
      'queue.ticket_return_to_waiting',
      'ticket',
      p_ticket_id::text,
      jsonb_build_object('queue_id', ticket_row.queue_id, 'reason', coalesce(p_reason, 'staff_return'))
    );
  end if;

  return ticket_row;
end;
$$;

create or replace function public.admin_mark_queue_ticket_not_here(
  p_ticket_id bigint
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.admin_return_queue_ticket_to_waiting(p_ticket_id, 'not_here');
end;
$$;

create or replace function public.admin_complete_queue_ticket(
  p_event_id uuid,
  p_ticket_id bigint,
  p_mark_key text,
  p_mark_value text default 'completed',
  p_check_in_id uuid default null,
  p_consume_credit_key text default null,
  p_credit_guest_name text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.event_guest_marks
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  target_event_id uuid;
  target_org_id uuid;
  actor_id uuid;
  existing_mark_id uuid;
  mark_row public.event_guest_marks;
  credit_row public.event_guest_credits;
begin
  select *
    into ticket_row
  from public.tickets
  where id = p_ticket_id;

  if ticket_row.id is null then
    raise exception 'ticket not found';
  end if;

  select q.event_id, e.organization_id
    into target_event_id, target_org_id
  from public.queues q
  join public.events e on e.id = q.event_id
  where q.id = ticket_row.queue_id;

  if target_event_id is distinct from p_event_id then
    raise exception 'ticket does not belong to event';
  end if;

  if not public.can_manage_queue_guest_action(target_event_id, ticket_row.queue_id) then
    raise exception 'not allowed to complete this ticket';
  end if;

  update public.tickets
  set
    stage = 'completed',
    status = 'served',
    gathering_snoozed_at = null,
    completed_at = now()
  where id = p_ticket_id
  returning * into ticket_row;

  select id
    into existing_mark_id
  from public.event_guest_marks
  where ticket_id = p_ticket_id
    and mark_key = p_mark_key
  limit 1;

  if existing_mark_id is not null then
    update public.event_guest_marks
    set
      event_id = p_event_id,
      ticket_id = p_ticket_id,
      check_in_id = p_check_in_id,
      mark_key = p_mark_key,
      mark_value = coalesce(p_mark_value, 'completed'),
      source = 'admin',
      metadata = coalesce(p_metadata, '{}'::jsonb)
    where id = existing_mark_id
    returning * into mark_row;
  else
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
      p_mark_key,
      coalesce(p_mark_value, 'completed'),
      'admin',
      coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into mark_row;
  end if;

  if p_consume_credit_key is not null then
    if p_check_in_id is null then
      raise exception 'check-in identity is required to consume guest credit';
    end if;

    select *
      into credit_row
    from public.event_guest_credits credits
    where credits.event_id = p_event_id
      and credits.credit_key = p_consume_credit_key
      and credits.used_quantity < credits.quantity
      and credits.check_in_id = p_check_in_id
    order by credits.created_at
    limit 1;

    if credit_row.id is not null then
      update public.event_guest_credits
      set
        used_quantity = used_quantity + 1,
        updated_at = now()
      where id = credit_row.id;
    end if;
  end if;

  perform public.apply_queue_pilot_flow(ticket_row.queue_id);

  actor_id := public.current_admin_principal_id();
  if actor_id is not null then
    insert into public.admin_audit_logs (
      organization_id,
      event_id,
      actor_principal_id,
      action,
      target_type,
      target_id,
      metadata
    )
    values (
      target_org_id,
      target_event_id,
      actor_id,
      'queue.ticket_complete',
      'ticket',
      p_ticket_id::text,
      jsonb_build_object(
        'queue_id', ticket_row.queue_id,
        'mark_key', p_mark_key,
        'consume_credit_key', p_consume_credit_key
      )
    );
  end if;

  return mark_row;
end;
$$;

revoke all on function public.can_manage_queue_guest_action(uuid, uuid) from public;
grant execute on function public.can_manage_queue_guest_action(uuid, uuid) to authenticated;

revoke all on function public.admin_release_queue_ticket(bigint) from public;
revoke all on function public.admin_release_queue_ticket(bigint) from anon;
grant execute on function public.admin_release_queue_ticket(bigint) to authenticated;

revoke all on function public.admin_return_queue_ticket_to_waiting(bigint, text) from public;
revoke all on function public.admin_return_queue_ticket_to_waiting(bigint, text) from anon;
grant execute on function public.admin_return_queue_ticket_to_waiting(bigint, text) to authenticated;

revoke all on function public.admin_mark_queue_ticket_not_here(bigint) from public;
revoke all on function public.admin_mark_queue_ticket_not_here(bigint) from anon;
grant execute on function public.admin_mark_queue_ticket_not_here(bigint) to authenticated;

revoke all on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) from public;
revoke all on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) from anon;
grant execute on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) to authenticated;
