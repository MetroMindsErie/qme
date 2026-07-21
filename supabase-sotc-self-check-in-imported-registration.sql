-- qMe SOTC imported-registration self check-in.
-- Run after supabase-sotc-registration-live-confirmation.sql.
--
-- Tanya July 21 direction:
-- - matched imported registrations self check in immediately
-- - guests are then told to pick up their physical name tag at registration
-- - Needs Help/manual fallback remains pending staff resolution

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
    'completed',
    jsonb_build_object(
      'source', 'imported_registration_claim',
      'needs_help', false,
      'registration_match_status', 'matched',
      'imported_registration_id', registration_row.id,
      'import_source', registration_row.import_source,
      'headshot_entitled', registration_row.headshot_entitled,
      'guest_self_checked_in_at', now()
    )
  )
  returning * into check_in_row;

  update public.event_imported_registrations
  set
    linked_check_in_id = check_in_row.id,
    linked_guest_session_id = session_id,
    checked_in_at = coalesce(checked_in_at, now()),
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

grant execute on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;
