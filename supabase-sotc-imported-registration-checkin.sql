-- qME SOTC imported registration guest check-in.
-- Run after:
-- - supabase-sotc-imported-registrations.sql
-- - supabase-pre-sotc-bounded-security-fixes.sql
--
-- Intent:
-- - let invited SOTC guests find and claim their imported registration
-- - complete event check-in from the authoritative imported record
-- - grant Headshot credit only from the imported Headshot entitlement
-- - keep imported attendee records separate from guest browser identity

create or replace function public.mask_imported_registration_email(
  p_email text
)
returns text
language sql
stable
as $$
  select case
    when nullif(trim(coalesce(p_email, '')), '') is null then null
    when position('@' in p_email) <= 1 then '***'
    else left(split_part(lower(trim(p_email)), '@', 1), 1) || '***@' || split_part(lower(trim(p_email)), '@', 2)
  end
$$;

create or replace function public.search_event_imported_registrations_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_query text,
  p_limit integer default 8
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  email_hint text,
  headshot_entitled boolean,
  already_checked_in boolean,
  requires_email_confirmation boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  search_text text;
  result_limit integer;
begin
  perform public.ensure_guest_session(p_event_id, p_guest_token);

  search_text := lower(trim(coalesce(p_query, '')));
  if length(search_text) < 2 then
    return;
  end if;

  result_limit := least(greatest(coalesce(p_limit, 8), 1), 10);

  return query
  with matches as (
    select
      registrations.*,
      count(*) over (
        partition by
          lower(trim(registrations.first_name)),
          lower(trim(registrations.last_name))
      ) as matching_name_count
    from public.event_imported_registrations registrations
    where registrations.event_id = p_event_id
      and registrations.review_status = 'ready'
      and (
        position(search_text in lower(registrations.first_name)) > 0
        or position(search_text in lower(registrations.last_name)) > 0
        or position(search_text in lower(trim(registrations.first_name || ' ' || registrations.last_name))) > 0
      )
  )
  select
    matches.id,
    matches.first_name,
    matches.last_name,
    public.mask_imported_registration_email(matches.email) as email_hint,
    matches.headshot_entitled,
    matches.linked_check_in_id is not null as already_checked_in,
    matches.matching_name_count > 1 as requires_email_confirmation
  from matches
  order by
    matches.linked_check_in_id is not null,
    lower(matches.last_name),
    lower(matches.first_name),
    matches.source_row_number nulls last
  limit result_limit;
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
    status
  )
  values (
    p_event_id,
    session_id,
    registration_row.first_name,
    registration_row.last_name,
    null,
    'general',
    'completed'
  )
  returning * into check_in_row;

  update public.event_imported_registrations
  set
    checked_in_at = now(),
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

revoke all on function public.mask_imported_registration_email(text) from public;
grant execute on function public.mask_imported_registration_email(text) to anon, authenticated;

revoke all on function public.search_event_imported_registrations_for_guest(uuid, text, text, integer) from public;
grant execute on function public.search_event_imported_registrations_for_guest(uuid, text, text, integer) to anon, authenticated;

revoke all on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) from public;
grant execute on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;
