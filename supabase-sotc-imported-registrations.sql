-- qME SOTC imported registration foundation.
-- Run after:
-- - supabase-org-event-foundation.sql
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-guest-session-foundation.sql
--
-- Intent:
-- - keep Eventbrite/SOTC imported attendee records separate from guest identity
-- - preserve source data needed for audit and troubleshooting
-- - support idempotent self check-in and Headshot entitlement later
-- - let reset clear rehearsal linkage while preserving the imported list

create table if not exists public.event_import_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  import_source text not null default 'eventbrite',
  source_file_name text not null,
  source_file_hash text,
  status text not null default 'dry_run'
    check (status in ('dry_run', 'imported', 'superseded', 'failed')),
  row_count integer not null default 0
    check (row_count >= 0),
  imported_count integer not null default 0
    check (imported_count >= 0),
  updated_count integer not null default 0
    check (updated_count >= 0),
  flagged_count integer not null default 0
    check (flagged_count >= 0),
  report jsonb not null default '{}'::jsonb,
  created_by uuid references public.admin_principals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_import_batches_event_idx
  on public.event_import_batches(event_id, created_at desc);

create table if not exists public.event_imported_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  import_batch_id uuid references public.event_import_batches(id) on delete set null,
  import_source text not null default 'eventbrite',
  external_attendee_id text not null,
  first_name text not null,
  last_name text not null,
  normalized_email text not null,
  email text not null,
  headshot_entitled boolean not null default false,
  source_price_tier text,
  source_ticket_type text,
  source_row_number integer,
  source_metadata jsonb not null default '{}'::jsonb,
  review_status text not null default 'ready'
    check (review_status in ('ready', 'needs_review', 'ignored')),
  review_reason text,
  checked_in_at timestamptz,
  linked_check_in_id uuid references public.event_check_ins(id) on delete set null,
  linked_guest_session_id uuid references public.guest_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_attendee_id <> ''),
  check (first_name <> '' or last_name <> ''),
  check (normalized_email <> '')
);

create unique index if not exists event_imported_registrations_event_external_key
  on public.event_imported_registrations(event_id, external_attendee_id);

create index if not exists event_imported_registrations_event_email_idx
  on public.event_imported_registrations(event_id, normalized_email);

create index if not exists event_imported_registrations_event_name_idx
  on public.event_imported_registrations(event_id, lower(first_name), lower(last_name));

create index if not exists event_imported_registrations_check_in_idx
  on public.event_imported_registrations(linked_check_in_id)
  where linked_check_in_id is not null;

drop trigger if exists event_import_batches_updated_at on public.event_import_batches;
create trigger event_import_batches_updated_at
before update on public.event_import_batches
for each row
execute function public.set_admin_foundation_updated_at();

drop trigger if exists event_imported_registrations_updated_at on public.event_imported_registrations;
create trigger event_imported_registrations_updated_at
before update on public.event_imported_registrations
for each row
execute function public.set_admin_foundation_updated_at();

grant select, insert, update, delete on public.event_import_batches to authenticated;
grant select, insert, update, delete on public.event_imported_registrations to authenticated;
revoke all on public.event_import_batches from anon;
revoke all on public.event_imported_registrations from anon;

alter table public.event_import_batches enable row level security;
alter table public.event_imported_registrations enable row level security;

drop policy if exists "event_import_batches_select_event_staff" on public.event_import_batches;
create policy "event_import_batches_select_event_staff"
  on public.event_import_batches
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_import_batches_write_event_admin" on public.event_import_batches;
create policy "event_import_batches_write_event_admin"
  on public.event_import_batches
  for all
  to authenticated
  using (public.has_event_role(event_id, array['event_admin']))
  with check (public.has_event_role(event_id, array['event_admin']));

drop policy if exists "event_imported_registrations_select_event_staff" on public.event_imported_registrations;
create policy "event_imported_registrations_select_event_staff"
  on public.event_imported_registrations
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_imported_registrations_write_event_admin" on public.event_imported_registrations;
create policy "event_imported_registrations_write_event_admin"
  on public.event_imported_registrations
  for all
  to authenticated
  using (public.has_event_role(event_id, array['event_admin']))
  with check (public.has_event_role(event_id, array['event_admin']));

-- Reset rehearsal/test state without removing the imported attendee list.
create or replace function public.reset_event_test_data(
  p_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  actor_id uuid;
  removed_order_item_count integer := 0;
  removed_mark_count integer := 0;
  removed_designation_count integer := 0;
  removed_credit_count integer := 0;
  removed_ticket_count integer := 0;
  removed_check_in_count integer := 0;
  removed_guest_session_count integer := 0;
  reset_imported_registration_count integer := 0;
begin
  select organization_id
    into target_org_id
  from public.events
  where id = p_event_id;

  if target_org_id is null then
    raise exception 'event not found';
  end if;

  if not public.has_event_role(p_event_id, array['event_admin']) then
    raise exception 'not allowed to reset this event';
  end if;

  create temporary table if not exists pg_temp.reset_event_queue_ids (
    id uuid primary key
  ) on commit drop;

  create temporary table if not exists pg_temp.reset_event_check_in_ids (
    id uuid primary key
  ) on commit drop;

  create temporary table if not exists pg_temp.reset_event_guest_session_ids (
    id uuid primary key
  ) on commit drop;

  create temporary table if not exists pg_temp.reset_event_ticket_ids (
    id bigint primary key
  ) on commit drop;

  truncate table pg_temp.reset_event_queue_ids;
  truncate table pg_temp.reset_event_check_in_ids;
  truncate table pg_temp.reset_event_guest_session_ids;
  truncate table pg_temp.reset_event_ticket_ids;

  insert into pg_temp.reset_event_queue_ids (id)
  select id
  from public.queues
  where event_id = p_event_id;

  insert into pg_temp.reset_event_check_in_ids (id)
  select id
  from public.event_check_ins
  where event_id = p_event_id;

  insert into pg_temp.reset_event_guest_session_ids (id)
  select id
  from public.guest_sessions
  where event_id = p_event_id;

  insert into pg_temp.reset_event_ticket_ids (id)
  select tickets.id
  from public.tickets tickets
  where tickets.queue_id in (select id from pg_temp.reset_event_queue_ids)
     or tickets.guest_session_id in (select id from pg_temp.reset_event_guest_session_ids);

  if to_regclass('public.event_imported_registrations') is not null then
    update public.event_imported_registrations
    set
      checked_in_at = null,
      linked_check_in_id = null,
      linked_guest_session_id = null,
      updated_at = now()
    where event_id = p_event_id
      and (
        checked_in_at is not null
        or linked_check_in_id is not null
        or linked_guest_session_id is not null
      );
    get diagnostics reset_imported_registration_count = row_count;
  end if;

  if to_regclass('public.event_group_order_items') is not null then
    execute 'delete from public.event_group_order_items where event_id = $1'
      using p_event_id;
    get diagnostics removed_order_item_count = row_count;
  end if;

  delete from public.event_guest_marks
  where event_id = p_event_id
     or ticket_id in (select id from pg_temp.reset_event_ticket_ids)
     or check_in_id in (select id from pg_temp.reset_event_check_in_ids);
  get diagnostics removed_mark_count = row_count;

  delete from public.event_guest_designations
  where event_id = p_event_id
     or ticket_id in (select id from pg_temp.reset_event_ticket_ids)
     or check_in_id in (select id from pg_temp.reset_event_check_in_ids);
  get diagnostics removed_designation_count = row_count;

  delete from public.event_guest_credits
  where event_id = p_event_id
     or ticket_id in (select id from pg_temp.reset_event_ticket_ids)
     or check_in_id in (select id from pg_temp.reset_event_check_in_ids);
  get diagnostics removed_credit_count = row_count;

  delete from public.tickets tickets
  using pg_temp.reset_event_ticket_ids target_tickets
  where tickets.id = target_tickets.id;
  get diagnostics removed_ticket_count = row_count;

  delete from public.event_check_ins
  where id in (select id from pg_temp.reset_event_check_in_ids);
  get diagnostics removed_check_in_count = row_count;

  delete from public.guest_sessions
  where id in (select id from pg_temp.reset_event_guest_session_ids);
  get diagnostics removed_guest_session_count = row_count;

  update public.queues
  set
    now_serving = 1,
    updated_at = now()
  where event_id = p_event_id;

  update public.events
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'test_data_reset_at',
      now()
    ),
    updated_at = now()
  where id = p_event_id;

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
      p_event_id,
      actor_id,
      'event.test_data_reset',
      'event',
      p_event_id::text,
      jsonb_build_object(
        'removed_order_item_count', removed_order_item_count,
        'removed_mark_count', removed_mark_count,
        'removed_designation_count', removed_designation_count,
        'removed_credit_count', removed_credit_count,
        'removed_ticket_count', removed_ticket_count,
        'removed_check_in_count', removed_check_in_count,
        'removed_guest_session_count', removed_guest_session_count,
        'reset_imported_registration_count', reset_imported_registration_count
      )
    );
  end if;
end;
$$;

revoke all on function public.reset_event_test_data(uuid) from public;
revoke all on function public.reset_event_test_data(uuid) from anon;
grant execute on function public.reset_event_test_data(uuid) to authenticated;
