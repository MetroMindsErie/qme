# Current Work

## Current Slice

Start **Sprint 4: Experience Type Review and Configuration** with **Check-In** as the first concrete experience review, using the near-term **i-Pitch September 3 production event** as a forcing function.

Read `AGENTS.md` first. Begin with inspection of the existing Check-In/event-registration implementation and the new roadmap story `story-ipitch-2026-checkin-readiness`. Keep the first slice focused on Check-In configuration and the smallest reusable gaps required for i-Pitch. Do not broaden into Headshot queues, SMS, workshops, credits, or unrelated experience redesign.

## Live Opportunity / Constraint

Kelly and Tricia expect to use qME for i-Pitch on **September 3, 2026, 5:00-8:00 PM at Missing Falls Brewery in Akron**, currently for **registration/check-in only**.

Expected operating model:
1. Organizer provides an Eventbrite attendee export.
2. qME imports those registrations.
3. Guest opens/scans the qME event entry and searches for their registration.
4. If found, guest self checks in.
5. If not found, guest can self-register with a short form and immediately complete check-in.
6. Staff can monitor/search attendance using the existing Check-In admin tools.

The supplied Eventbrite checkout screenshot shows a simple General Admission registration asking for:
- First name
- Last name
- Email address
- Confirm email

Treat that screenshot as evidence of the desired low-friction guest registration shape, **not** as the final import schema. The actual Eventbrite export, when received, is authoritative for import columns.

## Product Direction

This is both a production-readiness task and the first Sprint 4 experience-type review.

The product question is not "build a special i-Pitch registration page." It is:

> Can qME's Check-In experience be configured for a simple event where most guests arrive from an imported attendee list, but an unlisted walk-up can self-register and check in without staff intervention?

Prefer reusable Check-In configuration/behavior over i-Pitch-specific code.

For i-Pitch, keep the guest fallback form minimal. First name + last name + email is the current target unless inspection or the eventual Eventbrite file demonstrates a real need for another field. Do not collect phone, company, credits, or other data just because qME can.

## Required First Pass

### 1. Inspect existing Check-In behavior

Determine and report:
- how Check-In Mode is currently configured;
- how imported registrations are searched and claimed;
- what happens today when a guest is not found;
- whether self-registration already exists in any path and, if so, whether it can be reused/configured;
- whether self-registration creates the same authoritative `event_check_in` / guest participation shape as imported-registration check-in;
- how duplicate prevention works when a guest searches an existing registration;
- what fields are currently required/hard-coded in guest registration;
- whether any Peony/SOTC/demo-specific assumptions still leak into Check-In;
- what admin/staff view already supports attendance monitoring for a registration-only event.

### 2. Implement only the smallest generic gap needed for i-Pitch

If inspection confirms that an unlisted guest cannot currently self-register and immediately check in, implement a reusable Check-In fallback:
- clear "Can't find your registration?" / self-register path after search;
- minimal event-configurable registration fields, with first name, last name, and email sufficient for i-Pitch;
- resulting participation must be equivalent to a normal checked-in guest for attendance/admin purposes;
- do not create a duplicate if the guest instead selects an existing imported registration;
- preserve existing Reconnect to My Event behavior for already-claimed/checked-in registrations.

If the capability already exists and only configuration/copy is missing, do not rebuild it. Make the smallest configuration/UI change and document the production setup.

### 3. Keep import work file-driven

Do not invent an Eventbrite CSV schema. Inspect existing import tooling now, but wait for the actual organizer export before final field mapping/import acceptance. Prepare the mapping approach so the file can be loaded quickly when received.

### 4. Production event setup boundary

Do not hard-code i-Pitch into shared product behavior. It is acceptable to prepare event-specific configuration/data once the reusable Check-In path is understood. Final production setup must verify:
- event name/branding;
- September 3 date/time/location;
- guest-facing entry/check-in copy;
- Check-In Mode;
- imported attendee count after the real file arrives;
- self-registration fallback;
- QR/direct event link;
- mobile guest flow;
- staff/admin attendance view.

## Acceptance Target for This Slice

Before considering i-Pitch ready, we need to demonstrate with test data:
1. imported guest searches, finds self, and self checks in;
2. unlisted guest searches, does not find self, chooses self-registration, enters the minimal fields, and becomes checked in;
3. both appear correctly to staff/admin;
4. no duplicate check-in is created when an existing registration is used;
5. registration-only event works without queue/credit/experience dependencies;
6. the flow is generic Check-In behavior, not a one-off i-Pitch branch.

The actual Eventbrite import and final event smoke test will follow when Kelly/Tricia provide the attendee file.

## Sprint 4 Context

This slice begins the broader Sprint 4 review of concrete experience types. Do not attempt the whole Sprint 4 backlog at once. Use Check-In/i-Pitch to identify what belongs in reusable experience configuration, then move to the next experience type after this path is understood and production-ready.

## Handoff

Report:
- existing behavior found;
- exact gap(s) versus the i-Pitch story;
- proposed/implemented reusable Check-In changes;
- files changed;
- tests/build results;
- any SQL that would need manual production application;
- commit SHA;
- concise live acceptance steps.

Do not mark the i-Pitch story done until Product Owner live acceptance and the real Eventbrite list have been loaded/verified.
