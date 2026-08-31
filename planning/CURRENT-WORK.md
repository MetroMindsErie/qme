# Current Work

## Current Slice

Finish the **Sprint 4 Check-In / i-Pitch generic-flow acceptance cleanup**. Core generic Check-In behavior has now passed live Product Owner testing. Keep this slice very small: improve field-validation placement and verify/preserve registration-source provenance for post-event reporting.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

Do not broaden into i-Pitch event creation, Eventbrite import mapping, queues, Headshots, SMS, workshops, credits, or unrelated Sprint 4 work. The real i-Pitch attendee export has not arrived yet.

## Live Context

The generic Check-In experience is being accepted on the SOTC baseline as an i-Pitch-style registration-only configuration:
- Check-In Mode = Auto;
- imported-registration lookup enabled;
- unlisted self-registration fallback enabled;
- email required for self-registration;
- completed check-in required for participation.

The required production SQL for imported-registration email search (`supabase-checkin-imported-registration-email-search.sql`) has now been manually applied by the Product Owner.

## Live Acceptance — Passed

The following have passed live Product Owner testing:

1. Fresh/unrecognized guest Check-In renders correctly after the React #310 hook-order fix.
2. Existing checked-in guest can return Back to Event without blanking.
3. Imported registration can be found by name and self checked in; the resulting guest appears completed in Admin Check-In History.
4. No-match search offers the generic self-registration fallback.
5. Expanded fallback explains: `Please provide your information below to register for the event and check in now.`
6. Walk-up form presents First name, Last name, Email, Confirm email when email is required.
7. Intentionally mismatched Email / Confirm email is blocked locally with `Email and confirm email must match.`
8. After correcting the email confirmation, walk-up self-registration succeeds and Auto check-in completes successfully.
9. The resulting walk-up test guest (Tiny Archibald) appears as `CHECKED IN` in Admin Check-In History.
10. The prior self-registration save blocker was fixed by explicitly selecting the current `create_event_check_in_for_guest` RPC overload; the failure occurred on initial create, not Auto completion.

The core generic Check-In acceptance target is therefore functionally met. Do not reopen or redesign the successful flows in this cleanup.

## Remaining Cleanup 1 — Inline Confirm Email Validation

Live testing found a UX problem with the otherwise-correct mismatch validation.

On mobile, the guest is working near the bottom of the expanded self-registration form. After pressing **Register & Check In** with mismatched email values, the validation message is rendered in the global error area near the top of the Check-In page. The guest remains scrolled near the form, so the message can be completely off-screen and the action can appear to have done nothing.

### Required behavior

For Email / Confirm email mismatch:
- show the validation message **inline with the self-registration form**, preferably directly beneath Confirm email or immediately above `Register & Check In`;
- keep the guest at the form; do **not** solve this by scrolling/jumping them to the top;
- an error border/state on Confirm email is appropriate if consistent with existing styling, but keep the implementation small;
- retain the global error area for server/general failures that are not tied to one field;
- preserve the existing text `Email and confirm email must match.` unless there is a compelling implementation reason to change it.

Add/update focused regression coverage so a mismatch is blocked and the validation is rendered in/adjacent to the self-registration form rather than only in the page-level error area.

## Remaining Cleanup 2 — Registration Source / Provenance

The live Admin Check-In list correctly shows the walk-up guest simply as `CHECKED IN`. Product decision: **do not add SELF-REGISTERED badges/noise to every live/history row.** Operators primarily need to know that the person is checked in.

However, post-event reporting should be able to distinguish:
- guest claimed/checked in from an imported registration (for i-Pitch, Eventbrite attendee);
- guest self-registered directly in qME as an unlisted/walk-up attendee.

### Required inspection

Determine whether this distinction is already durably available from the current check-in data/metadata and existing Check-In CSV export.

- Imported-registration check-ins already carry imported-registration linkage/metadata; verify exactly what is persisted/exported.
- Inspect a generic self-registration check-in and determine whether absence of imported linkage is sufficient and unambiguous, or whether a small explicit source marker is warranted.
- Inspect the existing Check-In CSV shape and report whether an organizer can already distinguish imported vs qME self-registered attendees after the event.

### Product decision

- If provenance is already unambiguous and exported in a useful way, **do not add new data fields or UI**. Document the existing behavior.
- If provenance is persisted but the CSV does not expose it clearly, add the smallest useful CSV column, e.g. `registration_source`, with stable human-readable values such as `imported` / `self_registered` (use names consistent with existing metadata if they already exist).
- If self-registration provenance is not durably distinguishable at all, add the smallest durable marker at creation time and expose it in the admin export. Avoid a schema/table migration if metadata is already the established extensibility mechanism.
- Do not add source badges to the normal Live/History guest rows in this slice.

If any SQL would be required, stop and report the exact reason/file rather than assuming Product Owner authorization to apply it. Prefer no SQL if the existing authoritative data can support the reporting distinction cleanly.

## Preserve Existing Accepted UX

Do not regress:
- imported search by first name, last name, or email;
- `Recovery phone (optional)` and its explanation that it is not used to search the imported list;
- self-registration explanatory copy;
- required Confirm email;
- successful imported-registration claim/reconnect behavior;
- successful walk-up self-registration + Auto completion;
- event-neutral server failure copy (`Please see the event team.`);
- SOTC hook-order regression fix.

## Validation

At minimum:
- focused Check-In guest tests for inline mismatch validation;
- relevant Check-In service/export tests if provenance/export changes;
- TypeScript;
- full test suite where practical;
- production Vite build using the established temporary output directory if Dropbox still locks `app/dist`.

## Handoff

Update this file with:
- exact validation-placement change;
- what registration provenance already existed;
- whether CSV was changed and its final source semantics;
- files changed;
- tests/build results;
- whether any SQL/manual production action remains;
- commit SHA;
- concise Product Owner live acceptance step if another UI check is needed.

Do not mark the i-Pitch readiness story done. Generic Check-In can be considered accepted after this cleanup, but final i-Pitch readiness still requires the real Eventbrite export, event-specific setup/import, and production smoke test.
