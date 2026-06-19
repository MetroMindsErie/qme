-- qME organization/event/experience foundation.
-- Run this in the Supabase SQL editor for the qMe MVP project before using
-- organization-owned events or editable event experiences.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  logo_url text not null default '',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists description text not null default '',
  add column if not exists logo_url text not null default '',
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Earlier prototypes may have created organizations.owner_id as required.
-- Real admin/user ownership is coming in a later auth pass, so keep the column
-- if it exists but allow seeded foundation organizations to have no owner yet.
alter table public.organizations
  alter column owner_id drop not null;

create unique index if not exists organizations_slug_key
  on public.organizations(slug);

create or replace function public.set_organizations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
before update on public.organizations
for each row
execute function public.set_organizations_updated_at();

alter table public.events
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists events_organization_id_idx
  on public.events(organization_id);

alter table public.experiences
  add column if not exists org_id uuid references public.organizations(id),
  add column if not exists event_id uuid references public.events(id) on delete cascade,
  add column if not exists type text not null default 'info'
    check (type in ('info', 'check_in', 'queue', 'resource', 'session')),
  add column if not exists queue_id uuid references public.queues(id) on delete set null,
  add column if not exists sort_order integer not null default 100,
  add column if not exists location text not null default '',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists experiences_event_sort_idx
  on public.experiences(event_id, sort_order, created_at);

create index if not exists experiences_org_id_idx
  on public.experiences(org_id);

-- Temporary alpha policies while admin auth is still being built.
-- Tighten these when real org/admin/staff roles are introduced.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.organizations to anon, authenticated;
grant select, insert, update, delete on public.experiences to anon, authenticated;

alter table public.organizations enable row level security;

drop policy if exists "organizations_select_all" on public.organizations;
create policy "organizations_select_all"
  on public.organizations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "organizations_insert_all" on public.organizations;
create policy "organizations_insert_all"
  on public.organizations
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "organizations_update_all" on public.organizations;
create policy "organizations_update_all"
  on public.organizations
  for update
  to anon, authenticated
  using (true)
  with check (true);

alter table public.experiences enable row level security;

drop policy if exists "experiences_select_all" on public.experiences;
create policy "experiences_select_all"
  on public.experiences
  for select
  to anon, authenticated
  using (true);

drop policy if exists "experiences_insert_all" on public.experiences;
create policy "experiences_insert_all"
  on public.experiences
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "experiences_update_all" on public.experiences;
create policy "experiences_update_all"
  on public.experiences
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "experiences_delete_all" on public.experiences;
create policy "experiences_delete_all"
  on public.experiences
  for delete
  to anon, authenticated
  using (true);

insert into public.organizations (name, slug, description, logo_url, status)
values
  (
    'Walnut Ridge Farm',
    'walnut-ridge-farm',
    'Farm and event host organization for the Peony Festival demo and future Walnut Ridge events.',
    '',
    'active'
  ),
  (
    'qME Demo',
    'qme-demo',
    'Internal qME demo organization for generic product examples, test events, and non-client demo data.',
    '/images/qmeFirstLogo.jpg',
    'active'
  ),
  (
    'Summer on the Cuyahoga',
    'summer-on-the-cuyahoga',
    'SOTC organization for Rock Hall and summer pilot event planning.',
    '/images/sotc-logo.png',
    'active'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  logo_url = excluded.logo_url,
  status = excluded.status;

update public.events
set organization_id = (
  select id from public.organizations where slug = 'walnut-ridge-farm'
)
where slug = 'peony-festival'
  and (
    organization_id is null
    or organization_id = (
      select id from public.organizations where slug = 'qme-demo'
    )
  );

update public.events
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'check_in',
  jsonb_build_object(
    'enabled', true,
    'completion_mode', 'auto',
    'require_completed_for_participation', true
  )
)
where slug = 'sotc-test-check-in';

update public.events
set image_url = '/images/sotc-logo.png'
where slug = 'sotc-test-check-in'
  and coalesce(image_url, '') in ('', '/images/icorps.png', '/images/zippy.png', '/images/qmeFirstLogo.jpg');
