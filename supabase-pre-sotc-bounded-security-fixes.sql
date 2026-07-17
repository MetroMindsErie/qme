-- qME pre-SOTC bounded security fixes.
-- Date: 2026-07-17
--
-- Run after:
-- - supabase-guest-session-foundation.sql
-- - supabase-guest-action-rls-tightening.sql
--
-- Scope:
-- 1. Do not reactivate revoked/replaced guest sessions on token replay.
-- 2. Constrain guest self-check-in ticket_type and preserve authoritative
--    existing classifications.

create or replace function public.ensure_guest_session(
  p_event_id uuid,
  p_guest_token text,
  p_first_name text default '',
  p_last_name text default '',
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_session_id uuid;
  normalized_email text;
  normalized_phone text;
begin
  if p_event_id is null then
    raise exception 'p_event_id is required';
  end if;

  if nullif(trim(coalesce(p_guest_token, '')), '') is null then
    raise exception 'p_guest_token is required';
  end if;

  normalized_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  normalized_phone := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '');

  insert into public.guest_sessions (
    event_id,
    token_hash,
    first_name,
    last_name,
    email,
    phone,
    metadata,
    last_seen_at
  )
  values (
    p_event_id,
    public.guest_token_hash(p_guest_token),
    trim(coalesce(p_first_name, '')),
    trim(coalesce(p_last_name, '')),
    normalized_email,
    normalized_phone,
    jsonb_build_object('source', 'guest_browser'),
    now()
  )
  on conflict (event_id, token_hash) do update
  set
    first_name = coalesce(nullif(trim(coalesce(excluded.first_name, '')), ''), guest_sessions.first_name),
    last_name = coalesce(nullif(trim(coalesce(excluded.last_name, '')), ''), guest_sessions.last_name),
    email = coalesce(excluded.email, guest_sessions.email),
    phone = coalesce(excluded.phone, guest_sessions.phone),
    last_seen_at = now()
  where guest_sessions.status = 'active'
  returning id into resolved_session_id;

  if resolved_session_id is null then
    raise exception 'guest session is not active';
  end if;

  return resolved_session_id;
end;
$$;

create or replace function public.complete_event_check_in_for_guest(
  p_check_in_id uuid,
  p_guest_token text,
  p_ticket_type text default 'general'
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  check_in_mode text;
  resolved_ticket_type text;
begin
  check_in_row := public.get_event_check_in_for_guest(p_check_in_id, p_guest_token);

  select coalesce(metadata -> 'check_in' ->> 'completion_mode', 'staff')
    into check_in_mode
  from public.events
  where id = check_in_row.event_id;

  if check_in_mode is distinct from 'auto' then
    raise exception 'guest self check-in completion is not enabled for this event';
  end if;

  resolved_ticket_type := coalesce(nullif(trim(coalesce(p_ticket_type, '')), ''), 'general');
  if resolved_ticket_type not in ('general', 'flowers') then
    raise exception 'guest ticket type is not allowed';
  end if;

  update public.event_check_ins
  set
    status = 'completed',
    ticket_type = coalesce(ticket_type, resolved_ticket_type),
    updated_at = now()
  where id = p_check_in_id
  returning * into check_in_row;

  return check_in_row;
end;
$$;

revoke all on function public.ensure_guest_session(uuid, text, text, text, text, text) from public;
grant execute on function public.ensure_guest_session(uuid, text, text, text, text, text) to anon, authenticated;

revoke all on function public.complete_event_check_in_for_guest(uuid, text, text) from public;
grant execute on function public.complete_event_check_in_for_guest(uuid, text, text) to anon, authenticated;
