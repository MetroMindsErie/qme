# qME Station Role Visibility Matrix V1

Date: 2026-07-16

## Purpose

This document defines the current target visibility and control model for day-of event operations. The goal is to make qME understandable for real staff before adding more platform features.

The security layer now has named users, event assignments, RLS, guest-session tokens, and role-checked RPCs for key actions. The next problem is workspace clarity: each role should land in the right place, see the right tabs, and understand which controls are available, read-only, or hidden.

## Role Definitions

| Role | Scope | Product meaning |
|---|---|---|
| qME Superadmin | Platform | qME support/operator. Can troubleshoot all organizations and events. Should use this power deliberately and visibly. |
| Organization Admin | Organization | Owns organization setup, events, reusable content, organization staff, and support across the organization's events. |
| Event Admin | Event | Owns one event's setup and day-of operation, including staffing, reset, event-wide settings, and cross-station support. |
| Station Supervisor | One or more stations/activities in an event | Elevated station operator. Handles exceptions, sees why the station behaves the way it does, may edit selected operational controls where the event allows it. |
| Station Staff | One or more stations/activities in an event | Focused day-of operator. Works the live line/check-in/service list for assigned station only. Minimal setup exposure. |
| Guest | Event participation | Checks in, joins eligible stations, follows queue/status instructions, and completes guest-owned actions. |

Station Supervisor and Station Staff are operational workspace roles. They should not automatically become event setup roles.

## Visibility Matrix

| Workspace / control | qME Superadmin | Org Admin | Event Admin | Station Supervisor | Station Staff |
|---|---|---|---|---|---|
| Admin landing | Full org/event chooser | Organization dashboard | Assigned event overview | Assigned station chooser or direct station | Direct assigned station if one; chooser if many |
| Organization list/settings | Full | Own orgs | Hidden | Hidden | Hidden |
| Admin users/principals | Full | Limited org staff when implemented | Hidden or event staff only | Hidden | Hidden |
| Event list | All | Own org events | Assigned events | Assigned events/stations only | Assigned events/stations only |
| Event overview Operations tab | Full | Full for org events | Full for assigned event | Read-only summary for assigned stations | Hidden or minimal assigned-station summary |
| Event Staff tab | Full | Full for org events | Can manage assigned event staff | Hidden/read-only | Hidden |
| Event Setup tab | Full | Full for org events | Full for assigned event | Hidden/read-only | Hidden |
| Reset event test data | Yes | Yes for org event | Yes for assigned event | No | No |
| Event check-in Live tab | Yes | Yes | Yes | If assigned to check-in | If assigned to check-in |
| Event check-in History tab | Yes | Yes | Yes | If assigned, usually read-only | If assigned, maybe read-only |
| Event check-in Settings tab | Yes | Yes | Yes | Read-only unless explicitly elevated | Hidden/read-only |
| Complete guest check-in | Yes | Yes | Yes | If assigned to check-in | If assigned to check-in |
| Update ticket/access type | Yes | Yes | Yes | Station-specific decision; likely supervisor for Registration | Usually no |
| Grant photo credit | Yes | Yes | Yes | Station-specific decision; allowed for SOTC Registration/Check-In Staff in July pilot | Allowed for SOTC Registration/Check-In Staff in July pilot |
| Queue/station Live Line tab | Yes | Yes | Yes | Yes for assigned station | Yes for assigned station |
| Queue/station History tab | Yes | Yes | Yes | Yes for assigned station | Read-only or hidden by station |
| Queue/station Settings tab | Yes | Yes | Yes | Hidden for July pilot unless explicitly promoted | Hidden |
| Apply Flow / Auto assist nudge | Yes | Yes | Yes | Yes for assigned queue | Possibly yes for assigned queue if simple |
| Mark Not Here | Yes | Yes | Yes | Yes for assigned queue | Usually yes for assigned queue |
| Return to Waiting | Yes | Yes | Yes | Yes for assigned queue | Usually yes for assigned queue |
| Mark Served / Complete | Yes | Yes | Yes | Yes for assigned queue | Yes for assigned queue |
| Edit queue settings | Yes | Yes | Yes | Maybe selected operational fields | No |
| Reset single queue | Yes | Yes | Yes | Usually no; could be elevated station supervisor later | No |
| Delete event/eCe/queue | Yes | Yes | Yes with confirmation | No | No |
| Cross-station actions | Yes | Yes | Yes | No unless assigned to multiple stations | No |
| View audit/history across event | Yes | Yes | Yes | Assigned station only | Hidden/read-only assigned station |

## Station-Specific Authority

Station Supervisor is not a universal "mini event admin." Some stations need elevated local authority; others do not.

Examples:

| Station | Supervisor authority candidate | Staff authority candidate |
|---|---|---|
| Event Check-In / Registration | Complete check-in, resolve classification, grant photo credit, view history | Complete check-in if assigned; photo credit grant is allowed for the SOTC July pilot per Tanya's operational guidance; classification/photo credit may become supervisor-only later |
| Headshot Photographer | Handle Not Here, Return to Waiting, Mark Served, understand settings | Mark Served/Not Here may be enough; photographer should not need qME if guest self-completion works |
| Scan-Code Adventure | Manage line exceptions, apply flow, view code/settings | Usually not needed for July; demo/support only |
| Resume Reviews | Likely similar to Headshots but may need provider-specific queue visibility | Mark served/complete for assigned reviewer station |
| Food & Beverage | Future; may need order/credit/fulfillment actions | Fulfill assigned items only |

## Implementation Guidance

1. Use UI visibility to reduce confusion, not as the security boundary.
2. Keep event-wide and destructive controls at Event Admin or higher.
3. Route single-assignment staff directly to their station's active work tab.
4. Give multi-assignment staff a simple workspace chooser.
5. Show read-only operational settings when they explain behavior, especially queue automation.
6. Avoid station-specific hardcoding where metadata/configuration can describe capability.
7. Preserve the current role-checked RPC/RLS boundary underneath the UI.

## July Decision

For the July SOTC pilot:

- Evan/qME superadmin can operate/support anything.
- Jalani/event admin can operate the assigned SOTC event and reset test data.
- Assigned SOTC check-in staff may grant photo credit during the July pilot. Tanya previously said this was acceptable for the SOTC operating model. Keep this as an explicit pilot policy choice, not an assumed platform default.
- Station Supervisor is the model for Headshot exceptions, even if Evan fills that role during testing.
- Photographer should not need to operate qME for the preferred Headshot flow.
- Station Staff UI should be kept focused on assigned station work before broader staff onboarding.

## Open Follow-Ups

- Revisit after SOTC whether Check-In Staff should keep photo-credit grant authority, or whether future events require Station Supervisor/Event Admin.
- Decide whether Station Staff can use Not Here and Return to Waiting, or whether those are supervisor-only.
- Role-aware admin landing/routing is implemented for the current need.
- Hide or lock tabs based on role and assignment only when a real staff model requires it.
- Add read-only explanations for controls a user can see but cannot edit when those controls are exposed to non-admin station users.
- Add stronger audit coverage for staff assignment/setup changes.

## July 17 Scope Decision

Do not spend more implementation energy on deeper Station Staff / Station Supervisor UI permissions until SOTC requests a specific staffing pattern that needs it. For the current pilot, named Event Admins are easy to create and sufficient for Jalani/Evan-style operation. Limited Staff can work assigned live operations surfaces, but event-wide setup and queue/station Settings stay behind Event Admin, Organization Admin, or qME Superadmin authority. The station-role model remains documented for Ahmed/security review and future product work, but the build should stay focused on concrete event-readiness needs.
