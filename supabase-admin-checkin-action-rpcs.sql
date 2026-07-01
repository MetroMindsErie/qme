-- qME admin/staff event check-in action RPCs.
-- Run after:
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-guest-action-rls-tightening.sql
--
-- Intent:
-- - move sensitive check-in staff actions behind named SECURITY DEFINER RPCs
-- - check the actor's event role server-side
-- - reduce browser reliance on broad direct event_check_ins/event_guest_credits mutations

grant usage on schema public to authenticated;

create or replace function public.admin_complete_event_check_in(
  p_check_in_id uuid,
  p_ticket_type text default null
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  target_org_id uuid;
  actor_id uuid;
begin
  select *
    into check_in_row
  from public.event_check_ins
  where id = p_check_in_id;

  if check_in_row.id is null then
    raise exception 'check-in not found';
  end if;

  if not public.can_manage_event_guest_action(check_in_row.event_id) then
    raise exception 'not allowed to complete this check-in';
  end if;

  select organization_id
    into target_org_id
  from public.events
  where id = check_in_row.event_id;

  update public.event_check_ins
  set
    status = 'completed',
    ticket_type = coalesce(p_ticket_type, ticket_type)
  where id = p_check_in_id
  returning * into check_in_row;

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
      check_in_row.event_id,
      actor_id,
      'event_check_in.complete',
      'event_check_in',
      p_check_in_id::text,
      jsonb_build_object('ticket_type', p_ticket_type)
    );
  end if;

  return check_in_row;
end;
$$;

create or replace function public.admin_update_event_check_in_ticket_type(
  p_check_in_id uuid,
  p_ticket_type text
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  target_org_id uuid;
  actor_id uuid;
begin
  select *
    into check_in_row
  from public.event_check_ins
  where id = p_check_in_id;

  if check_in_row.id is null then
    raise exception 'check-in not found';
  end if;

  if not public.can_manage_event_guest_action(check_in_row.event_id) then
    raise exception 'not allowed to update this check-in';
  end if;

  select organization_id
    into target_org_id
  from public.events
  where id = check_in_row.event_id;

  update public.event_check_ins
  set ticket_type = p_ticket_type
  where id = p_check_in_id
  returning * into check_in_row;

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
      check_in_row.event_id,
      actor_id,
      'event_check_in.ticket_type_update',
      'event_check_in',
      p_check_in_id::text,
      jsonb_build_object('ticket_type', p_ticket_type)
    );
  end if;

  return check_in_row;
end;
$$;

create or replace function public.admin_grant_guest_credit_for_check_in(
  p_check_in_id uuid,
  p_credit_key text,
  p_quantity integer default 1,
  p_metadata jsonb default '{}'::jsonb
)
returns public.event_guest_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  credit_row public.event_guest_credits;
  target_org_id uuid;
  actor_id uuid;
begin
  select *
    into check_in_row
  from public.event_check_ins
  where id = p_check_in_id;

  if check_in_row.id is null then
    raise exception 'check-in not found';
  end if;

  if not public.can_manage_event_guest_action(check_in_row.event_id) then
    raise exception 'not allowed to grant this guest credit';
  end if;

  if coalesce(p_quantity, 0) < 0 then
    raise exception 'quantity must be non-negative';
  end if;

  select organization_id
    into target_org_id
  from public.events
  where id = check_in_row.event_id;

  select *
    into credit_row
  from public.event_guest_credits
  where check_in_id = p_check_in_id
    and credit_key = p_credit_key;

  if credit_row.id is not null then
    update public.event_guest_credits
    set
      quantity = coalesce(p_quantity, quantity),
      source = 'staff',
      metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
      updated_at = now()
    where id = credit_row.id
    returning * into credit_row;
  else
    insert into public.event_guest_credits (
      event_id,
      check_in_id,
      credit_key,
      quantity,
      source,
      metadata
    )
    values (
      check_in_row.event_id,
      p_check_in_id,
      p_credit_key,
      coalesce(p_quantity, 1),
      'staff',
      coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into credit_row;
  end if;

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
      check_in_row.event_id,
      actor_id,
      'event_guest_credit.grant',
      'event_guest_credit',
      credit_row.id::text,
      jsonb_build_object(
        'check_in_id', p_check_in_id,
        'credit_key', p_credit_key,
        'quantity', credit_row.quantity
      )
    );
  end if;

  return credit_row;
end;
$$;

revoke all on function public.admin_complete_event_check_in(uuid, text) from public;
grant execute on function public.admin_complete_event_check_in(uuid, text) to authenticated;

revoke all on function public.admin_update_event_check_in_ticket_type(uuid, text) from public;
grant execute on function public.admin_update_event_check_in_ticket_type(uuid, text) to authenticated;

revoke all on function public.admin_grant_guest_credit_for_check_in(uuid, text, integer, jsonb) from public;
grant execute on function public.admin_grant_guest_credit_for_check_in(uuid, text, integer, jsonb) to authenticated;
