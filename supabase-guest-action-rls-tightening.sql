-- qME guest action RLS tightening.
-- Run after:
-- - supabase-guest-session-foundation.sql
--
-- Intent:
-- - move guest-owned check-in and ticket actions behind token-verified RPCs
-- - keep staff/admin table access scoped by role helpers
-- - preserve admin/staff table compatibility while guest actions move off direct
--   anonymous table access

revoke all on public.event_check_ins from anon;
revoke all on public.tickets from anon;
revoke all on public.event_guest_marks from anon;
revoke all on public.event_guest_credits from anon;
grant select, insert, update, delete on public.event_check_ins to authenticated;
grant select, insert, update, delete on public.tickets to authenticated;
grant select, insert, update, delete on public.event_guest_marks to authenticated;
grant select, insert, update, delete on public.event_guest_credits to authenticated;

create or replace function public.guest_session_matches(
  target_guest_session_id uuid,
  target_event_id uuid,
  p_guest_token text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guest_sessions gs
    where gs.id = target_guest_session_id
      and gs.event_id = target_event_id
      and gs.token_hash = public.guest_token_hash(p_guest_token)
      and gs.status = 'active'
  )
$$;

create or replace function public.create_event_check_in_for_guest(
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
    status
  )
  values (
    p_event_id,
    resolved_session_id,
    trim(coalesce(p_first_name, '')),
    trim(coalesce(p_last_name, '')),
    nullif(trim(coalesce(p_code, '')), ''),
    'waiting'
  )
  returning * into created_row;

  return created_row;
end;
$$;

create or replace function public.get_event_check_in_for_guest(
  p_check_in_id uuid,
  p_guest_token text
)
returns public.event_check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
begin
  select * into check_in_row
  from public.event_check_ins
  where id = p_check_in_id;

  if check_in_row.id is null then
    raise exception 'check-in not found';
  end if;

  if not public.guest_session_matches(
    check_in_row.guest_session_id,
    check_in_row.event_id,
    p_guest_token
  ) then
    raise exception 'check-in belongs to a different guest session';
  end if;

  return check_in_row;
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

create or replace function public.get_ticket_for_guest(
  p_ticket_id bigint,
  p_guest_token text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
  ticket_event_id uuid;
begin
  select t.*
    into ticket_row
  from public.tickets t
  where t.id = p_ticket_id;

  if ticket_row.id is null then
    raise exception 'ticket not found';
  end if;

  select q.event_id
    into ticket_event_id
  from public.queues q
  where q.id = ticket_row.queue_id;

  if not public.guest_session_matches(
    ticket_row.guest_session_id,
    ticket_event_id,
    p_guest_token
  ) then
    raise exception 'ticket belongs to a different guest session';
  end if;

  return ticket_row;
end;
$$;

create or replace function public.update_ticket_guest_name_for_guest(
  p_ticket_id bigint,
  p_guest_token text,
  p_first_name text,
  p_last_name text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
begin
  ticket_row := public.get_ticket_for_guest(p_ticket_id, p_guest_token);

  update public.tickets
  set
    first_name = trim(coalesce(p_first_name, '')),
    last_name = trim(coalesce(p_last_name, ''))
  where id = p_ticket_id
  returning * into ticket_row;

  return ticket_row;
end;
$$;

create or replace function public.confirm_ticket_nearby_for_guest(
  p_ticket_id bigint,
  p_guest_token text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.tickets;
begin
  ticket_row := public.get_ticket_for_guest(p_ticket_id, p_guest_token);

  update public.tickets
  set nearby_confirmed_at = now()
  where id = p_ticket_id
  returning * into ticket_row;

  return ticket_row;
end;
$$;

create or replace function public.complete_queue_ticket_for_guest(
  p_event_id uuid,
  p_ticket_id bigint,
  p_guest_token text,
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
  mark_row public.event_guest_marks;
  check_in_row public.event_check_ins;
  credit_row public.event_guest_credits;
  ticket_event_id uuid;
begin
  ticket_row := public.get_ticket_for_guest(p_ticket_id, p_guest_token);

  select q.event_id
    into ticket_event_id
  from public.queues q
  where q.id = ticket_row.queue_id;

  if ticket_event_id is distinct from p_event_id then
    raise exception 'ticket does not belong to the requested event';
  end if;

  if p_check_in_id is not null then
    check_in_row := public.get_event_check_in_for_guest(p_check_in_id, p_guest_token);
    if check_in_row.event_id is distinct from p_event_id then
      raise exception 'check-in does not belong to the requested event';
    end if;
  end if;

  update public.tickets
  set
    stage = 'completed',
    status = 'served',
    completed_at = now()
  where id = p_ticket_id;

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
    coalesce(nullif(p_mark_value, ''), 'completed'),
    'guest',
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (ticket_id, mark_key) where ticket_id is not null do update
  set
    mark_value = excluded.mark_value,
    source = excluded.source,
    metadata = excluded.metadata
  returning * into mark_row;

  if p_consume_credit_key is not null then
    if p_check_in_id is null then
      raise exception 'check-in identity is required to consume guest credit';
    end if;

    select *
      into credit_row
    from public.event_guest_credits
    where event_id = p_event_id
      and credit_key = p_consume_credit_key
      and used_quantity < quantity
      and check_in_id = p_check_in_id
    order by created_at asc
    limit 1;

    if credit_row.id is not null then
      update public.event_guest_credits
      set
        used_quantity = used_quantity + 1,
        updated_at = now()
      where id = credit_row.id;
    end if;
  end if;

  return mark_row;
end;
$$;

create or replace function public.get_guest_credit_for_check_in_guest(
  p_check_in_id uuid,
  p_guest_token text,
  p_credit_key text
)
returns public.event_guest_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  credit_row public.event_guest_credits;
begin
  check_in_row := public.get_event_check_in_for_guest(p_check_in_id, p_guest_token);

  select *
    into credit_row
  from public.event_guest_credits
  where check_in_id = p_check_in_id
    and credit_key = p_credit_key
  limit 1;

  if credit_row.id is null then
    return null;
  end if;

  return credit_row;
end;
$$;

alter table public.event_check_ins enable row level security;
alter table public.tickets enable row level security;
alter table public.event_guest_marks enable row level security;
alter table public.event_guest_credits enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'event_check_ins',
        'tickets',
        'event_guest_marks',
        'event_guest_credits'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "event_check_ins_select_staff"
  on public.event_check_ins
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

create policy "event_check_ins_insert_staff"
  on public.event_check_ins
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_check_ins_update_staff"
  on public.event_check_ins
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_check_ins_delete_staff"
  on public.event_check_ins
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

create policy "tickets_select_staff"
  on public.tickets
  for select
  to authenticated
  using (
    queue_id is not null
    and public.can_manage_event_guest_action((
      select q.event_id from public.queues q where q.id = tickets.queue_id
    ))
  );

create policy "tickets_update_staff"
  on public.tickets
  for update
  to authenticated
  using (
    queue_id is not null
    and public.can_manage_event_guest_action((
      select q.event_id from public.queues q where q.id = tickets.queue_id
    ))
  )
  with check (
    queue_id is not null
    and public.can_manage_event_guest_action((
      select q.event_id from public.queues q where q.id = tickets.queue_id
    ))
  );

create policy "tickets_delete_staff"
  on public.tickets
  for delete
  to authenticated
  using (
    queue_id is not null
    and public.can_manage_event_guest_action((
      select q.event_id from public.queues q where q.id = tickets.queue_id
    ))
  );

create policy "event_guest_marks_select_staff"
  on public.event_guest_marks
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

create policy "event_guest_marks_insert_staff"
  on public.event_guest_marks
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_guest_marks_update_staff"
  on public.event_guest_marks
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_guest_marks_delete_staff"
  on public.event_guest_marks
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

create policy "event_guest_credits_select_staff"
  on public.event_guest_credits
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

create policy "event_guest_credits_insert_staff"
  on public.event_guest_credits
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_guest_credits_update_staff"
  on public.event_guest_credits
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

create policy "event_guest_credits_delete_staff"
  on public.event_guest_credits
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

-- Keep guest-action RPC execution deterministic. These are the only guest-owned
-- paths the browser should use once direct table access is restricted by RLS.
revoke all on function public.guest_session_matches(uuid, uuid, text) from public;
grant execute on function public.guest_session_matches(uuid, uuid, text) to anon, authenticated;

revoke all on function public.create_event_check_in_for_guest(uuid, text, text, text, text, text, text) from public;
grant execute on function public.create_event_check_in_for_guest(uuid, text, text, text, text, text, text) to anon, authenticated;

revoke all on function public.get_event_check_in_for_guest(uuid, text) from public;
grant execute on function public.get_event_check_in_for_guest(uuid, text) to anon, authenticated;

revoke all on function public.complete_event_check_in_for_guest(uuid, text, text) from public;
grant execute on function public.complete_event_check_in_for_guest(uuid, text, text) to anon, authenticated;

revoke all on function public.get_ticket_for_guest(bigint, text) from public;
grant execute on function public.get_ticket_for_guest(bigint, text) to anon, authenticated;

revoke all on function public.update_ticket_guest_name_for_guest(bigint, text, text, text) from public;
grant execute on function public.update_ticket_guest_name_for_guest(bigint, text, text, text) to anon, authenticated;

revoke all on function public.confirm_ticket_nearby_for_guest(bigint, text) from public;
grant execute on function public.confirm_ticket_nearby_for_guest(bigint, text) to anon, authenticated;

revoke all on function public.complete_queue_ticket_for_guest(uuid, bigint, text, text, text, uuid, text, text, jsonb) from public;
grant execute on function public.complete_queue_ticket_for_guest(uuid, bigint, text, text, text, uuid, text, text, jsonb) to anon, authenticated;

revoke all on function public.get_guest_credit_for_check_in_guest(uuid, text, text) from public;
grant execute on function public.get_guest_credit_for_check_in_guest(uuid, text, text) to anon, authenticated;
