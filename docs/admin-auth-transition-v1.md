# qME Admin Auth Transition v1

Date: 2026-06-26

## Purpose

This note records the Sprint 2 authentication direction before RLS hardening.
The goal is practical platform trust, not a full enterprise auth system.

## Previous Temporary State

Admin screens were previously protected by `AdminGate` using a shared passphrase
and `qme:adminAccess` browser session storage.

That bridge was acceptable only as a short pilot bridge because:

- it keeps current Peony and SOTC admin screens usable during migration;
- it avoids locking the owner out before a real principal exists;
- it is not actor-specific and cannot support meaningful RLS or audit logs.

As of 2026-06-29, the passphrase bridge has been removed. Admin screens require
Supabase Auth sign-in with a linked active `admin_principals` row.

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

## Transition Status

`AdminGate` now uses Supabase Auth-based admin access. The initial transition is
complete:

- the owner has a linked `superadmin` principal;
- admin pages can read the current principal;
- organization/event role checks are available client-side for routing hints;
- event-level staff access has been tested with Jalani for `SOTC Test Check-in`;
- RLS policies use database-side helper functions for the first hardening pass.

Remaining work is now onboarding polish and hardening, not replacing the
passphrase gate.

## Not In This Slice

- invitation workflow;
- password reset or magic-link decisions;
- required temporary-password change on first login;
- fuller strict RLS enforcement for guest-owned records;
- custom permissions.

Those should follow after the first role/RLS pass is smoke-tested.
