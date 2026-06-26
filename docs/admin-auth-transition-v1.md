# qME Admin Auth Transition v1

Date: 2026-06-26

## Purpose

This note records the Sprint 2 authentication direction before RLS hardening.
The goal is practical platform trust, not a full enterprise auth system.

## Current Temporary State

Admin screens are protected by `AdminGate`, which uses a shared passphrase and
stores `qme:adminAccess` in browser session storage.

This is acceptable only as a short pilot bridge because:

- it keeps current Peony and SOTC admin screens usable during migration;
- it avoids locking the owner out before a real principal exists;
- it is not actor-specific and cannot support meaningful RLS or audit logs.

## Near-Term Decision

Use Supabase Auth for admin-side identities and link each authenticated user to
`public.admin_principals.auth_user_id`.

Admin authority then comes from:

- `platform_roles` for qME `superadmin` and support roles;
- `organization_memberships` for `org_admin` and `universal_staff`;
- `event_staff_assignments` for event admin, check-in staff, station accounts,
  service staff, and service providers.

Guest participation remains anonymous/public for the near-term SOTC pilot:

- guests can check in;
- guests can join eligible queues;
- guests can mark themselves nearby;
- guests can complete guest-owned code actions.

Guest/anon users must not be able to perform staff/admin actions once RLS is
hardened.

## Bootstrap Path

After creating the first Supabase Auth user, run:

```sql
select public.grant_qme_superadmin(
  '<auth-user-id>'::uuid,
  '<display name>',
  '<email>'
);
```

That creates or updates an `admin_principal` and grants the `superadmin` platform
role.

## Replacement Intent

`AdminGate` should be replaced by Supabase Auth-based admin access once:

- the owner has a linked `superadmin` principal;
- admin pages can read the current principal;
- organization/event role checks are available client-side for routing hints;
- RLS policies use database-side helper functions for enforcement.

Until then, `AdminGate` is a convenience gate only. It is not a security model.

## Not In This Slice

- polished login UI;
- invitation workflow;
- password reset or magic-link decisions;
- role management UI;
- strict RLS enforcement;
- custom permissions.

Those should follow after this bridge is stable.
