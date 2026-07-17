-- qME Security Emergency Verification
-- Date: 2026-07-16
--
-- Run this first in Supabase SQL Editor before applying remediation.
-- This script is read-only. It inspects live grants, policies, and sensitive
-- function execution exposure for Ahmed's security review.

-- 1. Sensitive table RLS status.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'event_group_order_items',
    'event_guest_credits',
    'event_guest_marks',
    'event_check_ins',
    'tickets',
    'admin_principals',
    'platform_roles',
    'organization_memberships',
    'event_staff_assignments'
  )
order by tablename;

-- 2. Sensitive table privileges.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'event_group_order_items',
    'event_guest_credits',
    'event_guest_marks',
    'event_check_ins',
    'tickets',
    'admin_principals',
    'platform_roles',
    'organization_memberships',
    'event_staff_assignments'
  )
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, grantee, privilege_type;

-- 3. Sensitive RLS policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'event_group_order_items',
    'event_guest_credits',
    'event_guest_marks',
    'event_check_ins',
    'tickets',
    'admin_principals',
    'platform_roles',
    'organization_memberships',
    'event_staff_assignments'
  )
order by tablename, policyname;

-- 4. Privileged/security-definer function inventory.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.proconfig as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.prosecdef
    or p.proname in (
      'grant_qme_superadmin',
      'create_admin_principal',
      'assign_platform_role',
      'assign_organization_membership',
      'assign_event_staff',
      'admin_complete_queue_ticket',
      'complete_queue_ticket_for_guest',
      'admin_reset_event_test_data'
    )
  )
order by p.proname, args;

-- 5. EXECUTE grants on sensitive functions.
select
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('anon', 'authenticated', 'public')
  and routine_name in (
    'grant_qme_superadmin',
    'create_admin_principal',
    'assign_platform_role',
    'assign_organization_membership',
    'assign_event_staff',
    'admin_complete_queue_ticket',
    'complete_queue_ticket_for_guest',
    'admin_reset_event_test_data',
    'get_guest_credit_for_check_in_guest'
  )
order by routine_name, grantee;

-- 6. Group-order data audit. Report, do not delete automatically.
select
  'missing_check_in' as issue,
  count(*) as row_count
from public.event_group_order_items items
left join public.event_check_ins check_ins on check_ins.id = items.check_in_id
where check_ins.id is null
union all
select
  'event_mismatch' as issue,
  count(*) as row_count
from public.event_group_order_items items
join public.event_check_ins check_ins on check_ins.id = items.check_in_id
where check_ins.event_id is distinct from items.event_id
union all
select
  'negative_or_null_quantity' as issue,
  count(*) as row_count
from public.event_group_order_items
where quantity is null or quantity < 0
union all
select
  'unusual_quantity_over_25' as issue,
  count(*) as row_count
from public.event_group_order_items
where quantity > 25;

-- 7. Credit rows without durable check-in ownership.
select
  event_id,
  credit_key,
  count(*) as rows_without_check_in
from public.event_guest_credits
where check_in_id is null
group by event_id, credit_key
order by rows_without_check_in desc;

-- 8. Group-order anonymous write-access regression.
-- Expected: zero rows. Any result here means the disabled group-order pilot has
-- regained anonymous/public write access and must be treated as a security
-- regression before Food/Cookie ordering is re-enabled.
select
  'unexpected_group_order_anon_write_grant' as issue,
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'event_group_order_items'
  and grantee in ('anon', 'public')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by grantee, privilege_type;

-- 9. Group-order permissive policy regression.
-- Expected: zero rows. Guest-owned ordering should return only through scoped
-- RPCs after a secure rebuild, not broad table policies.
select
  'unexpected_group_order_permissive_policy' as issue,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'event_group_order_items'
  and (
    roles && array['anon'::name, 'public'::name]
    or qual = 'true'
    or with_check = 'true'
  )
order by policyname;
