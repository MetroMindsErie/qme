-- qME SOTC RLS hardening pass v1.
-- Run after:
-- - supabase-org-event-foundation.sql
-- - supabase-expie-ece-foundation.sql
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-queue-pilot.sql
--
-- Intent:
-- - protect admin identity/role tables behind authenticated qME admins
-- - restrict SOTC credit/designation mutations to event/staff/admin roles
-- - preserve anonymous guest participation through scoped RPCs, not direct table access
--
-- Guest identity/token RPCs are added in supabase-guest-session-foundation.sql
-- and supabase-guest-action-rls-tightening.sql. Do not restore anonymous direct
-- table grants for guest check-ins, tickets, marks, or credits.

grant usage on schema public to anon, authenticated;

-- Keep table grants broad enough for PostgREST, but rely on RLS for row/action
-- decisions. The service role bypasses RLS for server-side admin user creation.
grant select, insert, update, delete on public.admin_principals to authenticated;
grant select, insert, update, delete on public.platform_roles to authenticated;
grant select, insert, update, delete on public.organization_memberships to authenticated;
grant select, insert, update, delete on public.event_staff_assignments to authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

revoke all on public.event_guest_marks from anon;
grant select, insert, update, delete on public.event_guest_designations to authenticated;
revoke all on public.event_guest_credits from anon;
grant select, insert, update, delete on public.event_guest_marks to authenticated;
grant select, insert, update, delete on public.event_guest_credits to authenticated;

-- Helper: event-scoped staff, including queue/eCe-scoped station/service roles.
create or replace function public.has_event_staff_role(
  target_event_id uuid,
  allowed_roles text[],
  target_queue_id uuid default null,
  target_ece_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_event_role(target_event_id, allowed_roles)
    or exists (
      select 1
      from public.event_staff_assignments esa
      where esa.event_id = target_event_id
        and esa.principal_id = public.current_admin_principal_id()
        and esa.role = any(allowed_roles)
        and esa.status = 'active'
        and (
          target_queue_id is null
          or esa.queue_id is null
          or esa.queue_id = target_queue_id
        )
        and (
          target_ece_id is null
          or esa.ece_id is null
          or esa.ece_id = target_ece_id
        )
    )
$$;

-- Helper: staff/admin control over guest-facing event action records.
create or replace function public.can_manage_event_guest_action(
  target_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_event_role(
    target_event_id,
    array['event_admin', 'check_in_staff', 'service_staff', 'service_provider', 'station_account']
  )
$$;

-- Admin principals: authenticated qME admins can see active principals so org
-- and event admins can assign existing people by email. Only superadmin can
-- create/archive/link principals from the client.
drop policy if exists "admin_principals_all" on public.admin_principals;
drop policy if exists "admin_principals_select_admins" on public.admin_principals;
create policy "admin_principals_select_admins"
  on public.admin_principals
  for select
  to authenticated
  using (
    public.current_admin_principal_id() is not null
    and (
      status = 'active'
      or id = public.current_admin_principal_id()
      or public.is_qme_superadmin()
    )
  );

drop policy if exists "admin_principals_insert_superadmin" on public.admin_principals;
create policy "admin_principals_insert_superadmin"
  on public.admin_principals
  for insert
  to authenticated
  with check (public.is_qme_superadmin());

drop policy if exists "admin_principals_update_superadmin" on public.admin_principals;
create policy "admin_principals_update_superadmin"
  on public.admin_principals
  for update
  to authenticated
  using (public.is_qme_superadmin())
  with check (public.is_qme_superadmin());

drop policy if exists "admin_principals_delete_superadmin" on public.admin_principals;
create policy "admin_principals_delete_superadmin"
  on public.admin_principals
  for delete
  to authenticated
  using (public.is_qme_superadmin());

-- Platform roles are qME-owner-only except each authenticated principal can
-- read their own active platform role during admin shell load.
drop policy if exists "platform_roles_all" on public.platform_roles;
drop policy if exists "platform_roles_select_scoped" on public.platform_roles;
create policy "platform_roles_select_scoped"
  on public.platform_roles
  for select
  to authenticated
  using (
    public.is_qme_superadmin()
    or principal_id = public.current_admin_principal_id()
  );

drop policy if exists "platform_roles_write_superadmin" on public.platform_roles;
create policy "platform_roles_write_superadmin"
  on public.platform_roles
  for all
  to authenticated
  using (public.is_qme_superadmin())
  with check (public.is_qme_superadmin());

-- Organization memberships: users can read their own memberships; org admins
-- and superadmins can read/write memberships for organizations they manage.
drop policy if exists "organization_memberships_all" on public.organization_memberships;
drop policy if exists "organization_memberships_select_scoped" on public.organization_memberships;
create policy "organization_memberships_select_scoped"
  on public.organization_memberships
  for select
  to authenticated
  using (
    principal_id = public.current_admin_principal_id()
    or public.has_organization_role(organization_id, array['org_admin'])
  );

drop policy if exists "organization_memberships_insert_org_admin" on public.organization_memberships;
create policy "organization_memberships_insert_org_admin"
  on public.organization_memberships
  for insert
  to authenticated
  with check (public.has_organization_role(organization_id, array['org_admin']));

drop policy if exists "organization_memberships_update_org_admin" on public.organization_memberships;
create policy "organization_memberships_update_org_admin"
  on public.organization_memberships
  for update
  to authenticated
  using (public.has_organization_role(organization_id, array['org_admin']))
  with check (public.has_organization_role(organization_id, array['org_admin']));

drop policy if exists "organization_memberships_delete_org_admin" on public.organization_memberships;
create policy "organization_memberships_delete_org_admin"
  on public.organization_memberships
  for delete
  to authenticated
  using (public.has_organization_role(organization_id, array['org_admin']));

-- Event staff assignments: users can read their own assignments; event admins,
-- org admins, and superadmins can manage assignments for their event.
drop policy if exists "event_staff_assignments_all" on public.event_staff_assignments;
drop policy if exists "event_staff_assignments_select_scoped" on public.event_staff_assignments;
create policy "event_staff_assignments_select_scoped"
  on public.event_staff_assignments
  for select
  to authenticated
  using (
    principal_id = public.current_admin_principal_id()
    or public.has_event_role(event_id, array['event_admin'])
    or public.has_organization_role(organization_id, array['org_admin'])
  );

drop policy if exists "event_staff_assignments_insert_event_admin" on public.event_staff_assignments;
create policy "event_staff_assignments_insert_event_admin"
  on public.event_staff_assignments
  for insert
  to authenticated
  with check (
    public.has_event_role(event_id, array['event_admin'])
    or public.has_organization_role(organization_id, array['org_admin'])
  );

drop policy if exists "event_staff_assignments_update_event_admin" on public.event_staff_assignments;
create policy "event_staff_assignments_update_event_admin"
  on public.event_staff_assignments
  for update
  to authenticated
  using (
    public.has_event_role(event_id, array['event_admin'])
    or public.has_organization_role(organization_id, array['org_admin'])
  )
  with check (
    public.has_event_role(event_id, array['event_admin'])
    or public.has_organization_role(organization_id, array['org_admin'])
  );

drop policy if exists "event_staff_assignments_delete_event_admin" on public.event_staff_assignments;
create policy "event_staff_assignments_delete_event_admin"
  on public.event_staff_assignments
  for delete
  to authenticated
  using (
    public.has_event_role(event_id, array['event_admin'])
    or public.has_organization_role(organization_id, array['org_admin'])
  );

-- Audit logs: event/org admins can read logs in their scope. Authenticated
-- admins may insert logs for actions they perform. A fuller audit trigger pass
-- can add automatic writes later.
drop policy if exists "admin_audit_logs_select_all" on public.admin_audit_logs;
drop policy if exists "admin_audit_logs_insert_all" on public.admin_audit_logs;
drop policy if exists "admin_audit_logs_select_scoped" on public.admin_audit_logs;
create policy "admin_audit_logs_select_scoped"
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    public.is_qme_superadmin()
    or (
      organization_id is not null
      and public.has_organization_role(organization_id, array['org_admin'])
    )
    or (
      event_id is not null
      and public.has_event_role(event_id, array['event_admin', 'check_in_staff', 'service_staff', 'service_provider', 'station_account'])
    )
  );

drop policy if exists "admin_audit_logs_insert_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_insert_admin"
  on public.admin_audit_logs
  for insert
  to authenticated
  with check (
    public.current_admin_principal_id() is not null
    and (
      actor_principal_id is null
      or actor_principal_id = public.current_admin_principal_id()
      or public.is_qme_superadmin()
    )
  );

-- Guest marks: guest-sourced completion marks now go through scoped RPCs.
-- Staff/admins can read and manage marks directly under RLS.
drop policy if exists "event_guest_marks_all" on public.event_guest_marks;
drop policy if exists "event_guest_marks_select_scoped" on public.event_guest_marks;
create policy "event_guest_marks_select_scoped"
  on public.event_guest_marks
  for select
  to authenticated
  using (
    public.can_manage_event_guest_action(event_id)
  );

drop policy if exists "event_guest_marks_insert_guest_or_staff" on public.event_guest_marks;
create policy "event_guest_marks_insert_guest_or_staff"
  on public.event_guest_marks
  for insert
  to authenticated
  with check (
    public.can_manage_event_guest_action(event_id)
  );

drop policy if exists "event_guest_marks_update_staff" on public.event_guest_marks;
create policy "event_guest_marks_update_staff"
  on public.event_guest_marks
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_marks_delete_staff" on public.event_guest_marks;
create policy "event_guest_marks_delete_staff"
  on public.event_guest_marks
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

-- Guest designations are staff/admin managed.
drop policy if exists "event_guest_designations_all" on public.event_guest_designations;
drop policy if exists "event_guest_designations_select_staff" on public.event_guest_designations;
create policy "event_guest_designations_select_staff"
  on public.event_guest_designations
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_designations_insert_staff" on public.event_guest_designations;
create policy "event_guest_designations_insert_staff"
  on public.event_guest_designations
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_designations_update_staff" on public.event_guest_designations;
create policy "event_guest_designations_update_staff"
  on public.event_guest_designations
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_designations_delete_staff" on public.event_guest_designations;
create policy "event_guest_designations_delete_staff"
  on public.event_guest_designations
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

-- Credits: guests read credit state through scoped RPCs. Direct table access is
-- staff/admin only.
drop policy if exists "event_guest_credits_all" on public.event_guest_credits;
drop policy if exists "event_guest_credits_select_pilot" on public.event_guest_credits;
create policy "event_guest_credits_select_pilot"
  on public.event_guest_credits
  for select
  to authenticated
  using (
    public.can_manage_event_guest_action(event_id)
  );

drop policy if exists "event_guest_credits_insert_staff" on public.event_guest_credits;
create policy "event_guest_credits_insert_staff"
  on public.event_guest_credits
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_credits_update_staff" on public.event_guest_credits;
create policy "event_guest_credits_update_staff"
  on public.event_guest_credits
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_credits_delete_staff" on public.event_guest_credits;
create policy "event_guest_credits_delete_staff"
  on public.event_guest_credits
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));
