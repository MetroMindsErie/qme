-- qME guest session foundation.
-- Run after:
-- - supabase-sprint2-setup-rls.sql
--
-- Intent:
-- - give anonymous guest browsers a durable random session token per event
-- - attach new event_check_ins and tickets to that guest session
-- - preserve legacy queue/check-in behavior while preparing stricter RLS/RPCs
-- - support optional email/phone recovery later without forcing guest accounts

create extension if not exists pgcrypto;

create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token_hash text not null,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'replaced', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists guest_sessions_event_token_hash_key
  on public.guest_sessions(event_id, token_hash);

create index if not exists guest_sessions_event_contact_idx
  on public.guest_sessions(event_id, lower(email), phone)
  where email is not null or phone is not null;

alter table public.event_check_ins
  add column if not exists guest_session_id uuid references public.guest_sessions(id) on delete set null;

alter table public.tickets
  add column if not exists guest_session_id uuid references public.guest_sessions(id) on delete set null;

create index if not exists event_check_ins_guest_session_idx
  on public.event_check_ins(guest_session_id)
  where guest_session_id is not null;

create index if not exists tickets_guest_session_idx
  on public.tickets(guest_session_id)
  where guest_session_id is not null;

grant select, insert, update on public.guest_sessions to anon, authenticated;

alter table public.guest_sessions enable row level security;

drop policy if exists "guest_sessions_all" on public.guest_sessions;
drop policy if exists "guest_sessions_select_staff" on public.guest_sessions;
create policy "guest_sessions_select_staff"
  on public.guest_sessions
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

drop policy if exists "guest_sessions_insert_rpc_only" on public.guest_sessions;
create policy "guest_sessions_insert_rpc_only"
  on public.guest_sessions
  for insert
  to anon, authenticated
  with check (false);

drop policy if exists "guest_sessions_update_staff" on public.guest_sessions;
create policy "guest_sessions_update_staff"
  on public.guest_sessions
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

create or replace function public.guest_token_hash(p_guest_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(convert_to(coalesce(p_guest_token, ''), 'UTF8'), 'sha256'), 'hex')
$$;

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

create or replace function public.ensure_guest_session_for_queue(
  p_queue_id uuid,
  p_guest_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_event_id uuid;
begin
  select event_id into resolved_event_id
  from public.queues
  where id = p_queue_id;

  if resolved_event_id is null then
    raise exception 'queue not found';
  end if;

  return public.ensure_guest_session(resolved_event_id, p_guest_token);
end;
$$;

create or replace function public.next_ticket_for_queue(
  p_queue_id uuid,
  p_guest_token text
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
begin
  resolved_session_id := public.ensure_guest_session_for_queue(p_queue_id, p_guest_token);
  resolved_ticket := to_jsonb(public.next_ticket_for_queue(p_queue_id));
  if jsonb_typeof(resolved_ticket) = 'number' then
    resolved_ticket_id := (resolved_ticket #>> '{}')::bigint;
  else
    resolved_ticket_id := coalesce(
      nullif(resolved_ticket ->> 'id', '')::bigint,
      nullif(resolved_ticket ->> 'ticket_number', '')::bigint
    );
  end if;

  update public.tickets
  set guest_session_id = resolved_session_id
  where id = resolved_ticket_id
    and queue_id = p_queue_id
    and guest_session_id is null;

  return resolved_ticket;
end;
$$;

create or replace function public.restore_ticket_for_queue(
  p_ticket_id bigint,
  p_queue_id uuid,
  p_guest_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_ticket jsonb;
  resolved_session_id uuid;
  existing_session_id uuid;
begin
  resolved_session_id := public.ensure_guest_session_for_queue(p_queue_id, p_guest_token);

  select guest_session_id into existing_session_id
  from public.tickets
  where id = p_ticket_id
    and queue_id = p_queue_id;

  if existing_session_id is not null and existing_session_id <> resolved_session_id then
    raise exception 'ticket belongs to a different guest session';
  end if;

  resolved_ticket := to_jsonb(public.restore_ticket_for_queue(p_ticket_id, p_queue_id));

  update public.tickets
  set guest_session_id = resolved_session_id
  where id = p_ticket_id
    and queue_id = p_queue_id
    and guest_session_id is null;

  return resolved_ticket;
end;
$$;

create or replace function public.check_in_ticket(
  p_ticket_id bigint,
  p_guest_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_queue_id uuid;
  resolved_session_id uuid;
  existing_session_id uuid;
begin
  select queue_id, guest_session_id
    into target_queue_id, existing_session_id
  from public.tickets
  where id = p_ticket_id;

  if target_queue_id is null then
    raise exception 'ticket not found';
  end if;

  resolved_session_id := public.ensure_guest_session_for_queue(target_queue_id, p_guest_token);
  if existing_session_id is not null and existing_session_id <> resolved_session_id then
    raise exception 'ticket belongs to a different guest session';
  end if;

  update public.tickets
  set guest_session_id = resolved_session_id
  where id = p_ticket_id
    and guest_session_id is null;

  perform public.check_in_ticket(p_ticket_id);
end;
$$;

create or replace function public.leave_queue(
  p_ticket_id bigint,
  p_reason text,
  p_guest_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_queue_id uuid;
  resolved_session_id uuid;
  existing_session_id uuid;
begin
  select queue_id, guest_session_id
    into target_queue_id, existing_session_id
  from public.tickets
  where id = p_ticket_id;

  if target_queue_id is null then
    raise exception 'ticket not found';
  end if;

  resolved_session_id := public.ensure_guest_session_for_queue(target_queue_id, p_guest_token);
  if existing_session_id is not null and existing_session_id <> resolved_session_id then
    raise exception 'ticket belongs to a different guest session';
  end if;

  update public.tickets
  set guest_session_id = resolved_session_id
  where id = p_ticket_id
    and guest_session_id is null;

  perform public.leave_queue(p_ticket_id, p_reason);
end;
$$;

-- Keep guest-session RPC execution deterministic. SECURITY DEFINER functions
-- still validate event/queue ownership internally; these grants only expose the
-- intended anonymous/authenticated guest entrypoints.
revoke all on function public.guest_token_hash(text) from public;
grant execute on function public.guest_token_hash(text) to anon, authenticated;

revoke all on function public.ensure_guest_session(uuid, text, text, text, text, text) from public;
grant execute on function public.ensure_guest_session(uuid, text, text, text, text, text) to anon, authenticated;

revoke all on function public.ensure_guest_session_for_queue(uuid, text) from public;
grant execute on function public.ensure_guest_session_for_queue(uuid, text) to anon, authenticated;

revoke all on function public.next_ticket_for_queue(uuid, text) from public;
grant execute on function public.next_ticket_for_queue(uuid, text) to anon, authenticated;

revoke all on function public.restore_ticket_for_queue(bigint, uuid, text) from public;
grant execute on function public.restore_ticket_for_queue(bigint, uuid, text) to anon, authenticated;

revoke all on function public.check_in_ticket(bigint, text) from public;
grant execute on function public.check_in_ticket(bigint, text) to anon, authenticated;

revoke all on function public.leave_queue(bigint, text, text) from public;
grant execute on function public.leave_queue(bigint, text, text) to anon, authenticated;
