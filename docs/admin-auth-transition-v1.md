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

## Pilot Staff Onboarding Bridge

As of 2026-07-17, event admins and above can add limited event staff from the
event Staff tab. If the email does not already match an active qME admin
principal, the app creates a Supabase Auth user, creates the linked
`admin_principals` row, assigns limited event staff access, and shows a generated
temporary password to the event admin.

If the email already belongs to an active qME admin principal, qME reuses that
existing account and only adds the event-scoped staff assignment. The admin is
told that the staff person can use their existing credentials for this event.
If the person cannot find their password, the event Staff tab can generate a new
temporary password for that event staff row.

For this pilot, the temporary password is stored in
`admin_principals.metadata.temporary_password` so the Staff tab can show a
`Password` button after refresh. This is intentionally a short-term operational
bridge, not a long-term credential model.

The temporary password metadata is removed when the staff person signs in and
completes the first-login profile screen. Reset passwords do not wipe or require
profile onboarding again; the reset temporary password remains visible in the
Staff tab until the staff person signs in with it, then the row returns to a
`Reset Password` action. The first-login profile screen asks for:

- email, prefilled from the admin principal;
- first name and last name, with at least one required;
- optional mobile phone.

Profile completion is handled through `/api/admin-complete-profile`, which uses
the signed-in user's bearer token and the server-side service role to update only
that user's own active `admin_principals` row. This avoids broad client-side
update access to `admin_principals` under the hardened RLS model.

Replacement intent:

- use proper invite emails, password reset, magic link, or forced password-change
  flow;
- stop storing temporary passwords in application metadata;
- add stronger audit around staff user creation and credential delivery;
- support more mature account recovery and identity changes.

## Not In This Slice

- invitation workflow;
- password reset or magic-link decisions;
- required temporary-password change on first login;
- fuller strict RLS enforcement for guest-owned records;
- custom permissions.

Those should follow after the first role/RLS pass is smoke-tested.
