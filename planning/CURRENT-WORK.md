# Current Work

## Current Slice — Named Additional Guests for Multi-Ticket Check-In

Production-day check-in enhancement for i-Pitch, September 3, 2026.

The Eventbrite import model already preserves `Tickets` / party size for each primary registration. Until now, qME only used that quantity to show confirmation copy such as `You and your 2 guests are checked in` and `Total guests: 3`.

Tricia clarified the operational requirement: when one Eventbrite registration represents more than one attendee, qME should collect the first and last name of each additional guest before completing check-in so the final attendance record includes the actual people represented by that registration.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep this bounded to multi-ticket attendee naming and preserve all accepted Eventbrite/check-in behavior.

## Product Behavior

For an imported Eventbrite registration:

- `Tickets = 1`: current flow remains unchanged. After the primary guest selects `This is me`, they can complete check-in normally.
- `Tickets > 1`: after the primary guest selects `This is me`, qME must collect one additional attendee name for each ticket beyond the primary person's ticket before allowing final check-in.

Example for `Tickets = 3`:

Primary registration:
- Mourad Krifa

Required additional attendee inputs before check-in:
- Guest 1 — First Name + Last Name
- Guest 2 — First Name + Last Name

Both First Name and Last Name are required for every additional guest. Do not require email or phone for these additional attendees in this slice.

The primary person's Eventbrite name remains the primary attendee; do not ask them to re-enter their own name.

## Check-In Flow

Personal phone and shared iPad should follow the same data requirement.

Expected imported-registration flow:

1. Search imported registration.
2. Select `This is me`.
3. If party size is 1, continue with existing completion behavior.
4. If party size is greater than 1, show an additional-guests step/form before final completion.
5. Render exactly `party_size - 1` guest-name rows.
6. Require First Name and Last Name for every row.
7. Only after all required guest names are present may the registration be checked in.
8. Complete the primary registration/check-in using the existing Auto Check-In behavior.
9. Confirmation copy remains party-size aware, e.g. `Thanks, Mourad! You and your 2 guests are checked in.` and `Total guests: 3`.

For shared-device mode, retain the existing closed kiosk loop and kiosk-specific completion copy. Do not add Back to Event or recovery phone.

## Data Model / Child Attendee Records

Create a persistent record for each additional attendee represented by the primary Eventbrite registration/check-in.

Do **not** create independent Eventbrite registrations with unrelated/fabricated order identities.

Each additional attendee should remain clearly linked to:
- the original imported registration;
- the primary event check-in / guest party;
- the original Eventbrite Order ID;
- its position within that order/party.

### Derived Order ID / External Identity

For each additional guest, derive a stable child external/order identity from the original Eventbrite Order ID by appending a hyphen and 1-based guest position:

- original Order ID `123456789`
- first additional guest -> `123456789-1`
- second additional guest -> `123456789-2`
- third additional guest -> `123456789-3`

This derived identifier is for the additional attendee record and must not replace or mutate the primary imported registration's original Order ID.

Requirements:
- preserve the original Order ID exactly as text;
- derive child IDs deterministically as `<originalOrderId>-<n>`;
- numbering starts at `1` for the first additional guest;
- child IDs must be unique within the event;
- reloading/retrying the same check-in must not duplicate already-saved child attendees;
- if the check-in has not yet completed, edits to the additional guest names should update the intended child attendee positions rather than create extra records.

If there is already a suitable child/party-member table or model in the codebase, use it. If a schema change is needed, keep it narrowly scoped and document it clearly in the handoff. Do not overload the primary `event_imported_registrations` row in a way that breaks Eventbrite repeat-import semantics.

## Attendance / Reporting Semantics

The primary Eventbrite registration remains one imported registration with its original `party_size`.

The named child attendees are attendance members of that party, not additional Eventbrite orders.

A future/reporting-friendly representation should be possible such as:

- Mourad Krifa — primary — Order `123456789`
- Guest Name 1 — additional attendee — Order/child identity `123456789-1`
- Guest Name 2 — additional attendee — Order/child identity `123456789-2`

Current aggregate metrics must remain correct:
- one completed primary registration/check-in;
- `Guests Represented` equals the full party size;
- do not double-count the additional attendee rows on top of `party_size` in existing counters.

Do not change the accepted `Checked In` vs `Guests Represented` semantics.

## Recovery / Repeat Safety

Preserve the recently accepted guest-session recovery behavior.

If the browser token changes or a returning primary guest recovers an already-completed imported registration:
- existing named additional attendees must remain linked and must not be duplicated;
- qME should recover the completed party normally;
- do not reopen the additional-name step for an already-completed check-in unless there is an explicit future edit flow.

If a user leaves during the additional-name step before final completion, handle partial state safely. Prefer a server-authoritative/upsert approach rather than relying only on localStorage for child attendee names.

## Eventbrite Import Interaction

Preserve all accepted import semantics:
- original Eventbrite Order ID remains the dedupe key for primary imported registrations;
- repeat Eventbrite imports skip existing primary Order IDs;
- derived `-1`, `-2`, etc. attendee identities must not confuse the primary Eventbrite import dedupe path;
- later Eventbrite imports must not delete or overwrite named additional attendees captured during check-in;
- no fuzzy person merge.

The current CSV/XLS/XLSX import support is complete and should not be broadened in this slice.

## Validation

At minimum test:
- party size 1 shows no additional guest-name step and preserves current flow;
- party size 2 requires exactly one First Name + Last Name pair;
- party size 3 requires exactly two guest-name pairs;
- missing first or last name blocks completion;
- derived child identities are exactly `<originalOrderId>-1`, `<originalOrderId>-2`, etc.;
- retry/re-render does not duplicate child attendee records;
- primary imported registration keeps its original Order ID unchanged;
- primary completion still produces correct party-size confirmation and `Total guests`;
- `Guests Represented` is not double-counted;
- personal-phone flow works;
- shared-device flow works and preserves kiosk copy/reset behavior;
- completed-session recovery does not duplicate or reopen child attendee capture;
- repeat Eventbrite import semantics remain unchanged;
- TypeScript;
- focused tests;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Use an imported i-Pitch registration with party size greater than 1.

1. Search for the primary registration.
2. Select `This is me`.
3. Confirm qME shows exactly one required First/Last pair for each additional guest.
4. Confirm blank/incomplete guest rows cannot complete check-in.
5. Enter the additional guest names and complete check-in.
6. Confirm personalized party-size confirmation and `Total guests` remain correct.
7. Confirm Admin counts still distinguish one primary check-in from the full number of guests represented.
8. Confirm the additional attendee names are persisted and tied to the original registration/order.
9. Confirm child identities use original Order ID plus `-1`, `-2`, etc.
10. Repeat on shared iPad mode and confirm the kiosk resets normally after completion.
11. Refresh/recover the completed guest session and confirm no duplicate child attendees are created.

## Production Context to Preserve

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET

Preserve:
- Auto Check-In;
- untouched Eventbrite CSV/XLS/XLSX import;
- Order ID repeat-import safety;
- party-size / `Total guests`;
- separate `Checked In` and `Guests Represented` counts;
- shared iPad kiosk loop;
- personal-device completed-session recovery;
- Check-In availability/manual/scheduled/adminTest behavior;
- event companion content/theme;
- personal-phone and shared-device copy/navigation;
- existing production check-ins and imported registrations.

No production data reset is part of this slice.

## Handoff

Update this FILE with:
- schema/model used for additional attendees;
- exact linkage to primary imported registration/check-in;
- exact derived child ID behavior;
- how incomplete/retry cases avoid duplicates;
- personal/shared UI behavior;
- files changed;
- migration if any;
- focused/full test and build results;
- implementation commit SHA and push status;
- concise Product Owner acceptance steps.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
