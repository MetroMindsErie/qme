-- qME Eventbrite additional-attendee names + actual party-size capture.
-- Run before using named additional attendees for multi-ticket Eventbrite registrations.
--
-- This keeps the primary imported registration's original Eventbrite Order ID and
-- registered Tickets/party_size intact. Actual attendance is stored on the
-- event_check_ins row metadata for the completed primary check-in.

begin;

create or replace function public.create_event_check_in_from_imported_registration_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_imported_registration_id uuid,
  p_email_confirmation text default null,
  p_phone text default null,
  p_additional_attendees jsonb default '[]'::jsonb
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
  v_registered_party_size integer;
  v_actual_party_size integer;
  v_order_id text;
  v_attendees jsonb := '[]'::jsonb;
  v_attendee jsonb;
  v_position integer;
  v_first_name text;
  v_last_name text;
begin
  if p_guest_token is null or length(trim(p_guest_token)) < 12 then
    raise exception 'Guest session is required.';
  end if;

  if p_additional_attendees is null then
    p_additional_attendees := '[]'::jsonb;
  end if;

  if jsonb_typeof(p_additional_attendees) <> 'array' then
    raise exception 'Additional attendees must be a list.';
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

  v_registered_party_size := greatest(1, coalesce(v_registration.party_size, 1));
  v_order_id := coalesce(nullif(v_registration.external_order_id, ''), v_registration.external_attendee_id);

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

  for v_attendee in select * from jsonb_array_elements(p_additional_attendees)
  loop
    v_position := nullif(trim(coalesce(v_attendee->>'position', '')), '')::integer;
    v_first_name := trim(coalesce(v_attendee->>'first_name', ''));
    v_last_name := trim(coalesce(v_attendee->>'last_name', ''));

    if v_position is null or v_position < 1 or v_position > greatest(0, v_registered_party_size - 1) then
      raise exception 'Additional attendee position is invalid.';
    end if;

    if v_first_name = '' or v_last_name = '' then
      raise exception 'First and last name are required for each additional attendee.';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(v_attendees) existing
      where existing->>'position' = v_position::text
    ) then
      raise exception 'Additional attendee positions must be unique.';
    end if;

    v_attendees := v_attendees || jsonb_build_array(jsonb_build_object(
      'role', 'additional_attendee',
      'position', v_position,
      'external_order_id', v_order_id || '-' || v_position::text,
      'first_name', v_first_name,
      'last_name', v_last_name,
      'source', 'eventbrite_party_check_in'
    ));
  end loop;

  v_actual_party_size := 1 + jsonb_array_length(v_attendees);

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
      'external_order_id', v_order_id,
      'registered_party_size', v_registered_party_size,
      'actual_party_size', v_actual_party_size,
      'party_size', v_actual_party_size,
      'tickets', v_registered_party_size,
      'additional_attendees', v_attendees,
      'phone', nullif(trim(coalesce(p_phone, '')), ''),
      'imported_registration', jsonb_build_object(
        'external_order_id', v_order_id,
        'party_size', v_registered_party_size,
        'tickets', v_registered_party_size
      )
    )
  )
  returning * into v_check_in;

  return v_check_in;
end;
$$;

grant execute on function public.create_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text, jsonb) to anon, authenticated;

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
  v_registered_party_size integer;
  v_actual_party_size integer;
  v_order_id text;
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

  v_registered_party_size := greatest(
    1,
    coalesce(
      nullif(v_check_in.metadata->>'registered_party_size', '')::integer,
      v_registration.party_size,
      1
    )
  );
  v_actual_party_size := greatest(
    1,
    coalesce(
      nullif(v_check_in.metadata->>'actual_party_size', '')::integer,
      nullif(v_check_in.metadata->>'party_size', '')::integer,
      v_registered_party_size
    )
  );
  v_order_id := coalesce(nullif(v_registration.external_order_id, ''), v_registration.external_attendee_id);

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
        'external_order_id', v_order_id,
        'registered_party_size', v_registered_party_size,
        'actual_party_size', v_actual_party_size,
        'party_size', v_actual_party_size,
        'tickets', v_registered_party_size,
        'additional_attendees', coalesce(metadata->'additional_attendees', '[]'::jsonb),
        'imported_registration', jsonb_build_object(
          'external_order_id', v_order_id,
          'party_size', v_registered_party_size,
          'tickets', v_registered_party_size
        )
      ),
    updated_at = now()
  where id = v_check_in.id
  returning * into v_check_in;

  return v_check_in;
end;
$$;

grant execute on function public.reconnect_event_check_in_from_imported_registration_for_guest(uuid, text, uuid, text, text) to anon, authenticated;

commit;
