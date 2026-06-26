-- qME admin role/staff foundation.
-- Run after supabase-org-event-foundation.sql.
--
-- Purpose:
-- - create the minimum identity/role tables needed for Sprint 2 platform trust
-- - model qME superadmin, organization admin/staff, event admin/staff,
--   station accounts, and service providers before RLS hardening
-- - keep the current passphrase admin gate documented as a temporary bridge
--
-- This is intentionally not a custom permissions engine.
-- RLS policies remain permissive in this foundation file until the auth/RLS
-- hardening pass replaces them with role-aware policies.

create table if not exists public.admin_principals (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  principal_type text not null default 'person'
    check (principal_type in ('person', 'station', 'service_provider', 'support')),
  display_name text not null,
  email text,
  phone text,
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_principals_email_key
  on public.admin_principals(lower(email))
  where email is not null;

create index if not exists admin_principals_auth_user_idx
  on public.admin_principals(auth_user_id)
  where auth_user_id is not null;

create table if not exists public.platform_roles (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid not null references public.admin_principals(id) on delete cascade,
  role text not null
    check (role in ('superadmin', 'support')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  granted_by uuid references public.admin_principals(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_roles_principal_role_key
  on public.platform_roles(principal_id, role)
  where status <> 'archived';

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  principal_id uuid not null references public.admin_principals(id) on delete cascade,
  role text not null
    check (role in ('org_admin', 'universal_staff')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'archived')),
  granted_by uuid references public.admin_principals(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_memberships_principal_role_key
  on public.organization_memberships(organization_id, principal_id, role)
  where status <> 'archived';

create index if not exists organization_memberships_principal_idx
  on public.organization_memberships(principal_id, status);

create table if not exists public.event_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  principal_id uuid not null references public.admin_principals(id) on delete cascade,
  role text not null
    check (role in ('event_admin', 'check_in_staff', 'service_staff', 'station_account', 'service_provider')),
  queue_id uuid references public.queues(id) on delete cascade,
  ece_id uuid references public.eces(id) on delete cascade,
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'archived')),
  granted_by uuid references public.admin_principals(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    role in ('event_admin', 'check_in_staff')
    or queue_id is not null
    or ece_id is not null
  )
);

create unique index if not exists event_staff_assignments_principal_scope_key
  on public.event_staff_assignments(
    event_id,
    principal_id,
    role,
    coalesce(queue_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(ece_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status <> 'archived';

create index if not exists event_staff_assignments_principal_idx
  on public.event_staff_assignments(principal_id, status);

create index if not exists event_staff_assignments_event_idx
  on public.event_staff_assignments(event_id, role, status);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  actor_principal_id uuid references public.admin_principals(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_org_event_idx
  on public.admin_audit_logs(organization_id, event_id, created_at desc);

create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs(actor_principal_id, created_at desc);

create or replace function public.set_admin_foundation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_principals_updated_at on public.admin_principals;
create trigger admin_principals_updated_at
before update on public.admin_principals
for each row
execute function public.set_admin_foundation_updated_at();

drop trigger if exists platform_roles_updated_at on public.platform_roles;
create trigger platform_roles_updated_at
before update on public.platform_roles
for each row
execute function public.set_admin_foundation_updated_at();

drop trigger if exists organization_memberships_updated_at on public.organization_memberships;
create trigger organization_memberships_updated_at
before update on public.organization_memberships
for each row
execute function public.set_admin_foundation_updated_at();

drop trigger if exists event_staff_assignments_updated_at on public.event_staff_assignments;
create trigger event_staff_assignments_updated_at
before update on public.event_staff_assignments
for each row
execute function public.set_admin_foundation_updated_at();

-- Helper functions for the upcoming RLS pass. These return false for anon
-- users until a principal is linked to auth.uid().
create or replace function public.current_admin_principal_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.admin_principals
  where auth_user_id = auth.uid()
    and status = 'active'
  limit 1
$$;

create or replace function public.is_qme_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_roles
    where principal_id = public.current_admin_principal_id()
      and role = 'superadmin'
      and status = 'active'
  )
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_qme_superadmin()
    or exists (
      select 1
      from public.organization_memberships
      where organization_id = target_organization_id
        and principal_id = public.current_admin_principal_id()
        and role = any(allowed_roles)
        and status = 'active'
    )
$$;

create or replace function public.has_event_role(
  target_event_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_qme_superadmin()
    or exists (
      select 1
      from public.events
      where events.id = target_event_id
        and public.has_organization_role(events.organization_id, array['org_admin', 'universal_staff'])
    )
    or exists (
      select 1
      from public.event_staff_assignments
      where event_id = target_event_id
        and principal_id = public.current_admin_principal_id()
        and role = any(allowed_roles)
        and status = 'active'
    )
$$;

-- Bootstrap helper for the first real qME operator account.
-- Usage after creating a Supabase Auth user:
--
--   select public.grant_qme_superadmin(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'Your Name',
--     'you@example.com'
--   );
--
-- This is a setup bridge, not the long-term admin invitation flow.
create or replace function public.grant_qme_superadmin(
  target_auth_user_id uuid,
  target_display_name text,
  target_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_principal_id uuid;
begin
  if target_auth_user_id is null then
    raise exception 'target_auth_user_id is required';
  end if;

  if nullif(trim(target_display_name), '') is null then
    raise exception 'target_display_name is required';
  end if;

  insert into public.admin_principals (
    auth_user_id,
    principal_type,
    display_name,
    email,
    status,
    metadata
  )
  values (
    target_auth_user_id,
    'person',
    trim(target_display_name),
    nullif(trim(target_email), ''),
    'active',
    jsonb_build_object('bootstrap', true, 'source', 'grant_qme_superadmin')
  )
  on conflict (auth_user_id) do update
  set
    display_name = excluded.display_name,
    email = coalesce(excluded.email, admin_principals.email),
    status = 'active',
    metadata = admin_principals.metadata || excluded.metadata,
    updated_at = now()
  returning id into resolved_principal_id;

  insert into public.platform_roles (
    principal_id,
    role,
    status,
    metadata
  )
  values (
    resolved_principal_id,
    'superadmin',
    'active',
    jsonb_build_object('bootstrap', true, 'source', 'grant_qme_superadmin')
  )
  on conflict (principal_id, role) where status <> 'archived' do update
  set
    status = 'active',
    metadata = platform_roles.metadata || excluded.metadata,
    updated_at = now();

  return resolved_principal_id;
end;
$$;

-- Temporary alpha policies while Supabase Auth and role-aware RLS are wired.
-- These are intentionally broad so the current pilot/admin screens continue
-- to work. Replace in the SOTC RLS hardening pass.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.admin_principals to anon, authenticated;
grant select, insert, update, delete on public.platform_roles to anon, authenticated;
grant select, insert, update, delete on public.organization_memberships to anon, authenticated;
grant select, insert, update, delete on public.event_staff_assignments to anon, authenticated;
grant select, insert on public.admin_audit_logs to anon, authenticated;

alter table public.admin_principals enable row level security;
alter table public.platform_roles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.event_staff_assignments enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_principals_all" on public.admin_principals;
create policy "admin_principals_all"
  on public.admin_principals
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "platform_roles_all" on public.platform_roles;
create policy "platform_roles_all"
  on public.platform_roles
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "organization_memberships_all" on public.organization_memberships;
create policy "organization_memberships_all"
  on public.organization_memberships
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "event_staff_assignments_all" on public.event_staff_assignments;
create policy "event_staff_assignments_all"
  on public.event_staff_assignments
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "admin_audit_logs_select_all" on public.admin_audit_logs;
create policy "admin_audit_logs_select_all"
  on public.admin_audit_logs
  for select
  to anon, authenticated
  using (true);

drop policy if exists "admin_audit_logs_insert_all" on public.admin_audit_logs;
create policy "admin_audit_logs_insert_all"
  on public.admin_audit_logs
  for insert
  to anon, authenticated
  with check (true);
