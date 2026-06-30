# SOTC RLS Hardening V1

Date: 2026-06-29

## Purpose

This pass starts moving the SOTC pilot away from broad alpha policies and toward role-aware Supabase security.

It is intentionally a first pass, not the final security model. qME still allows anonymous guest participation, and guest queue tickets are currently tied to browser/localStorage state rather than a durable guest account or signed guest token.

## Hardened Now

### Pass 4: Guest Action RLS Tightening

Drafted in `supabase-guest-action-rls-tightening.sql`.

- `event_check_ins`
  - Anonymous direct table access is removed.
  - Guests create, fetch, and auto-complete only their own check-in through guest-token verified RPCs.
  - Guest self-completion is allowed only when the event metadata sets check-in completion mode to `auto`; staff/host check-in cannot be bypassed through the guest RPC.
  - Staff/admin direct table access is scoped by `can_manage_event_guest_action(event_id)`.

- `tickets`
  - Anonymous direct table access is removed.
  - Guests fetch, rename, mark nearby, and complete only their own ticket through guest-token verified RPCs.
  - Staff/admin direct ticket access is scoped through the ticket's queue event.

- `event_guest_marks`
  - Anonymous direct insert/update is removed.
  - Guest scan/code completion now writes marks through `complete_queue_ticket_for_guest`, which verifies ticket ownership, event ownership, and optional check-in ownership.
  - Staff/admin direct mark access is scoped by event role.

- `event_guest_credits`
  - Anonymous direct credit reads are removed.
  - Guests can fetch a credit for their own check-in through `get_guest_credit_for_check_in_guest`.
  - Staff/admin direct credit access remains scoped by event role.

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
  - Guest reads move behind a guest-token RPC in the fourth pass.

- `event_guest_marks`
  - Guest-sourced completion marks move behind a guest-token RPC in the fourth pass.
  - Staff/admins can manage marks.

## Still Temporary

- Admin onboarding polish
  - Protected staff/admin database actions expect a real Supabase Auth user linked to an active `admin_principals` row.
  - The passphrase-only admin bridge has been removed.
  - Temporary password change, invitation emails, and password reset flow still need hardening.

- Guest session recovery
  - Optional email/phone can be stored, but one-time recovery codes are not implemented yet.

- Legacy/fallback compatibility
  - The app still contains fallbacks for environments where the guest-session RPCs have not been installed.
  - After `supabase-guest-action-rls-tightening.sql` is run, current production should use the scoped RPC path for guest actions.

- Stale queue blockers
  - The RLS pass does not solve stale standby/released tickets.
  - That remains a separate queue operations story so staff can clear guests who never return.

## Recommended Test After Running SQL

1. Superadmin can still open `/admin/events`, `/admin/principals`, and `/admin/organizations`.
2. Jalani can sign in and see/manage only `SOTC Test Check-in`.
3. Jalani cannot open Admin Users or broad organization controls.
4. Event admin can add/remove event staff assignments for `SOTC Test Check-in`.
5. Event admin can edit the SOTC Test Check-in event and event features.
6. Anonymous user cannot create/edit organizations, events, expies, eCes, or queues by direct client write.
7. Check-in staff/event admin can check in guests and grant photo credit.
8. Guest can still, after a fresh check-in/session:
   - check in,
   - join Scan-Code Adventure,
   - join Headshot Photographer when eligible,
   - mark nearby,
   - complete scan-code adventure.
9. Anonymous user cannot grant photo credits, read another guest's credit, read another guest's ticket, or insert completion marks by direct client table access.

## Next Hardening Step

Run and smoke-test `supabase-guest-action-rls-tightening.sql` after the matching app deploy. Then use the computer engineering review to look for policy bypasses, missing audit logs, and remaining broad direct-table access before moving deeper into event-builder work.
