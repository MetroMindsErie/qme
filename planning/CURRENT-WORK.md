# Current Work

## Current Slice — Named Additional Guests + Actual Party Size for Multi-Ticket Check-In

Production-day check-in enhancement for i-Pitch, September 3, 2026.

The Eventbrite import model preserves `Tickets` / registered party size for each primary registration. Tricia clarified that when one Eventbrite registration represents multiple attendees, qME should collect the first and last name of each additional person who actually attends before completing check-in.

Important refinement from Product Owner acceptance discussion: the Eventbrite ticket quantity is the **maximum/expected registered party size**, not necessarily the number who actually arrives. If a person registered for themselves + 3 guests but arrives with only 2 guests, qME must allow one guest row to be removed and record an actual attending party size of 3 rather than forcing 4 attendees.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep this bounded to multi-ticket attendee naming/actual party size and preserve all accepted Eventbrite/check-in behavior.

## Product Behavior

For an imported Eventbrite registration:

- `Tickets = 1`: current flow remains unchanged. After the primary guest selects `This is me`, they can complete check-in normally.
- `Tickets > 1`: after the primary guest selects `This is me`, qME shows one additional-attendee row for each registered ticket beyond the primary person's ticket.
- Each visible additional-attendee row requires both First Name and Last Name.
- Each additional-attendee row has a clear `Remove guest` action.
- Removing a guest row means that registered guest is not attending and reduces the actual checked-in party size by one.
- The primary attendee cannot be removed through this guest-row control.
- At least the primary attendee remains, so actual party size has a minimum of 1.

Example: Eventbrite `Tickets = 4` initially renders:
- Guest 1 — First Name + Last Name — Remove guest
- Guest 2 — First Name + Last Name — Remove guest
- Guest 3 — First Name + Last Name — Remove guest

If only two additional guests arrived, the primary attendee removes one guest row. The final check-in represents 3 actual attendees, not 4 registered attendees.

Do not require email or phone for additional attendees in this slice.

The primary person's Eventbrite name remains the primary attendee; do not ask them to re-enter their own name.

## Validation Rules

For every additional guest row that remains at completion:
- First Name is mandatory;
- Last Name is mandatory;
- whitespace-only values do not satisfy the requirement.

There must not be an ambiguous empty visible row. A row must either:
1. contain both required names and represent an attending guest; or
2. be removed before completion.

If any remaining row is missing either required field, final Check In is blocked with a clear validation message.

## Check-In Flow

Personal phone and shared iPad follow the same attendance-data requirement.

Expected imported-registration flow:

1. Search imported registration.
2. Select `This is me`.
3. If registered party size is 1, continue with existing completion behavior.
4. If registered party size is greater than 1, show the additional-guests step/form before final completion.
5. Initially render `registered_party_size - 1` guest-name rows.
6. Allow the primary guest to remove rows for registered guests who did not attend.
7. Require First Name + Last Name for every row that remains.
8. Calculate `actual_party_size = 1 + number of remaining named additional guests`.
9. Only after every remaining guest row is complete may the registration be checked in.
10. Complete the primary registration/check-in using the existing Auto Check-In behavior.
11. Confirmation copy and `Total guests` use **actual party size**, not the original registered party size.

Example: registered party size 4, one guest removed, two named guests remain:

`Thanks, Primary! You and your 2 guests are checked in.`

`Total guests: 3`

For shared-device mode, retain the existing closed kiosk loop and kiosk-specific completion copy. Do not add Back to Event or Recovery phone.

## Registered Party Size vs Actual Party Size

Preserve both concepts rather than destructively replacing Eventbrite source data.

- **Registered party size**: original Eventbrite `Tickets` value. This remains part of the imported registration/source metadata and should not be rewritten merely because fewer people attended.
- **Actual party size**: primary attendee + named additional attendees who remain at completion. This drives attendance/check-in confirmation and `Guests Represented` after check-in.

The system should therefore be able to answer both:
- how many people were registered under the order; and
- how many people actually attended under the order.

Do not mutate the original Eventbrite `Tickets` / imported party-size value to represent attendance. Persist actual attendance separately in the appropriate check-in/party model.

## Data Model / Child Attendee Records

Create/persist a record for each additional attendee who actually remains in the party at completion.

Do **not** create independent Eventbrite registrations with unrelated/fabricated order identities.

Each additional attendee remains clearly linked to:
- the original imported registration;
- the primary event check-in / guest party;
- the original Eventbrite Order ID;
- its deterministic guest position/child identity.

### Derived Order ID / External Identity

For each additional guest, derive a stable child external/order identity from the original Eventbrite Order ID by appending a hyphen and 1-based guest position:

- original Order ID `123456789`
- first additional guest -> `123456789-1`
- second additional guest -> `123456789-2`
- third additional guest -> `123456789-3`

This derived identifier is for the additional attendee record and must not replace or mutate the primary imported registration's original Order ID.

### Removal / Position Semantics

Use deterministic child identities and avoid renumbering surprises.

Recommended behavior:
- initial rows correspond to registered guest positions `-1`, `-2`, `-3`, etc.;
- removing a row means that child position is not attending;
- do not needlessly renumber other positions merely to close a numeric gap;
- only attending child records should remain/persist as final attendance members;
- retries/re-renders must upsert by deterministic child identity rather than create duplicates.

Example: registered order `123456789`, guest positions `-1`, `-2`, `-3`. If the `-2` row is removed and `-1` and `-3` attend, it is acceptable and preferable for the final attending child identities to remain `123456789-1` and `123456789-3`. The suffix is a stable position within the registered party, not a count that must be contiguous after removals.

If the cleanest UI removes only the last row rather than arbitrary rows, that is acceptable for this production slice **only if** it is clear to the guest and child identities remain deterministic. Prefer per-row Remove guest if straightforward.

Requirements:
- preserve the original Order ID exactly as text;
- derive child IDs deterministically as `<originalOrderId>-<n>`;
- numbering starts at `1` for the first additional registered guest position;
- child IDs must be unique within the event;
- reloading/retrying the same check-in must not duplicate already-saved child attendees;
- if the check-in has not yet completed, edits to additional guest names update the intended child attendee positions rather than create extra records;
- removed/non-attending guest positions must not contribute to actual attendance counts.

If there is already a suitable child/party-member table or model in the codebase, use it. If a schema change is needed, keep it narrowly scoped and document it clearly in the handoff. Do not overload the primary `event_imported_registrations` row in a way that breaks Eventbrite repeat-import semantics.

## Attendance / Reporting Semantics

The primary Eventbrite registration remains one imported registration with its original registered party size.

The named child attendees are attendance members of that party, not additional Eventbrite orders.

A reporting-friendly representation should be possible such as:

- Mourad Krifa — primary — Order `123456789`
- Guest Name 1 — additional attendee — child identity `123456789-1`
- Guest Name 2 — additional attendee — child identity `123456789-3`
- Registered party size: 4
- Actual attending party size: 3

Current aggregate metrics must reflect actual attendance after completion:
- one completed primary registration/check-in;
- `Checked In` continues to represent the primary completed check-in count under the accepted semantics;
- `Guests Represented` equals **actual attending party size** for completed multi-ticket check-ins;
- do not double-count named child attendee rows on top of actual party size.

Before completion, do not let partial child-entry state falsely inflate completed attendance metrics.

## Recovery / Repeat Safety

Preserve the recently accepted guest-session recovery behavior.

If the browser token changes or a returning primary guest recovers an already-completed imported registration:
- existing named additional attendees remain linked and are not duplicated;
- actual party size remains the completed value;
- qME recovers the completed party normally;
- do not reopen the additional-name/removal step for an already-completed check-in unless there is an explicit future edit flow.

If a user leaves during the additional-name step before final completion, handle partial state safely. Prefer a server-authoritative/upsert approach rather than relying only on localStorage for child attendee names/removals.

## Eventbrite Import Interaction

Preserve all accepted import semantics:
- original Eventbrite Order ID remains the dedupe key for primary imported registrations;
- original Eventbrite `Tickets` remains the registered party size/source value;
- repeat Eventbrite imports skip existing primary Order IDs;
- derived `-1`, `-2`, etc. attendee identities must not confuse the primary Eventbrite import dedupe path;
- later Eventbrite imports must not delete or overwrite named additional attendees or completed actual-party-size attendance captured during check-in;
- no fuzzy person merge.

The current CSV/XLS/XLSX import support is complete and should not be broadened in this slice.

## Validation

At minimum test:
- registered party size 1 shows no additional guest-name step and preserves current flow;
- registered party size 2 initially shows exactly one guest row;
- registered party size 3 initially shows exactly two guest rows;
- registered party size 4 initially shows exactly three guest rows;
- missing first or last name on any remaining row blocks completion;
- whitespace-only first/last name blocks completion;
- removing a guest row allows completion without that guest's name;
- removing one row reduces actual party size by one;
- confirmation wording and `Total guests` use actual party size;
- original Eventbrite registered party size/Tickets remains unchanged;
- derived child identities are exactly `<originalOrderId>-1`, `<originalOrderId>-2`, etc. for attending positions;
- removed positions do not create/count final attending child records;
- retry/re-render does not duplicate child attendee records;
- primary imported registration keeps its original Order ID unchanged;
- `Guests Represented` uses actual attendance and is not double-counted;
- personal-phone flow works;
- shared-device flow works and preserves kiosk copy/reset behavior;
- completed-session recovery does not duplicate/reopen child attendee capture and preserves actual party size;
- repeat Eventbrite import semantics remain unchanged;
- TypeScript;
- focused tests;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Use an imported i-Pitch registration with registered party size greater than 1.

1. Search for the primary registration.
2. Select `This is me`.
3. Confirm qME initially shows one First/Last row for each additional registered guest.
4. Confirm both First Name and Last Name are mandatory on every row that remains.
5. Remove one guest row and confirm qME no longer requires that person's name.
6. Enter names for the remaining additional guests and complete check-in.
7. Confirm confirmation wording and `Total guests` reflect the **actual** party, not original Eventbrite quantity.
8. Confirm Admin `Guests Represented` reflects actual party size while the original imported registration still retains its registered Tickets/party size.
9. Confirm additional attendee names are persisted and tied to the original registration/order.
10. Confirm child identities use original Order ID plus stable `-1`, `-2`, etc. positions and removed positions do not create attendance records.
11. Repeat on shared iPad mode and confirm the kiosk resets normally after completion.
12. Refresh/recover the completed guest session and confirm no duplicate child attendees are created and actual party size is preserved.

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
- original registered Tickets/party size;
- actual `Total guests` / `Guests Represented` after check-in;
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
- schema/model used for additional attendees and actual party size;
- exact linkage to primary imported registration/check-in;
- exact derived child ID and removal behavior;
- confirmation original registered party size is preserved separately from actual attendance;
- how incomplete/retry cases avoid duplicates;
- personal/shared UI behavior;
- files changed;
- migration if any;
- focused/full test and build results;
- implementation commit SHA and push status;
- concise Product Owner acceptance steps.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
