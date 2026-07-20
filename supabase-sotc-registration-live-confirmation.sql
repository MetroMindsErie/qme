-- qME SOTC registration live-confirmation refinement.
-- Run after:
-- - supabase-sotc-imported-registrations.sql
-- - supabase-sotc-imported-registration-checkin.sql
-- - supabase-admin-checkin-action-rpcs.sql
--
-- Intent:
-- - guest self check-in means "arrived/submitted", not fully checked in
-- - staff completes check-in after finding the guest's name tag/sticker
-- - fallback guests appear in the same live check-in list, marked needs-help

alter table public.event_check_ins
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.create_event_check_in_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_first_name text,
  p_last_name text,
  p_code text default null,
  p_email text default null,
  p_phone text default null,
  p_needs_help boolean default false
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_session_id uuid;
  created_row public.event_check_ins;
begin
  resolved_session_id := public.ensure_guest_session(
    p_event_id,
    p_guest_token,
    p_first_name,
    p_last_name,
    p_email,
    p_phone
  );

  insert into public.event_check_ins (
    event_id,
    guest_session_id,
    first_name,
    last_name,
    code,
    status,
    metadata
  )
  values (
    p_event_id,
    resolved_session_id,
    trim(coalesce(p_first_name, '')),
    trim(coalesce(p_last_name, '')),
    nullif(trim(coalesce(p_code, '')), ''),
    'waiting',
    jsonb_build_object(
      'source', 'guest_self_check_in',
      'needs_help', coalesce(p_needs_help, false),
      'registration_match_status', case when coalesce(p_needs_help, false) then 'needs_help' else 'manual' end
    )
  )
  returning * into created_row;

  return created_row;
end;
$$;

create or replace function public.create_event_check_in_from_imported_registration_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_imported_registration_id uuid,
  p_email_confirmation text default null,
  p_phone text default null
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  session_id uuid;
  registration_row public.event_imported_registrations;
  check_in_row public.event_check_ins;
  duplicate_name_count integer;
  normalized_confirmation text;
begin
  if p_imported_registration_id is null then
    raise exception 'registration selection is required';
  end if;

  select *
    into registration_row
  from public.event_imported_registrations
  where id = p_imported_registration_id
    and event_id = p_event_id
    and review_status = 'ready'
  for update;

  if registration_row.id is null then
    raise exception 'registration not found';
  end if;

  session_id := public.ensure_guest_session(
    p_event_id,
    p_guest_token,
    registration_row.first_name,
    registration_row.last_name,
    registration_row.normalized_email,
    p_phone
  );

  if registration_row.linked_check_in_id is not null then
    select *
      into check_in_row
    from public.event_check_ins
    where id = registration_row.linked_check_in_id;

    if check_in_row.id is not null
      and check_in_row.guest_session_id = session_id then
      return check_in_row;
    end if;

    raise exception 'this registration has already been checked in';
  end if;

  select count(*)
    into duplicate_name_count
  from public.event_imported_registrations
  where event_id = p_event_id
    and review_status = 'ready'
    and lower(trim(first_name)) = lower(trim(registration_row.first_name))
    and lower(trim(last_name)) = lower(trim(registration_row.last_name));

  normalized_confirmation := lower(trim(coalesce(p_email_confirmation, '')));
  if duplicate_name_count > 1
    and normalized_confirmation is distinct from registration_row.normalized_email then
    raise exception 'email confirmation is required for this name';
  end if;

  insert into public.event_check_ins (
    event_id,
    guest_session_id,
    first_name,
    last_name,
    code,
    ticket_type,
    status,
    metadata
  )
  values (
    p_event_id,
    session_id,
    registration_row.first_name,
    registration_row.last_name,
    null,
    'general',
    'waiting',
    jsonb_build_object(
      'source', 'imported_registration_claim',
      'needs_help', false,
      'registration_match_status', 'matched',
      'imported_registration_id', registration_row.id,
      'import_source', registration_row.import_source,
      'headshot_entitled', registration_row.headshot_entitled
    )
  )
  returning * into check_in_row;

  update public.event_imported_registrations
  set
    linked_check_in_id = check_in_row.id,
    linked_guest_session_id = session_id,
    updated_at = now()
  where id = registration_row.id;

  update public.guest_sessions
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'imported_registration_id', registration_row.id,
      'import_source', registration_row.import_source
    ),
    last_seen_at = now()
  where id = session_id;

  if registration_row.headshot_entitled then
    insert into public.event_guest_credits (
      event_id,
      check_in_id,
      credit_key,
      quantity,
      used_quantity,
      source,
      metadata
    )
    values (
      p_event_id,
      check_in_row.id,
      'professional_headshot',
      1,
      0,
      'import',
      jsonb_build_object(
        'imported_registration_id', registration_row.id,
        'external_attendee_id', registration_row.external_attendee_id,
        'source_price_tier', registration_row.source_price_tier
      )
    )
    on conflict (check_in_id, credit_key) where check_in_id is not null do update
    set
      quantity = greatest(public.event_guest_credits.quantity, excluded.quantity),
      source = excluded.source,
      metadata = coalesce(public.event_guest_credits.metadata, '{}'::jsonb) || excluded.metadata,
      updated_at = now();
  end if;

  return check_in_row;
end;
$$;

create or replace function public.create_needs_help_event_check_in_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_first_name text,
  p_last_name text,
  p_code text default null,
  p_email text default null,
  p_phone text default null
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_session_id uuid;
  created_row public.event_check_ins;
begin
  resolved_session_id := public.ensure_guest_session(
    p_event_id,
    p_guest_token,
    p_first_name,
    p_last_name,
    p_email,
    p_phone
  );

  insert into public.event_check_ins (
    event_id,
    guest_session_id,
    first_name,
    last_name,
    code,
    status,
    metadata
  )
  values (
    p_event_id,
    resolved_session_id,
    trim(coalesce(p_first_name, '')),
    trim(coalesce(p_last_name, '')),
    nullif(trim(coalesce(p_code, '')), ''),
    'waiting',
    jsonb_build_object(
      'source', 'guest_registration_not_found',
      'needs_help', true,
      'registration_match_status', 'needs_help'
    )
  )
  returning * into created_row;

  return created_row;
end;
$$;

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
    ticket_type = coalesce(p_ticket_type, ticket_type),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'needs_help', false,
      'staff_completed_at', now()
    )
  where id = p_check_in_id
  returning * into check_in_row;

  update public.event_imported_registrations
  set
    checked_in_at = coalesce(checked_in_at, now()),
    updated_at = now()
  where linked_check_in_id = p_check_in_id
    and event_id = check_in_row.event_id;

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

create or replace function public.admin_cancel_event_check_in(
  p_check_in_id uuid
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
  unlinked_imported_registration_id uuid;
  previous_status text;
begin
  select *
    into check_in_row
  from public.event_check_ins
  where id = p_check_in_id;

  if check_in_row.id is null then
    raise exception 'check-in not found';
  end if;

  if check_in_row.status not in ('waiting', 'called') then
    raise exception 'only live check-ins can be removed';
  end if;

  previous_status := check_in_row.status;

  if not public.can_manage_event_guest_action(check_in_row.event_id) then
    raise exception 'not allowed to remove this check-in';
  end if;

  select organization_id
    into target_org_id
  from public.events
  where id = check_in_row.event_id;

  update public.event_imported_registrations
  set
    linked_check_in_id = null,
    linked_guest_session_id = null,
    checked_in_at = null,
    updated_at = now()
  where linked_check_in_id = p_check_in_id
    and event_id = check_in_row.event_id
  returning id into unlinked_imported_registration_id;

  update public.event_check_ins
  set
    status = 'cancelled',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'needs_help', false,
      'cancelled_at', now(),
      'cancelled_reason', 'staff_removed_from_live_check_in',
      'imported_registration_unlinked', unlinked_imported_registration_id is not null
    ),
    updated_at = now()
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
      'event_check_in.cancel',
      'event_check_in',
      p_check_in_id::text,
      jsonb_build_object(
        'previous_status', previous_status,
        'imported_registration_id', unlinked_imported_registration_id
      )
    );
  end if;

  return check_in_row;
end;
$$;

revoke all on function public.create_event_check_in_for_guest(uuid, text, text, text, text, text, text, boolean) from public;
grant execute on function public.create_event_check_in_for_guest(uuid, text, text, text, text, text, text, boolean) to anon, authenticated;

revoke all on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) from public;
grant execute on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;

revoke all on function public.create_needs_help_event_check_in_for_guest(uuid, text, text, text, text, text, text) from public;
grant execute on function public.create_needs_help_event_check_in_for_guest(uuid, text, text, text, text, text, text) to anon, authenticated;

revoke all on function public.admin_complete_event_check_in(uuid, text) from public;
revoke all on function public.admin_complete_event_check_in(uuid, text) from anon;
grant execute on function public.admin_complete_event_check_in(uuid, text) to authenticated;

revoke all on function public.admin_cancel_event_check_in(uuid) from public;
revoke all on function public.admin_cancel_event_check_in(uuid) from anon;
grant execute on function public.admin_cancel_event_check_in(uuid) to authenticated;
