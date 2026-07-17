-- qME pre-SOTC bounded security regression checks.
-- Date: 2026-07-17
--
-- Run after supabase-pre-sotc-bounded-security-fixes.sql.
--
-- This script creates disposable rows against the SOTC test event and cleans
-- them up. It raises an exception if any regression fails.

do $$
declare
  target_event_id uuid;
  token_active text := 'regression-active-' || gen_random_uuid()::text;
  token_revoked text := 'regression-revoked-' || gen_random_uuid()::text;
  token_replaced text := 'regression-replaced-' || gen_random_uuid()::text;
  active_session_id uuid;
  revoked_session_id uuid;
  replaced_session_id uuid;
  active_last_seen timestamptz;
  retry_failed boolean := false;
  still_status text;
begin
  select id into target_event_id
  from public.events
  where slug = 'sotc-test-check-in'
  limit 1;

  if target_event_id is null then
    raise exception 'SOTC test event not found';
  end if;

  active_session_id := public.ensure_guest_session(
    target_event_id,
    token_active,
    'Regression',
    'Active',
    'regression.active@example.com',
    null
  );

  perform pg_sleep(0.01);
  active_session_id := public.ensure_guest_session(
    target_event_id,
    token_active,
    'Regression Updated',
    'Active',
    'regression.active@example.com',
    null
  );

  select last_seen_at into active_last_seen
  from public.guest_sessions
  where id = active_session_id
    and status = 'active';

  if active_last_seen is null then
    raise exception 'active returning guest session did not remain active';
  end if;

  revoked_session_id := public.ensure_guest_session(
    target_event_id,
    token_revoked,
    'Regression',
    'Revoked',
    null,
    null
  );

  update public.guest_sessions
  set status = 'revoked'
  where id = revoked_session_id;

  begin
    perform public.ensure_guest_session(target_event_id, token_revoked, 'Retry', 'Revoked', null, null);
  exception when others then
    retry_failed := true;
  end;

  if retry_failed is not true then
    raise exception 'revoked guest session was reactivated by token retry';
  end if;

  select status into still_status
  from public.guest_sessions
  where id = revoked_session_id;

  if still_status is distinct from 'revoked' then
    raise exception 'revoked guest session changed status after retry: %', still_status;
  end if;

  retry_failed := false;
  replaced_session_id := public.ensure_guest_session(
    target_event_id,
    token_replaced,
    'Regression',
    'Replaced',
    null,
    null
  );

  update public.guest_sessions
  set status = 'replaced'
  where id = replaced_session_id;

  begin
    perform public.ensure_guest_session(target_event_id, token_replaced, 'Retry', 'Replaced', null, null);
  exception when others then
    retry_failed := true;
  end;

  if retry_failed is not true then
    raise exception 'replaced guest session was reactivated by token retry';
  end if;

  delete from public.guest_sessions
  where id in (active_session_id, revoked_session_id, replaced_session_id);
end;
$$;

do $$
declare
  target_event_id uuid;
  original_metadata jsonb;
  token_prefix text := 'ticket-type-regression-' || gen_random_uuid()::text;
  guest_token text;
  session_id uuid;
  check_in_row public.event_check_ins;
  completed_row public.event_check_ins;
  disallowed_failed boolean;
begin
  select id, metadata
    into target_event_id, original_metadata
  from public.events
  where slug = 'sotc-test-check-in'
  limit 1;

  if target_event_id is null then
    raise exception 'SOTC test event not found';
  end if;

  update public.events
  set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{check_in,completion_mode}',
    '"auto"'::jsonb,
    true
  )
  where id = target_event_id;

  -- general is allowed and writes general when no authoritative value exists.
  guest_token := token_prefix || '-general';
  check_in_row := public.create_event_check_in_for_guest(
    target_event_id,
    guest_token,
    'Ticket',
    'General',
    null,
    null,
    null
  );
  completed_row := public.complete_event_check_in_for_guest(check_in_row.id, guest_token, 'general');
  if completed_row.ticket_type is distinct from 'general' then
    raise exception 'general guest ticket type did not persist as expected';
  end if;

  -- flowers is currently a nonprivileged allowed legacy/demo type.
  guest_token := token_prefix || '-flowers';
  check_in_row := public.create_event_check_in_for_guest(
    target_event_id,
    guest_token,
    'Ticket',
    'Flowers',
    null,
    null,
    null
  );
  completed_row := public.complete_event_check_in_for_guest(check_in_row.id, guest_token, 'flowers');
  if completed_row.ticket_type is distinct from 'flowers' then
    raise exception 'flowers guest ticket type did not persist as expected';
  end if;

  -- null/empty resolves to general when no authoritative value exists.
  guest_token := token_prefix || '-empty';
  check_in_row := public.create_event_check_in_for_guest(
    target_event_id,
    guest_token,
    'Ticket',
    'Empty',
    null,
    null,
    null
  );
  completed_row := public.complete_event_check_in_for_guest(check_in_row.id, guest_token, '');
  if completed_row.ticket_type is distinct from 'general' then
    raise exception 'empty guest ticket type did not resolve to general';
  end if;

  foreach guest_token in array array[
    token_prefix || '-professional-photo',
    token_prefix || '-staff',
    token_prefix || '-unknown'
  ]
  loop
    check_in_row := public.create_event_check_in_for_guest(
      target_event_id,
      guest_token,
      'Ticket',
      'Blocked',
      null,
      null,
      null
    );

    disallowed_failed := false;
    begin
      perform public.complete_event_check_in_for_guest(
        check_in_row.id,
        guest_token,
        case
          when guest_token like '%professional-photo' then 'professional_photo'
          when guest_token like '%staff' then 'staff'
          else 'not_a_real_type'
        end
      );
    exception when others then
      disallowed_failed := true;
    end;

    if disallowed_failed is not true then
      raise exception 'disallowed guest ticket type was accepted for token %', guest_token;
    end if;
  end loop;

  -- Existing authoritative value wins over guest-provided allowed value.
  guest_token := token_prefix || '-preserve';
  session_id := public.ensure_guest_session(target_event_id, guest_token, 'Ticket', 'Preserve', null, null);
  insert into public.event_check_ins (
    event_id,
    guest_session_id,
    first_name,
    last_name,
    status,
    ticket_type
  )
  values (
    target_event_id,
    session_id,
    'Ticket',
    'Preserve',
    'waiting',
    'flowers'
  )
  returning * into check_in_row;

  completed_row := public.complete_event_check_in_for_guest(check_in_row.id, guest_token, 'general');
  if completed_row.ticket_type is distinct from 'flowers' then
    raise exception 'guest completion overwrote authoritative ticket type';
  end if;

  delete from public.event_check_ins
  where event_id = target_event_id
    and first_name = 'Ticket'
    and last_name in ('General', 'Flowers', 'Empty', 'Blocked', 'Preserve');

  delete from public.guest_sessions
  where event_id = target_event_id
    and token_hash in (
      public.guest_token_hash(token_prefix || '-general'),
      public.guest_token_hash(token_prefix || '-flowers'),
      public.guest_token_hash(token_prefix || '-empty'),
      public.guest_token_hash(token_prefix || '-professional-photo'),
      public.guest_token_hash(token_prefix || '-staff'),
      public.guest_token_hash(token_prefix || '-unknown'),
      public.guest_token_hash(token_prefix || '-preserve')
    );

  update public.events
  set metadata = original_metadata
  where id = target_event_id;
exception when others then
  update public.events
  set metadata = original_metadata
  where id = target_event_id;
  raise;
end;
$$;

select 'pre_sotc_bounded_security_regression_passed' as result;
