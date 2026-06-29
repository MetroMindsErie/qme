# SOTC RLS Hardening V1

Date: 2026-06-29

## Purpose

This pass starts moving the SOTC pilot away from broad alpha policies and toward role-aware Supabase security.

It is intentionally a first pass, not the final security model. qME still allows anonymous guest participation, and guest queue tickets are currently tied to browser/localStorage state rather than a durable guest account or signed guest token.

## Hardened Now

- `admin_principals`
  - Authenticated qME admins can read active principals.
  - Superadmin can create, update, archive, and link principals.
  - Anonymous users cannot read admin principals.

- `platform_roles`
  - Users can read their own platform role.
  - Superadmin can manage platform roles.

- `organization_memberships`
  - Users can read their own memberships.
  - Organization admins/superadmins can manage memberships for their organization.

- `event_staff_assignments`
  - Users can read their own event assignments.
  - Event admins, organization admins, and superadmins can manage staff assignments for their event.

- `admin_audit_logs`
  - Scoped read by qME superadmin, organization admin, or event staff/admin.
  - Authenticated admins can insert logs as themselves.

- `event_guest_designations`
  - Staff/admin managed only.

- `event_guest_credits`
  - Staff/admin only for grant, consume, update, or delete.
  - Guest read remains open for the pilot because the guest credit UI does not yet have a durable guest identity.

- `event_guest_marks`
  - Guest-sourced completion marks remain allowed for scan/code pilot completion.
  - Staff/admins can manage marks.

## Still Temporary

- Admin onboarding polish
  - Protected staff/admin database actions expect a real Supabase Auth user linked to an active `admin_principals` row.
  - The passphrase-only admin bridge has been removed.
  - Temporary password change, invitation emails, and password reset flow still need hardening.

- `tickets`
  - Still needs a guest-owned identity/token before per-ticket RLS can distinguish one anonymous guest from another.

- `event_check_ins`
  - Still needs a check-in token or guest session before RLS can safely expose only the current guest's check-in.

- `event_guest_credits` select
  - Still readable by anonymous users for pilot compatibility.
  - Write access is now staff/admin-only.

- Guest-sourced marks
  - Still allow anonymous insert when `source = 'guest'`.
  - This preserves scan/code completion until station-code completion moves behind a safer function or signed guest context.

## Recommended Test After Running SQL

1. Superadmin can still open `/admin/events`, `/admin/principals`, and `/admin/organizations`.
2. Jalani can sign in and see/manage only `SOTC Test Check-in`.
3. Jalani cannot open Admin Users or broad organization controls.
4. Event admin can add/remove event staff assignments for `SOTC Test Check-in`.
5. Check-in staff/event admin can check in guests and grant photo credit.
6. Guest can still:
   - check in,
   - join Scan-Code Adventure,
   - join Headshot Photographer when eligible,
   - mark nearby,
   - complete scan-code adventure.
7. Anonymous user cannot grant photo credits by direct client update.

## Next Hardening Step

Add a guest participation token/session model so `event_check_ins`, `tickets`, guest marks, and guest credit reads can be scoped to the actual guest rather than staying broadly readable for the pilot.
