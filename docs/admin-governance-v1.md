# qME Admin Governance Principles v1

Date: 2026-06-15

## Purpose

This document defines the minimum governance rules needed before building the multi-organization admin foundation. It is intentionally not a full permissions engine. The goal is to define roles, ownership boundaries, sensitive actions, audit candidates, and initial schema implications.

## Core Rule

Permissions are granted to authenticated principals and scoped by organization first, then event, then function.

A principal may represent a person, role, station/device, or service provider, but admin-side actions should always be performed by an authenticated principal with explicit permissions.

## Role Hierarchy

### Super Admin

- qME-level role.
- Can access all organizations.
- Must explicitly select/switch into an organization context before managing organization data.
- When an organization is selected, super admin "slips in" as an org admin for that organization.
- Can create organizations, assign org admins, troubleshoot, migrate demo data, and repair data when needed.
- Super admin organization context changes should be audit candidates.

### Org Admin

- Organization-level role.
- Can see all events in the organization by default.
- Can create, edit, suspend, and manage events within the organization.
- Can manage organization staff/accounts and org-level settings.
- Can configure event rules, queues, experiences, branding, reports, and organization defaults.
- Restricted org admin variants are deferred until there is a proven need.

### Event Admin

- Event-scoped role.
- Can access only assigned events.
- Cannot create new events.
- Can manage operational objects inside assigned events: guests, check-ins, queues, experiences, staff stations, day-of overrides, and event-specific settings.
- Can add/invite staff, station accounts, and service-provider accounts for assigned events.
- Access granted by an event admin is event-scoped by default.
- Cannot grant org admin rights or access to unrelated events unless they also administer those events.

### Universal Staff

- Organization-scoped staff with access across all events in an organization.
- Granted by org admin, not by event admin.
- Useful for trusted recurring staff or internal operators.

### Staff / Volunteer

- Event/function-scoped role.
- Can perform assigned operational tasks only.
- Examples: registration check-in, guest lookup, eligibility assignment, line support.
- Cannot configure event structure unless explicitly granted.

### Station Account

- Authenticated admin-side identity representing a shared device or role, not necessarily a person.
- Examples: `registration_station_1`, `photo_booth_console`.
- Permissions are narrow and tied to assigned event/function.
- Useful for day-of operations where multiple volunteers use the same device.

### Service Provider

- Event/function-scoped operator.
- Examples: photographer, resume reviewer, workshop host.
- Can manage assigned queue/service only.
- Can mark guests arrived, served, or completed where permitted.
- Cannot change guest eligibility unless explicitly allowed.

### Guest

- Public attendee identity.
- Can check in, view event, join eligible queues, and see own ticket/status.
- Cannot access admin/staff functions.

## Object Ownership

- Organizations own events.
- Events own operational event state: event guests, check-ins, queues, queue entries/tickets, event-specific eligibility/status, staff assignments, and event-specific experiences.
- Organizations own org-level admins, organization settings, branding defaults, reusable assets, and event templates/defaults.
- Experiences and queues belong to an event for MVP, but should not be designed in a way that blocks future participant/provider ownership.

## Active Organization Context

- Super admin has global access, but must choose an organization from a dropdown before managing organization data.
- The active organization should be clearly visible in the admin UI.
- Multi-organization users should have a visible active organization context.
- Event-scoped users may land directly in their assigned event/org context.

## Participant / Provider Organizations

This is a future-compatible principle, not an MVP feature.

- Events are owned by one host organization.
- Outside providers can be represented in MVP as event-scoped staff/service providers inside the host event.
- Longer term, a participant/provider may have its own organization profile and reusable content.
- Examples include food trucks, photographers, resume reviewers, sponsors, and workshop hosts.
- We are not building provider self-publishing or participant organization workflows for MVP.
- We should avoid schema choices that would block a future model where participant organizations attach approved experiences, menus, queues, or service cards into a host event.

## Guest Identity

- Long term, qME should support reusable guest identities so a guest can register once and participate across many organizations/events.
- Reusable identity may later support saved contact info, interests, dietary needs, accessibility needs, preferences, and pre-event configuration.
- MVP user-management focus is admin-side identity and permissions.
- MVP guest records should be event operational records: check-in, eligibility, queue entries, service used/completed, and event-specific status.
- Schema should leave a path to link event guest records to a future global `person_id` or `guest_identity_id`.

## Guest Eligibility Assignment

- Assigning guest eligibility/status is normal staff work, not an exception, when there is no payment integration.
- Examples: assigning professional headshot access, student headshot access, or bouquet access.
- Eligibility assignment should be restricted to authorized roles/stations.
- Eligibility assignment should be audit logged.
- PIN/code is not required for normal eligibility assignment in MVP.
- Future versions may add receipt/reference codes, payment verification, personal staff PINs, or exception approval if needed.

## Audit Candidates

Create a simple audit log as part of the org/admin foundation. A polished audit UI can come later.

Initial audit fields:

- `id`
- `organization_id`
- `event_id`
- `actor_principal_id`
- `action`
- `target_type`
- `target_id`
- `metadata`
- `created_at`

Audit candidate actions:

- Super admin selecting/switching into an organization context.
- Create/update/delete organization.
- Add/remove org admin.
- Add/remove event admin/staff/station/service-provider access.
- Change guest eligibility/status.
- Mark limited service used/completed.
- Reset queue.
- Delete event, queue, guest, ticket, or queue entry.
- Bulk import/delete guests.
- Publish/unpublish event.

## Sensitive Action Confirmation / PIN

- PIN/code is not required for normal eligibility assignment in MVP.
- Eligibility assignment is role-restricted and audit logged.
- PIN/code is reserved for destructive or high-impact admin actions.
- PIN/code may be set by org admin and/or event admin for sensitive event operations.
- Future versions may support different PINs/codes by action type or personal staff identity.

Initial PIN/confirmation candidates:

- Reset queue.
- Delete queue.
- Delete event.
- Remove admin/staff access.
- Bulk import/delete guests.
- Publish/unpublish event.

## Custom Permissions Deferred

- Full custom permission builder is explicitly deferred.
- MVP uses fixed roles and scopes.
- Roles: super admin, org admin, event admin, staff/volunteer, station account, service provider.
- Scopes: organization, event, function/queue/experience.
- No per-field permissions, custom policy UI, or complex permission matrix yet.
- Add custom permissions later only if real event operations prove fixed roles are not enough.

## Initial Schema Implications

Likely foundation tables/fields:

- `organizations`
- `profiles` or `admin_principals`
- `organization_memberships`
- `events.organization_id`
- `event_staff_assignments`
- `audit_logs`
- Role fields/enums or constrained text for super admin, org admin, event admin, staff, station, and service provider.
- Principal/account type to distinguish person, station, role, and service provider identities.
- Event-level sensitive action code/PIN support, stored hashed if implemented.
- Event guest records should be linkable later to a reusable global guest identity.

## Deferred

- Full custom permissions engine.
- Participant/provider organization self-publishing.
- Guest account/profile system.
- Payment integration.
- Receipt-code validation.
- Polished audit UI.
- Per-field authorization rules.
