# Current Work

## Current Slice — Surface Named Additional Attendees in History + Export

Production-day follow-up for i-Pitch, September 3, 2026.

The named additional-attendee / actual-party-size slice is implemented, deployed, SQL applied, and physically tested by the Product Owner. Multi-ticket Check-In successfully collected required First/Last names, allowed removal of non-attending guest rows, and completed with correct actual party-size behavior.

Acceptance finding:
- named additional attendees are persisted correctly in `event_check_ins.metadata.additional_attendees`;
- the primary check-in appears in Admin History as expected;
- **the named additional attendees are not currently visible in Admin History and are not included as attendee rows in Export Check-Ins.**

That makes the captured attendance data operationally incomplete. qME should expose the people it just captured without changing the core one-primary-check-in model.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep this slice bounded to History/Export visibility of already-persisted additional attendees. Do not change the check-in capture flow or Eventbrite import compatibility in this slice.

## Sequencing / Explicit Hold

There is a separate production-day Eventbrite import-format compatibility issue discovered from Tricia's newest workbook: the new untouched Eventbrite export uses a different column set (including `Ticket quantity` and `Attendee first name` / `Attendee last name` / `Attendee email`) and the current parser rejects it because it expects `Tickets` and prior aliases.

**Do not work on that import-format compatibility issue in this slice.**

Sequence is intentional:
1. finish and accept History + Export visibility for named additional attendees;
2. then update the FILE for the new Eventbrite column-alias/import compatibility work using the actual uploaded workbooks as acceptance fixtures.

This avoids mixing a reporting change with an import parser change on event day.

## Preserve the Core Model

Do not create additional primary check-ins for child attendees.

The accepted model remains:
- one primary `event_check_ins` row per Eventbrite registration/check-in;
- original Eventbrite Order ID on the primary;
- `registered_party_size` preserves Eventbrite Tickets;
- `actual_party_size` represents actual attendance;
- `metadata.additional_attendees` contains named additional attendees;
- deterministic child identity `<originalOrderId>-<position>`;
- removed/non-attending positions are absent;
- `Checked In` counts primary completed check-ins;
- `Guests Represented` counts actual attendees and must not be double-counted.

History and Export should **project** this data for users; they should not remodel it into extra check-in rows in the database.

## Part A — Admin History

Keep History primarily organized around the primary check-in, because that reflects the actual registration/check-in transaction.

For a completed primary check-in with named additional attendees, surface the party details under or within the primary History entry.

Desired compact behavior, for example:

`Mourad Krifa`  `CHECKED IN`

`Party: 3`

`Guests: Jane Doe; John Smith`

A compact expandable treatment is also acceptable if it is more consistent with the current mobile/admin UI, for example:
- primary name/status always visible;
- `Party: 3` visible;
- `2 additional guests` expandable to show names and child IDs if useful.

Requirements:
- do not create visually separate primary History check-ins for each additional attendee;
- make actual party size visible when >1;
- show each persisted additional attendee's First Name + Last Name;
- optionally show child identity where useful for support/debugging, but names are the important operator-facing information;
- party size 1 History remains compact/current behavior;
- search History should continue to work for primary guest names/status;
- if straightforward, History search should also match named additional attendees, but do not broaden this into a major search rewrite if risky today.

## Part B — Export Check-Ins

The attendance export must include **one row per actual attendee**, because the purpose of capturing additional guest names is to provide an actual attendee list downstream.

For a party with one primary + two named guests, Export Check-Ins should produce three attendee rows.

Recommended columns/semantics:
- `first_name`
- `last_name`
- `attendee_type` (`primary` or `additional`)
- `external_order_id` / attendee identity
- `primary_order_id`
- `registered_party_size`
- `actual_party_size`
- primary check-in status
- primary check-in timestamp
- primary registration/import source where currently available

Identity behavior:
- primary row uses original Eventbrite Order ID, e.g. `123456789`;
- additional row uses deterministic child identity, e.g. `123456789-1`;
- `primary_order_id` remains `123456789` on all rows in the party.

For self-registered/non-imported check-ins without child attendees, preserve sensible existing export behavior. Do not fabricate Eventbrite-style IDs where none exist.

If preserving backward-compatible existing columns is important, keep them and add the new attendee-oriented columns rather than silently removing/redefining existing fields.

## Export Counting Semantics

Do not confuse row count with primary check-in count.

Example:
- 1 primary check-in;
- actual party size 3;
- Export contains 3 attendee rows;
- Admin `Checked In` remains +1;
- Admin `Guests Represented` remains +3.

The export is an attendee-level representation; the database/check-in metric remains registration/check-in-level.

## Recovery / Existing Data

This is a read/projection enhancement over data already persisted.

Requirements:
- existing completed check-ins with `metadata.additional_attendees` must appear correctly without re-checking anyone in;
- no migration should be needed solely to expose existing JSON metadata;
- completed-session recovery behavior remains unchanged;
- no child attendee duplication or mutation;
- no production reset.

## Validation

At minimum test:
- History party size 1 remains current/compact;
- History for party size >1 shows actual party size and all named additional attendees;
- removed guest positions do not appear;
- History does not create extra completed-primary entries/counts;
- export party size 1 produces one primary attendee row;
- export primary + 2 additional attendees produces exactly 3 attendee rows;
- primary attendee export uses original Order ID;
- additional attendee export uses `<originalOrderId>-<position>`;
- all party rows expose `primary_order_id` or equivalent linkage;
- registered vs actual party size remain distinct;
- existing `Checked In` / `Guests Represented` calculations are unchanged;
- self-registered/non-imported export remains valid;
- TypeScript;
- focused History/export tests;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Use the multi-ticket check-in just completed during acceptance testing.

1. Open Admin Check-In -> History.
2. Locate the primary person.
3. Confirm actual party size is visible.
4. Confirm all named additional attendees are visible under/within that primary History entry.
5. Confirm History still represents one primary check-in, not one check-in per party member.
6. Export Check-Ins.
7. Open the export and confirm it contains one row for the primary plus one row for each actual named additional attendee.
8. Confirm primary Order ID and child `-1`, `-2`, etc. identities are correct.
9. Confirm registered party size and actual party size are both available/understandable in the export.
10. Confirm Admin top counts remain unchanged/correct.

After this slice is accepted, stop and return to Product Owner before starting the held Eventbrite new-column compatibility work.

## Production Context to Preserve

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET

Preserve:
- named additional-attendee capture;
- Remove guest / actual party size;
- original Eventbrite Tickets as registered party size;
- actual `Total guests` / `Guests Represented`;
- original Eventbrite Order ID and deterministic child identities;
- completed-session recovery;
- shared iPad kiosk loop;
- Auto Check-In;
- current CSV/XLS/XLSX importer as-is for this slice;
- Order ID repeat-import safety;
- availability/manual/scheduled/adminTest behavior;
- event companion content/theme;
- existing production data.

## Handoff

Update this FILE with:
- exact History presentation for parties/additional attendees;
- exact export row/column behavior;
- confirmation existing persisted additional attendees are projected without migration/re-check-in;
- confirmation Checked In/Guests Represented semantics are unchanged;
- files changed;
- focused/full tests and build results;
- implementation commit SHA and push status;
- concise Product Owner acceptance steps;
- explicit note that Eventbrite new-column compatibility remains held for the next slice.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
