-- qME expie/eCe foundation.
-- Run this after supabase-org-event-foundation.sql.
--
-- Domain model:
-- - expies are reusable organization-owned experience definitions.
-- - eces are event-context experiences: an expie placed into an event with
--   event-specific time, location, visibility, status, and operating state.
-- - every eCe must point to an expie. Admin flows may create the expie and eCe
--   in one motion, but the database should preserve the relationship.
-- - queues attach to eces, because each event/location/time needs its own live
--   queue state.

create table if not exists public.expies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  slug text not null,
  description text not null default '',
  image_url text not null default '',
  type text not null default 'info'
    check (type in ('info', 'check_in', 'queue', 'resource', 'session')),
  default_queue_behavior text not null default '',
  default_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expies_organization_slug_key
  on public.expies(organization_id, slug);

create table if not exists public.eces (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  expie_id uuid references public.expies(id) on delete restrict,
  org_id uuid references public.organizations(id) on delete set null,
  name text not null,
  slug text not null,
  description text not null default '',
  image_url text not null default '',
  type text not null default 'info'
    check (type in ('info', 'check_in', 'queue', 'resource', 'session')),
  queue_id uuid references public.queues(id) on delete set null,
  queue_behavior text not null default '',
  sort_order integer not null default 100,
  location text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eces_event_sort_idx
  on public.eces(event_id, sort_order, created_at);

create index if not exists eces_org_id_idx
  on public.eces(org_id);

create index if not exists eces_expie_id_idx
  on public.eces(expie_id);

create or replace function public.set_expies_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expies_updated_at on public.expies;
create trigger expies_updated_at
before update on public.expies
for each row
execute function public.set_expies_updated_at();

create or replace function public.set_eces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists eces_updated_at on public.eces;
create trigger eces_updated_at
before update on public.eces
for each row
execute function public.set_eces_updated_at();

-- Preserve event-context rows created during the blended experiences prototype.
insert into public.eces (
  id,
  event_id,
  org_id,
  name,
  slug,
  description,
  image_url,
  type,
  queue_id,
  sort_order,
  location,
  starts_at,
  ends_at,
  metadata,
  status,
  created_at,
  updated_at
)
select
  id,
  event_id,
  org_id,
  name,
  slug,
  coalesce(description, ''),
  coalesce(image_url, ''),
  coalesce(type, 'info'),
  queue_id,
  coalesce(sort_order, 100),
  coalesce(location, ''),
  starts_at,
  ends_at,
  coalesce(metadata, '{}'::jsonb),
  coalesce(status, 'active'),
  created_at,
  updated_at
from public.experiences
where event_id is not null
on conflict (id) do update
set
  event_id = excluded.event_id,
  org_id = excluded.org_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  queue_id = excluded.queue_id,
  sort_order = excluded.sort_order,
  location = excluded.location,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  metadata = excluded.metadata,
  status = excluded.status,
  updated_at = excluded.updated_at;

-- Backfill reusable expies for event-context eCes imported from the blended
-- experiences prototype. These are intentionally organization-owned reusable
-- definitions, even when they were originally created from an event screen.
insert into public.expies (
  organization_id,
  name,
  slug,
  description,
  image_url,
  type,
  default_queue_behavior,
  default_metadata,
  status,
  created_at,
  updated_at
)
select distinct on (coalesce(eces.org_id, events.organization_id), eces.slug)
  coalesce(eces.org_id, events.organization_id) as organization_id,
  eces.name,
  eces.slug,
  eces.description,
  eces.image_url,
  eces.type,
  eces.queue_behavior,
  eces.metadata,
  case when eces.status in ('draft', 'active') then eces.status else 'active' end,
  eces.created_at,
  eces.updated_at
from public.eces
join public.events on events.id = eces.event_id
where eces.expie_id is null
order by coalesce(eces.org_id, events.organization_id), eces.slug, eces.created_at
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  default_queue_behavior = excluded.default_queue_behavior,
  default_metadata = excluded.default_metadata,
  status = excluded.status,
  updated_at = excluded.updated_at;

update public.eces
set
  expie_id = expies.id,
  org_id = coalesce(eces.org_id, events.organization_id)
from public.events
cross join public.expies
where eces.event_id = events.id
  and eces.expie_id is null
  and expies.organization_id is not distinct from coalesce(eces.org_id, events.organization_id)
  and expies.slug = eces.slug;

alter table public.eces
  alter column expie_id set not null;

-- Temporary alpha policies while admin auth is still being built.
-- Tighten these when real org/admin/staff roles are introduced.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.expies to anon, authenticated;
grant select, insert, update, delete on public.eces to anon, authenticated;

alter table public.expies enable row level security;
alter table public.eces enable row level security;

drop policy if exists "expies_select_all" on public.expies;
create policy "expies_select_all"
  on public.expies
  for select
  to anon, authenticated
  using (true);

drop policy if exists "expies_insert_all" on public.expies;
create policy "expies_insert_all"
  on public.expies
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "expies_update_all" on public.expies;
create policy "expies_update_all"
  on public.expies
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "expies_delete_all" on public.expies;
create policy "expies_delete_all"
  on public.expies
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "eces_select_all" on public.eces;
create policy "eces_select_all"
  on public.eces
  for select
  to anon, authenticated
  using (true);

drop policy if exists "eces_insert_all" on public.eces;
create policy "eces_insert_all"
  on public.eces
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "eces_update_all" on public.eces;
create policy "eces_update_all"
  on public.eces
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "eces_delete_all" on public.eces;
create policy "eces_delete_all"
  on public.eces
  for delete
  to anon, authenticated
  using (true);
