-- qME Eventbrite order import + party-size check-in support.
-- Run before importing the production i-Pitch Eventbrite CSV.
--
-- This is intentionally additive. It does not merge imported registrations with
-- qME self-registrations and does not expand multi-ticket orders into fake
-- companion records.

begin;

alter table public.event_imported_registrations
  add column if not exists external_order_id text,
  add column if not exists party_size integer not null default 1;

alter table public.event_imported_registrations
  drop constraint if exists event_imported_registrations_party_size_check;

alter table public.event_imported_registrations
  add constraint event_imported_registrations_party_size_check
  check (party_size >= 1);

update public.event_imported_registrations
set
  external_order_id = coalesce(
    nullif(external_order_id, ''),
    nullif(source_metadata->>'order_id', ''),
    nullif(source_metadata->>'Order ID', ''),
    external_attendee_id
  ),
  party_size = greatest(
    1,
    coalesce(
      case when coalesce(source_metadata->>'party_size', '') ~ '^[0-9]+$' then (source_metadata->>'party_size')::integer end,
      case when coalesce(source_metadata->>'tickets', '') ~ '^[0-9]+$' then (source_metadata->>'tickets')::integer end,
      case when coalesce(source_metadata->>'Tickets', '') ~ '^[0-9]+$' then (source_metadata->>'Tickets')::integer end,
      party_size,
      1
    )
  )
where import_source = 'eventbrite';

create unique index if not exists event_imported_registrations_eventbrite_order_uid
  on public.event_imported_registrations (event_id, import_source, external_order_id)
  where external_order_id is not null;

drop function if exists public.search_event_imported_registrations_for_guest(uuid, text, text, integer);

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
  ticket_hint text,
  party_size integer,
  external_order_id text,
  headshot_entitled boolean,
  already_checked_in boolean,
  requires_email_confirmation boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_query text := lower(trim(coalesce(p_query, '')));
begin
  if p_guest_token is null or length(trim(p_guest_token)) < 12 then
    raise exception 'Guest session is required.';
  end if;

  if length(v_query) < 2 then
    return;
  end if;

  return query
  with matches as (
    select
      registrations.*,
      count(*) over (
        partition by lower(registrations.first_name), lower(registrations.last_name)
      ) as same_name_count,
      exists (
        select 1
        from public.event_check_ins check_ins
        where check_ins.event_id = registrations.event_id
          and check_ins.metadata->>'imported_registration_id' = registrations.id::text
          and check_ins.status = 'completed'
      ) as has_completed_check_in
    from public.event_imported_registrations registrations
    where registrations.event_id = p_event_id
      and registrations.review_status = 'ready'
      and (
        lower(registrations.first_name) like '%' || v_query || '%'
        or lower(registrations.last_name) like '%' || v_query || '%'
        or lower(registrations.normalized_email) like '%' || v_query || '%'
        or lower(registrations.first_name || ' ' || registrations.last_name) like '%' || v_query || '%'
      )
    order by registrations.last_name, registrations.first_name, registrations.created_at
    limit greatest(1, least(coalesce(p_limit, 8), 20))
  )
  select
    matches.id,
    matches.first_name,
    matches.last_name,
    case
      when matches.normalized_email = '' then null
      else left(matches.normalized_email, 2) || repeat('*', greatest(1, position('@' in matches.normalized_email) - 3)) || substring(matches.normalized_email from position('@' in matches.normalized_email))
    end as email_hint,
    coalesce(nullif(matches.source_ticket_type, ''), 'Eventbrite') as ticket_hint,
    greatest(1, coalesce(matches.party_size, 1)) as party_size,
    matches.external_order_id,
    coalesce(matches.headshot_entitled, false) as headshot_entitled,
    matches.has_completed_check_in as already_checked_in,
    matches.same_name_count > 1 as requires_email_confirmation
  from matches;
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
  v_registration public.event_imported_registrations;
  v_same_name_count integer;
  v_check_in public.event_check_ins;
begin
  if p_guest_token is null or length(trim(p_guest_token)) < 12 then
    raise exception 'Guest session is required.';
  end if;

  select *
  into v_registration
  from public.event_imported_registrations
  where id = p_imported_registration_id
    and event_id = p_event_id
    and review_status = 'ready';

  if not found then
    raise exception 'Imported registration not found.';
  end if;

  select count(*)
  into v_same_name_count
  from public.event_imported_registrations
  where event_id = p_event_id
    and review_status = 'ready'
    and lower(first_name) = lower(v_registration.first_name)
    and lower(last_name) = lower(v_registration.last_name);

  if v_same_name_count > 1 and lower(trim(coalesce(p_email_confirmation, ''))) <> v_registration.normalized_email then
    raise exception 'Email confirmation is required for this registration.';
  end if;

  if exists (
    select 1
    from public.event_check_ins
    where event_id = p_event_id
      and metadata->>'imported_registration_id' = v_registration.id::text
      and status <> 'cancelled'
  ) then
    raise exception 'This registration has already been checked in.';
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
    public.ensure_guest_session(
      p_event_id,
      p_guest_token,
      v_registration.first_name,
      v_registration.last_name,
      v_registration.normalized_email,
      nullif(trim(coalesce(p_phone, '')), '')
    ),
    v_registration.first_name,
    v_registration.last_name,
    null,
    'general',
    'completed',
    jsonb_build_object(
      'registration_match_status', 'matched',
      'imported_registration_id', v_registration.id,
      'import_source', v_registration.import_source,
      'external_order_id', v_registration.external_order_id,
      'party_size', greatest(1, coalesce(v_registration.party_size, 1)),
      'tickets', greatest(1, coalesce(v_registration.party_size, 1)),
      'phone', nullif(trim(coalesce(p_phone, '')), ''),
      'imported_registration', jsonb_build_object(
        'external_order_id', v_registration.external_order_id,
        'party_size', greatest(1, coalesce(v_registration.party_size, 1)),
        'tickets', greatest(1, coalesce(v_registration.party_size, 1))
      )
    )
  )
  returning * into v_check_in;

  return v_check_in;
end;
$$;

create or replace function public.reconnect_event_check_in_from_imported_registration_for_guest(
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
  v_registration public.event_imported_registrations;
  v_same_name_count integer;
  v_check_in public.event_check_ins;
begin
  if p_guest_token is null or length(trim(p_guest_token)) < 12 then
    raise exception 'Guest session is required.';
  end if;

  select *
  into v_registration
  from public.event_imported_registrations
  where id = p_imported_registration_id
    and event_id = p_event_id
    and review_status = 'ready';

  if not found then
    raise exception 'Imported registration not found.';
  end if;

  select count(*)
  into v_same_name_count
  from public.event_imported_registrations
  where event_id = p_event_id
    and review_status = 'ready'
    and lower(first_name) = lower(v_registration.first_name)
    and lower(last_name) = lower(v_registration.last_name);

  if v_same_name_count > 1 and lower(trim(coalesce(p_email_confirmation, ''))) <> v_registration.normalized_email then
    raise exception 'Email confirmation is required for this registration.';
  end if;

  select *
  into v_check_in
  from public.event_check_ins
  where event_id = p_event_id
    and metadata->>'imported_registration_id' = v_registration.id::text
    and status = 'completed'
  order by updated_at desc
  limit 1;

  if not found then
    raise exception 'No completed check-in is available to reconnect.';
  end if;

  update public.event_check_ins
  set
    guest_session_id = (
      public.ensure_guest_session(
        p_event_id,
        p_guest_token,
        v_registration.first_name,
        v_registration.last_name,
        v_registration.normalized_email,
        coalesce(nullif(trim(coalesce(p_phone, '')), ''), metadata->>'phone')
      )
    ),
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'phone', coalesce(nullif(trim(coalesce(p_phone, '')), ''), metadata->>'phone'),
        'external_order_id', v_registration.external_order_id,
        'party_size', greatest(1, coalesce(v_registration.party_size, 1)),
        'tickets', greatest(1, coalesce(v_registration.party_size, 1)),
        'imported_registration', jsonb_build_object(
          'external_order_id', v_registration.external_order_id,
          'party_size', greatest(1, coalesce(v_registration.party_size, 1)),
          'tickets', greatest(1, coalesce(v_registration.party_size, 1))
        )
      ),
    updated_at = now()
  where id = v_check_in.id
  returning * into v_check_in;

  return v_check_in;
end;
$$;

grant execute on function public.search_event_imported_registrations_for_guest(uuid, text, text, integer) to anon, authenticated;
grant execute on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;
grant execute on function public.reconnect_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;

commit;
