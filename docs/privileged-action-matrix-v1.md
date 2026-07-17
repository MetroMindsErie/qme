# qME Privileged Action Matrix V1

Date: 2026-07-16

## Purpose

This matrix documents the current protection boundary for sensitive qME actions after the July 16 security remediation pass. It is meant to be reviewable by Ahmed, Jalani, ChatGPT, or another technical reviewer without having to infer the security model from scattered React components, service files, RLS policies, and SQL functions.

This is the current-state matrix, not a claim that the model is finished. The largest remaining product gap is not whether qME has roles; it is that Station Staff and Station Supervisor still need to be productized into clear workspace visibility and station-scoped operating permissions.

## Role Ladder

| Role | Current meaning |
|---|---|
| Anonymous guest | Browser guest participating in an event through event-scoped guest-session tokens. No direct sensitive table access. |
| Authenticated guest/admin user | A Supabase Auth user. Auth alone is not enough for admin actions; admin RPCs also check role helpers. |
| Event staff | A named user assigned to an event. Currently used for event operations; finer station-scoped product roles are still pending. |
| Event admin | Can operate and configure a specific event, including reset and event-wide controls. |
| Organization admin | Can administer organization-owned events and setup. |
| qME superadmin | Platform support/admin authority. Bootstrap functions remain restricted to database owner/service use. |

## Matrix

| Action | User-facing action | Current code/RPC path | Required authority | Audit behavior | Data/RLS protection | Current status and remaining risk |
|---|---|---|---|---|---|---|
| Create guest check-in | Guest enters first/last name, optional contact | `create_event_check_in_for_guest` via `checkInService.createEventCheckIn` | Anonymous guest with valid event guest session token | No admin audit; row timestamp is durable | Anonymous direct table writes removed; RPC validates guest session/event | Accept for July. Recovery contact validation exists at the UI/RPC boundary, but recovery-code flow is future. |
| Read own guest check-in | Guest page restores check-in | `get_event_check_in_for_guest` | Anonymous guest with matching guest token | No admin audit | RPC validates guest-session ownership | Accept for July. |
| Guest auto-complete check-in | Auto check-in events only | `complete_event_check_in_for_guest` | Anonymous guest with matching guest token and event metadata allowing auto mode | Check-in row timestamp/status | RPC blocks host/staff-required check-in bypass | Accept for July. Host/staff check-in remains admin-controlled. |
| Staff/admin complete check-in | Staff confirms guest arrival | `admin_complete_event_check_in` | Authenticated event admin/staff or above through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks role; table RLS enabled | Verified in smoke test. Station-specific check-in staff boundaries still need product finalization. |
| Update guest access/ticket type | Staff changes Student/Professional/Photo classification | `admin_update_event_check_in_ticket_type` | Authenticated event admin/staff or above through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks role | Accept for July. Future configurable registration grants should make this less SOTC-specific. |
| Grant photo credit | Staff/admin gives Headshot credit | `admin_grant_guest_credit_for_check_in` | Authenticated event admin/staff or above through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks role; guest credit direct anon access removed | Verified in smoke test. For the July SOTC pilot, assigned check-in staff may grant photo credit per Tanya's operational guidance. Revisit after SOTC before treating this as a platform default. |
| Guest read own credit | Guest page checks eligibility for Headshot | `get_guest_credit_for_check_in_guest` | Anonymous guest with matching check-in/session token | No admin audit | RPC validates guest/check-in ownership; anon direct table read removed | Accept for July. |
| Guest join queue | Guest taps Join | `next_ticket_for_queue` guest-token overload | Anonymous guest with valid queue/event guest token | Ticket row timestamp | Legacy unscoped overload execute revoked; scoped RPC validates guest session | Verified after legacy RPC lockdown. Ticket number sequence does not reset and should remain internal. |
| Guest restore queue ticket | Guest reopens queue page | `restore_ticket_for_queue` guest-token overload and `get_ticket_for_guest` | Anonymous guest with matching guest token | No admin audit | Scoped RPC validates ticket/session ownership | Accept for July. |
| Guest leave queue | Guest taps Leave Queue | `leave_queue` guest-token overload | Anonymous guest with matching guest token | Ticket stage/time only | Legacy unscoped overload execute revoked; scoped RPC validates ownership | Accept for July. |
| Guest mark nearby | Guest taps I'm Nearby | `confirm_ticket_nearby_for_guest` | Anonymous guest with matching guest token | Ticket `nearby_confirmed_at` | Scoped RPC validates ticket/session ownership | Accept for July. |
| Auto/apply queue flow | Staff/admin or auto assist advances waiting/gathering/released | `admin_apply_queue_pilot_flow`; guest-safe `apply_queue_pilot_flow` also exists for queue nudge | Authenticated admin path requires event/queue role. Browser nudge is intentionally available but should not over-release beyond queue rules. | No explicit admin audit for routine flow nudge | Admin RPC execute only authenticated; queue rules enforce caps/cooldowns | Accept for pilot. Future: queue automation observability and stricter station-role authorization. |
| Admin release guest | Staff sends guest to Your Turn | `admin_release_queue_ticket` | Authenticated event/queue operator through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks queue/event role | Verified. Future: Station Staff vs Station Supervisor action split. |
| Admin mark Not Here | Staff marks called guest absent | `admin_mark_queue_ticket_not_here` | Authenticated event/queue operator through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks queue/event role | Verified with cooldown behavior. Cooldown setting is now visible/editable on queue settings. |
| Admin Return to Waiting | Staff moves stale Gathering guest back | `admin_return_queue_ticket_to_waiting` | Authenticated event/queue operator through role helper | Writes `admin_audit_logs` | RPC execute only authenticated; function checks queue/event role | Verified. Future: clearer station-role authority and queue automation reason display. |
| Guest service-start/Headshot self-complete | Guest taps I've Been Called | `mark_queue_service_started_for_guest`; then guest completion path | Anonymous guest with matching released ticket token | Durable `event_guest_marks` row for `headshot_service_started`; ticket completion timestamp | RPC validates ticket is released, event matches, and optional check-in belongs to guest | Accept for Headshot prototype. This deliberately records service milestone as a mark rather than adding a queue state. |
| Admin Mark Served / complete ticket | Staff/admin completes a guest ticket | `admin_complete_queue_ticket` | Authenticated event/queue operator through role helper | Writes `admin_audit_logs`; ticket `completed_at`; optional mark/credit use | RPC execute only authenticated; function checks queue/event role; credit consumption requires check-in ownership | Verified. |
| Guest scan/code completion | Guest enters station code and completes Scan-Code Adventure | `complete_queue_ticket_for_guest` | Anonymous guest with matching released ticket token and correct completion context | Ticket `completed_at`; event guest mark | RPC validates guest ticket/session and check-in/credit when required | Scan-Code retained as demo/reusable capability, not July primary flow. |
| Reset queue run | Clear one queue/station run | `reset_queue_for_queue` | Authenticated event admin or above | Writes `admin_audit_logs` | RPC execute only authenticated and now checks event-admin-or-above internally | Verified. Keep this above ordinary station staff. |
| Reset event test data | Clear SOTC test guests/tickets/marks/credits | `reset_event_test_data` | Authenticated event admin or above | Writes `admin_audit_logs` | RPC execute only authenticated and role-checked | Verified with superadmin and Jalani event admin. Destructive confirmation remains pilot-grade. |
| Edit queue operational settings | Join status, auto/manual, gathering target/max, stale/cooldown, active released | `queueService.updateQueue` direct table update | qME superadmin, org admin, or event admin by RLS | No dedicated action audit yet | `queues` RLS protects setup writes | Accepted for now. Follow-up: move operational settings updates behind named RPC with audit and station-supervisor visibility/edit rules. |
| Edit event setup | Event metadata, check-in mode, guest-home content, eCes | `eventService` / admin setup direct table operations | qME superadmin, org admin, or event admin by RLS | Mixed; no uniform setup audit yet | `events`, `eces`, `expies`, `event_guides` RLS protects writes | Accepted for July content/setup. Follow-up: named setup RPCs or audit logs for event-wide configuration changes. |
| Manage event staff | Add/remove limited staff access | Admin UI plus server routes for first-time staff Auth creation and temporary password reset | Event admin, org admin, or qME superadmin | Partial operational trace; no uniform audit matrix yet | `event_staff_assignments` RLS enabled and scoped; new Auth users/password resets are handled server-side using service role after caller event/org authority is checked | Accept for pilot. The Staff tab creates only limited staff, not event-admin/station-provider roles. Existing qME accounts are reused for additional event assignments. Temporary passwords are stored in `admin_principals.metadata` for first login or reset display until the staff person signs in; replace with invite/reset-password flow. |
| Manage organization memberships | Add org admin/staff | Admin organization UI | Organization admin or qME superadmin | No uniform audit yet | `organization_memberships` RLS enabled and scoped | Accept for foundation. Needs invitation/password lifecycle hardening. |
| Manage admin principals/users | Create named admin principal/Auth user | Admin Users surface and server route for Auth creation | qME superadmin for broad principal creation; org/event staff creation through scoped tools | Partial operational trace; no uniform audit matrix yet | `admin_principals` RLS enabled; service-role Auth/profile creation server-side | Accept for pilot. Temporary password/invitation/reset UX remains future; temporary passwords must not be treated as a production credential model. |
| Bootstrap qME superadmin | Emergency/platform bootstrap | `grant_qme_superadmin` | Database owner/service process only | No app audit | Public/anon/authenticated execute revoked | Verified closed. Do not expose in app. |
| Planning data sync | Seed live planning document | `npm run planning:seed` / service script | qME operator with local repo/env access | Git history and Supabase row update | Not part of guest/admin runtime RLS | Operational process only. Future: replace planning access code/admin controls if planning becomes multi-user production surface. |

## Direct-Client Actions Still Accepted For Now

These are not immediate July blockers because RLS is enabled and scoped, but they should remain visible to reviewers:

- Queue operational settings update uses table RLS rather than a named audited RPC.
- Event setup and event guide content updates use table RLS/direct service calls in places.
- Staff assignment and organization membership management rely on RLS without a uniform audit log.
- Station Staff and Station Supervisor are not yet fully productized into station-scoped tabs, read-only views, and per-action controls.

## Review Checklist

Ahmed/external review should try to answer:

1. Can an anonymous guest call any admin RPC or mutate another guest's state?
2. Can a normal authenticated user without an active admin role call an authenticated admin RPC successfully?
3. Can an event admin operate an event outside their assignment?
4. Can a station operator do event-wide/destructive actions such as reset?
5. Are remaining direct-client setup writes acceptable behind RLS for July, or should any be upgraded to RPC before SOTC?
6. Are audit logs sufficient for the operations we would need to explain after an event?

## Current Conclusion

The emergency high-risk boundaries are now much stronger: anonymous direct table access is removed from sensitive tables, legacy unscoped guest queue functions are revoked, privileged admin RPCs are no longer executable by anon, and live smoke tests verified the current real roles.

The next hardening layer is product/operations clarity: finalize Station Supervisor and Station Staff visibility/edit boundaries, then convert remaining important setup mutations into audited RPCs where the direct-RLS approach leaves too much ambiguity.
