-- qME Sprint 2 setup-surface RLS hardening.
-- Run after:
-- - supabase-org-event-foundation.sql
-- - supabase-expie-ece-foundation.sql
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
--
-- Intent:
-- - remove alpha-era anonymous write access from organization/event setup data
-- - keep public guest read access for active organizations, events, queues, and eCes
-- - allow setup writes only to qME superadmin, organization admin, or event admin
-- - leave tickets/event_check_ins for the later guest-token hardening pass

grant usage on schema public to anon, authenticated;

grant select on public.organizations to anon, authenticated;
grant insert, update, delete on public.organizations to authenticated;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

grant select on public.expies to anon, authenticated;
grant insert, update, delete on public.expies to authenticated;

grant select on public.eces to anon, authenticated;
grant insert, update, delete on public.eces to authenticated;

grant select on public.experiences to anon, authenticated;
grant insert, update, delete on public.experiences to authenticated;

grant select on public.queues to anon, authenticated;
grant insert, update, delete on public.queues to authenticated;

create or replace function public.can_manage_organization_setup(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_qme_superadmin()
    or public.has_organization_role(target_organization_id, array['org_admin'])
$$;

create or replace function public.can_manage_event_setup_row(
  target_event_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_qme_superadmin()
    or public.can_manage_organization_setup(target_organization_id)
    or exists (
      select 1
      from public.event_staff_assignments
      where event_id = target_event_id
        and principal_id = public.current_admin_principal_id()
        and role = 'event_admin'
        and status = 'active'
    )
$$;

create or replace function public.can_manage_event_setup(
  target_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_event_setup_row(
    target_event_id,
    (
      select events.organization_id
      from public.events
      where events.id = target_event_id
      limit 1
    )
  )
$$;

alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.expies enable row level security;
alter table public.eces enable row level security;
alter table public.experiences enable row level security;
alter table public.queues enable row level security;

-- Drop every existing policy on these setup tables. The foundation scripts used
-- broad alpha policies with known names, but older prototypes may have created
-- different policy names. This makes reruns deterministic.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'organizations',
        'events',
        'expies',
        'eces',
        'experiences',
        'queues'
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

-- Organizations are public enough to display when active. Setup writes are
-- qME superadmin only for create/delete, with org admin allowed to update the
-- organization they manage.
create policy "organizations_select_public_or_admin"
  on public.organizations
  for select
  to anon, authenticated
  using (
    status = 'active'
    or public.current_admin_principal_id() is not null
  );

create policy "organizations_insert_superadmin"
  on public.organizations
  for insert
  to authenticated
  with check (public.is_qme_superadmin());

create policy "organizations_update_org_admin"
  on public.organizations
  for update
  to authenticated
  using (public.can_manage_organization_setup(id))
  with check (public.can_manage_organization_setup(id));

create policy "organizations_delete_superadmin"
  on public.organizations
  for delete
  to authenticated
  using (public.is_qme_superadmin());

-- Events remain publicly readable when active. Event creation requires control
-- over the owning organization. Event updates/deletes require org admin,
-- event admin, or qME superadmin.
create policy "events_select_public_or_admin"
  on public.events
  for select
  to anon, authenticated
  using (
    status = 'active'
    or public.current_admin_principal_id() is not null
  );

create policy "events_insert_org_admin"
  on public.events
  for insert
  to authenticated
  with check (public.can_manage_organization_setup(organization_id));

create policy "events_update_event_admin"
  on public.events
  for update
  to authenticated
  using (public.can_manage_event_setup(id))
  with check (public.can_manage_event_setup_row(id, organization_id));

create policy "events_delete_event_admin"
  on public.events
  for delete
  to authenticated
  using (public.can_manage_event_setup(id));

-- Expies are reusable organization definitions. Public reads are limited to
-- active rows. Writes require org setup control.
create policy "expies_select_public_or_admin"
  on public.expies
  for select
  to anon, authenticated
  using (
    status = 'active'
    or public.can_manage_organization_setup(organization_id)
  );

create policy "expies_insert_org_admin"
  on public.expies
  for insert
  to authenticated
  with check (public.can_manage_organization_setup(organization_id));

create policy "expies_update_org_admin"
  on public.expies
  for update
  to authenticated
  using (public.can_manage_organization_setup(organization_id))
  with check (public.can_manage_organization_setup(organization_id));

create policy "expies_delete_org_admin"
  on public.expies
  for delete
  to authenticated
  using (public.can_manage_organization_setup(organization_id));

-- eCes are event-context activities/features. Guests can read active rows for
-- active event pages. Event setup writes require event setup control.
create policy "eces_select_public_or_admin"
  on public.eces
  for select
  to anon, authenticated
  using (
    status = 'active'
    or public.can_manage_event_setup(event_id)
  );

create policy "eces_insert_event_admin"
  on public.eces
  for insert
  to authenticated
  with check (public.can_manage_event_setup(event_id));

create policy "eces_update_event_admin"
  on public.eces
  for update
  to authenticated
  using (public.can_manage_event_setup(event_id))
  with check (public.can_manage_event_setup(event_id));

create policy "eces_delete_event_admin"
  on public.eces
  for delete
  to authenticated
  using (public.can_manage_event_setup(event_id));

-- Legacy blended experiences table: keep readable but write-scoped so any
-- remaining admin screens or migrations cannot be mutated anonymously.
create policy "experiences_select_public_or_admin"
  on public.experiences
  for select
  to anon, authenticated
  using (
    status = 'active'
    or (
      event_id is not null
      and public.can_manage_event_setup(event_id)
    )
    or (
      org_id is not null
      and public.can_manage_organization_setup(org_id)
    )
  );

create policy "experiences_insert_admin"
  on public.experiences
  for insert
  to authenticated
  with check (
    (
      event_id is not null
      and public.can_manage_event_setup(event_id)
    )
    or (
      event_id is null
      and org_id is not null
      and public.can_manage_organization_setup(org_id)
    )
  );

create policy "experiences_update_admin"
  on public.experiences
  for update
  to authenticated
  using (
    (
      event_id is not null
      and public.can_manage_event_setup(event_id)
    )
    or (
      event_id is null
      and org_id is not null
      and public.can_manage_organization_setup(org_id)
    )
  )
  with check (
    (
      event_id is not null
      and public.can_manage_event_setup(event_id)
    )
    or (
      event_id is null
      and org_id is not null
      and public.can_manage_organization_setup(org_id)
    )
  );

create policy "experiences_delete_admin"
  on public.experiences
  for delete
  to authenticated
  using (
    (
      event_id is not null
      and public.can_manage_event_setup(event_id)
    )
    or (
      event_id is null
      and org_id is not null
      and public.can_manage_organization_setup(org_id)
    )
  );

-- Queues are guest-readable when active, but queue engine setup/edit/delete is
-- event-admin scoped. Ticket movement remains governed by ticket/RPC policies.
create policy "queues_select_public_or_admin"
  on public.queues
  for select
  to anon, authenticated
  using (
    status = 'active'
    or public.can_manage_event_setup(event_id)
  );

create policy "queues_insert_event_admin"
  on public.queues
  for insert
  to authenticated
  with check (public.can_manage_event_setup(event_id));

create policy "queues_update_event_admin"
  on public.queues
  for update
  to authenticated
  using (public.can_manage_event_setup(event_id))
  with check (public.can_manage_event_setup(event_id));

create policy "queues_delete_event_admin"
  on public.queues
  for delete
  to authenticated
  using (public.can_manage_event_setup(event_id));
