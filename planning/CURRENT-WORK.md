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

## Current Slice Status Update

- Pulled latest `origin/main` on 2026-08-31 and inspected the Check-In/i-Pitch story plus the existing Check-In guest/admin implementation.
- Existing Check-In Mode is configured on event `metadata.check_in` as `completion_mode` (`auto`, `staff`, or `none`) plus `require_completed_for_participation`, exposed on event setup and admin Check-In Settings.
- Imported registration lookup already exists through `search_event_imported_registrations_for_guest`, claim through `create_event_check_in_from_imported_registration_for_guest`, and recovery through `reconnect_event_check_in_from_imported_registration_for_guest`; duplicate-name selections require email confirmation, and already-linked registrations reconnect only for the same guest session or fail closed.
- Prior to this slice, imported-registration lookup was effectively SOTC-specific in the guest UI, and the "Can't find your registration?" path created a Needs Help waiting row instead of letting an unlisted guest self-register and immediately complete check-in.
- Implemented a generic Check-In configuration extension for imported-registration lookup and self-registration fallback: admins can enable imported lookup, enable unlisted self-registration, and require email for self-registration. For i-Pitch, set Check-In Mode to `auto`, enable imported lookup, enable self-registration fallback, and require email.
- The reusable guest fallback now uses first name, last name, and configured email, then creates the normal guest event check-in; in `auto` mode it immediately completes the check-in as `general`, making the unlisted guest visible in the same admin attendance/history shape as imported-registration check-ins.
- Preserved SOTC-specific behavior where its existing hard-coded lookup still works and its no-match fallback remains Needs Help unless the new generic self-registration setting is explicitly enabled.
- Added local attendance search to the admin Check-In live/history views for registration-only monitoring.
- No SQL changes were made. The existing Eventbrite import remains file-driven; final mapping/import still waits for the actual organizer export.
- Validation so far: `npx tsc -b` passed; focused `npx vitest run src\test\eventConfig.test.ts` passed; full `npx vitest run` passed; `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir` passed. A normal `npx vite build` attempt hit `EBUSY` removing the existing Dropbox-managed `app\dist\images`, so the successful Vite build used a temporary output directory to verify the production bundle without touching the locked dist folder.
- Blocking regression found after `2c29a67`: SOTC guest event home could blank with React error #310 after a fresh/unrecognized state transition because `GuestEventDetail` called the OMW freshness `useEffect` after the loading/event-not-found conditional returns. Fixed by moving that hook above all conditional returns so fresh guest entry and recovered checked-in guest Back to Event use the same hook order on every render.
- Added regression coverage for `GuestEventDetail` loading into the event home from both fresh/unrecognized guest state and existing checked-in browser storage. Validation after the fix: `npx tsc -b` passed; focused `npx vitest run src\test\guestEventDetail.test.tsx src\test\eventConfig.test.ts` passed; full `npx vitest run` passed with 115 tests; `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir` passed. New Check-In configuration behavior from `2c29a67` was preserved.

## Live Acceptance Findings — 2026-08-31

Product Owner live-tested the new generic Check-In configuration on the SOTC baseline using:
- Check-In Mode = Auto;
- imported-registration lookup enabled;
- self-registration fallback enabled;
- email required for self-registration;
- completed check-in required for participation.

### Passed

- Fresh/unrecognized guest Check-In renders correctly after the hook-order regression fix.
- Existing checked-in guest can return Back to Event without the prior blank-screen React #310 failure.
- Imported-registration path passed end-to-end: guest searched the imported list, found an attendee who had not yet checked in, selected the registration, completed self check-in, and the guest appeared as checked in in Admin Check-In History.
- No-match search correctly offers the self-registration fallback.

### Blocking defect: self-registration does not save

The first live unlisted/walk-up self-registration attempt failed after entering first name, last name, and email and pressing **Register & Check In**. Guest UI showed:

`Check-in could not be saved. Please see the mobile bar team.`

This is a blocker for i-Pitch readiness. Diagnose the exact failing operation rather than assuming the cause. Determine whether failure occurs in `create_event_check_in_for_guest`, the subsequent Auto completion (`complete_event_check_in_for_guest`), or another guest/session/config guard. Preserve the successful imported-registration path and existing SOTC recovery behavior.

Also replace the obsolete generic error wording `mobile bar team` with event-neutral copy such as `Please see the event team.`

### UX refinements discovered during acceptance

Keep these in the same bounded Check-In slice after the blocking self-registration save defect is fixed:

1. **Explain the expanded fallback.** When the guest expands **Can't find your registration?**, add a short sentence before the form, preferably:
   `Please provide your information below to register for the event and check in now.`

2. **Imported lookup must support email.** i-Pitch Eventbrite registration provides email and may not provide phone. The main registration search should accept first name, last name, or email. Use guest-facing guidance/placeholder such as:
   `First name, last name, or email`
   Do not make phone a prerequisite for imported-registration lookup.

3. **Email confirmation for walk-up self-registration.** When email is configured as required, add a Confirm email field and require the two email values to match before submission. This is justified because the email becomes registration/recovery identity and the source Eventbrite flow itself asks for email twice. Do not require confirm-email for simply searching an imported list.

4. **Phone remains optional, but clarify its purpose.** Generic Check-In may continue to allow an optional phone number for recovery. For i-Pitch it will not help find an imported registration because the source list is not expected to contain phone. Avoid positioning the phone field as a lookup criterion. Prefer clearly labeling it as optional recovery contact and keep imported-list search based on fields actually present in the import.

### Required next validation

After the fix/refinement deployment, repeat live acceptance with:
1. imported guest search by name;
2. imported guest search by email;
3. no-match search -> expanded self-registration explanation;
4. self-register with mismatched email confirmation and verify submission is blocked locally;
5. self-register with matching first name / last name / email / confirm email and verify immediate Auto completion;
6. verify the walk-up guest appears in Admin History as a normal completed check-in and is distinguishable from an imported-registration check-in where appropriate;
7. verify no new SQL/manual production action is required, or report the exact SQL if diagnosis proves otherwise.

Steve is authorized to implement, validate, update this file, commit, and push this bounded Check-In slice to `main`. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.
