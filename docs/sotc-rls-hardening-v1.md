# SOTC RLS Hardening V1

Date: 2026-06-29

## Purpose

This pass starts moving the SOTC pilot away from broad alpha policies and toward role-aware Supabase security.

It is intentionally a first pass, not the final security model. qME still allows anonymous guest participation, and guest queue tickets are currently tied to browser/localStorage state rather than a durable guest account or signed guest token.

## Hardened Now

### Pass 3: Guest Session Foundation

Drafted in `supabase-guest-session-foundation.sql`.

- `guest_sessions`
  - Anonymous guest browsers get an event-scoped random token stored locally.
  - The database stores only a SHA-256 hash of that token.
  - Optional email/phone can be captured for later recovery-code flows without forcing guest accounts now.
  - Staff/admins can read/manage guest sessions for events they can manage.
  - Anonymous users cannot directly browse `guest_sessions`; they create/update through security-definer functions.

- `event_check_ins`
  - Adds nullable `guest_session_id`.
  - New guest check-ins can link to the browser's guest session when the SQL is installed.
  - The app falls back to legacy check-in insertion if the SQL has not been run yet.

- `tickets`
  - Adds nullable `guest_session_id`.
  - New/restore/check-in/leave queue RPC overloads can attach and verify the browser guest session.
  - The app falls back to legacy queue RPCs if the new overloads have not been installed yet.

- Guest recovery
  - This pass stores enough contact/session data to support future recovery by email or phone code.
  - It does not yet send one-time codes or restore sessions across devices.

### Pass 2: Setup Surfaces

Added in `supabase-sprint2-setup-rls.sql`.

- `organizations`
  - Active organizations remain public-readable.
  - qME superadmin can create/delete organizations.
  - qME superadmin and organization admin can update their organization.

- `events`
  - Active events remain public-readable for guest event pages.
  - Event creation requires qME superadmin or organization admin for the owning organization.
  - Event updates/deletes require qME superadmin, organization admin, or event admin.

- `expies`
  - Active reusable expies remain readable.
  - Reusable expie writes require qME superadmin or organization admin.

- `eces`
  - Active event-context activities/features remain guest-readable.
  - Event feature setup writes require qME superadmin, organization admin, or event admin.

- `experiences`
  - Legacy blended experience rows remain readable for active rows.
  - Writes are restricted to organization/event setup admins while the legacy table remains in place.

- `queues`
  - Active queue rows remain guest-readable.
  - Queue setup/edit/delete requires qME superadmin, organization admin, or event admin.
  - Ticket movement and guest queue participation remain in the later guest-token/RPC pass.

### Pass 1: Role and SOTC Guest Action Tables

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
  - Guest-owned identity foundation is drafted but not yet the final RLS flip.
  - Staff/admin ticket transitions should move behind scoped RPCs or policies in a later pass.

- `event_check_ins`
  - Guest-session linking is drafted.
  - Final RLS should expose only the current guest's check-in plus staff/admin scoped views.

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
5. Event admin can edit the SOTC Test Check-in event and event features.
6. Anonymous user cannot create/edit organizations, events, expies, eCes, or queues by direct client write.
7. Check-in staff/event admin can check in guests and grant photo credit.
8. Guest can still:
   - check in,
   - join Scan-Code Adventure,
   - join Headshot Photographer when eligible,
   - mark nearby,
   - complete scan-code adventure.
9. Anonymous user cannot grant photo credits by direct client update.

## Next Hardening Step

Run and smoke-test `supabase-guest-session-foundation.sql`, then tighten `event_check_ins`, `tickets`, guest marks, and guest credit reads around the guest session model instead of broad anonymous access.
