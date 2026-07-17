-- SUPERSEDED / SECURITY-DISABLED PILOT.
--
-- Do not run this script as a supported production feature.
-- It exists only as historical context for the dinner/group-order experiment.
-- The old group-order pilot is disabled security debt until it is rebuilt with:
-- - guest-session-owned order records
-- - verified event and guest ownership
-- - narrowly scoped guest/staff RPCs
-- - station/event authorization for staff actions
-- - server-side quantity and state validation
-- - idempotency and audit logging
-- - explicit draft/submitted/approved/fulfilled order states
--
-- Running this file may recreate event/content scaffolding from the old pilot.
-- The table-level security section below intentionally revokes anon writes and
-- keeps authenticated writes behind event-management RLS only.
--
-- qME group order pilot.
-- Run after:
-- - supabase-org-event-foundation.sql
-- - supabase-expie-ece-foundation.sql
-- - supabase-sotc-rls-hardening.sql or equivalent role helper setup
--
-- This creates a clean qME Test Lab organization/event for lightweight
-- request-list testing, starting with a dinner group order use case.

create table if not exists public.event_group_order_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  check_in_id uuid not null references public.event_check_ins(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1 check (quantity >= 0),
  notes text not null default '',
  status text not null default 'gathering'
    check (status in ('gathering', 'ordered', 'cancelled')),
  source text not null default 'guest' check (source in ('guest', 'staff', 'admin')),
  metadata jsonb not null default '{}'::jsonb,
  ordered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_group_order_items
  add column if not exists status text not null default 'gathering',
  add column if not exists ordered_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_group_order_items_status_check'
  ) then
    alter table public.event_group_order_items
      add constraint event_group_order_items_status_check
      check (status in ('gathering', 'ordered', 'cancelled'));
  end if;
end;
$$;

create index if not exists event_group_order_items_event_idx
  on public.event_group_order_items(event_id, created_at);

create index if not exists event_group_order_items_check_in_idx
  on public.event_group_order_items(check_in_id, created_at);

create or replace function public.set_event_group_order_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_group_order_items_updated_at on public.event_group_order_items;
create trigger event_group_order_items_updated_at
before update on public.event_group_order_items
for each row
execute function public.set_event_group_order_items_updated_at();

-- Security note:
-- This started as a dinner-test pilot table. Do not grant anonymous direct
-- mutations here. Guest-owned ordering needs a token-verified RPC before this
-- becomes an event feature again.
revoke all on public.event_group_order_items from anon;
grant select, insert, update, delete on public.event_group_order_items to authenticated;

alter table public.event_group_order_items enable row level security;

drop policy if exists "event_group_order_items_all" on public.event_group_order_items;
drop policy if exists "event_group_order_items_staff_all" on public.event_group_order_items;
create policy "event_group_order_items_staff_all"
  on public.event_group_order_items
  for all
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

insert into public.organizations (name, slug, description, logo_url, status)
values (
  'qME Test Lab',
  'qme-test-lab',
  'Internal qME sandbox organization for clean feature tests outside client pilot data.',
  '/images/qmeFirstLogo.jpg',
  'active'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  logo_url = excluded.logo_url,
  status = excluded.status,
  updated_at = now();

insert into public.events (
  organization_id,
  name,
  slug,
  description,
  location,
  image_url,
  event_date,
  start_time,
  end_time,
  timezone,
  status,
  metadata
)
select
  organizations.id,
  'Dinner Order Test',
  'dinner-order-test',
  'Quick group dinner order test for checking in guests and collecting shared tapas items.',
  'Dinner',
  '/images/qmeFirstLogo.jpg',
  current_date,
  '19:00',
  '22:00',
  'America/New_York',
  'active',
  jsonb_build_object(
    'check_in', jsonb_build_object(
      'enabled', true,
      'completion_mode', 'auto',
      'require_completed_for_participation', false
    ),
    'pilot', true,
    'pilot_kind', 'group_order'
  )
from public.organizations
where organizations.slug = 'qme-test-lab'
on conflict (slug) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  location = excluded.location,
  image_url = excluded.image_url,
  event_date = excluded.event_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  timezone = excluded.timezone,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.expies (
  organization_id,
  name,
  slug,
  description,
  image_url,
  type,
  default_queue_behavior,
  default_metadata,
  status
)
select
  organizations.id,
  'Group Dinner Order',
  'group-dinner-order',
  'Guests add items and quantities to a shared group order list.',
  '/images/qmeFirstLogo.jpg',
  'resource',
  '',
  jsonb_build_object(
    'pilot', true,
    'interaction_mode', 'group_order'
  ),
  'active'
from public.organizations
where organizations.slug = 'qme-test-lab'
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  default_queue_behavior = excluded.default_queue_behavior,
  default_metadata = excluded.default_metadata,
  status = excluded.status,
  updated_at = now();

insert into public.eces (
  event_id,
  expie_id,
  org_id,
  name,
  slug,
  description,
  image_url,
  type,
  queue_behavior,
  location,
  metadata,
  status
)
select
  events.id,
  expies.id,
  organizations.id,
  'Dinner Order',
  'dinner-order',
  'Add tapas or drinks to the shared dinner list. You can come back and add more.',
  '/images/qmeFirstLogo.jpg',
  'resource',
  '',
  'Dinner table',
  jsonb_build_object(
    'pilot', true,
    'interaction_mode', 'group_order'
  ),
  'active'
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
  and expies.slug = 'group-dinner-order'
where events.slug = 'dinner-order-test'
  and not exists (
    select 1
    from public.eces existing
    where existing.event_id = events.id
      and existing.slug = 'dinner-order'
  );

update public.eces
set
  name = 'Dinner Order',
  description = 'Add tapas or drinks to the shared dinner list. You can come back and add more.',
  image_url = '/images/qmeFirstLogo.jpg',
  type = 'resource',
  queue_behavior = '',
  location = 'Dinner table',
  metadata = jsonb_build_object(
    'pilot', true,
    'interaction_mode', 'group_order'
  ),
  status = 'active'
from public.events
where eces.event_id = events.id
  and events.slug = 'dinner-order-test'
  and eces.slug = 'dinner-order';
