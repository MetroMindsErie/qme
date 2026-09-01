# Current Work

## Current Slice

Implement the **production i-Pitch Eventbrite registration import + party-size Check-In behavior** using the actual Eventbrite export supplied by the Product Owner.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

## Production Event

- organization: **University of Akron Research Foundation**
- event: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET
- Missing Falls Brewery, 540 S Main St., Akron, OH 44311

Accepted event-day Check-In model:
- guests primarily check in on their own phones via event QR;
- imported guests search for their Eventbrite registration;
- guests not found may self-register with name + email and check in;
- shared iPad at front desk is backup;
- after Check-In, guest shows the checked-in phone state at the front-entrance check-in desk and receives the evening's event package;
- Tricia will not rely on an admin console during guest fulfillment; the **guest phone confirmation itself must clearly communicate the number of people represented by that check-in**.

Approved event Post-Check-In Instruction remains:
`Please go to the check-in desk by the front entrance to receive your evening's event package.`

Physical balls remain Thursday's production voting method. Do not make digital voting visible for production i-Pitch.

## Actual Eventbrite File / Business Rule

The first production Eventbrite CSV has been supplied. It includes at least:
- `Order ID`
- `Tickets`
- purchaser/guest first name
- purchaser/guest last name
- email address

The export can contain `Tickets > 1` while only the purchaser/main guest is named.

For this event, proceed with the following bounded model:

> **One Eventbrite CSV row/order becomes one qME imported registration. `Tickets` is the total number of people represented by that registration/check-in. Do not create invented companion names or separate companion attendee records.**

Examples:
- `Tickets = 1` -> one imported registration representing one guest.
- `Tickets = 2` -> one imported registration representing purchaser + 1 guest.
- `Tickets = 4` -> one imported registration representing purchaser + 3 guests.

Preserve `Order ID` as external/source registration provenance/identity where the existing schema can support it honestly. Preserve `Tickets` as party/guest quantity. Prefer a generic field/model such as `party_size` / registration quantity rather than an i-Pitch-specific field name.

Self-registered qME guests have no Eventbrite Order ID and default to a represented guest quantity of **1** for this event unless a future product decision explicitly adds party size to self-registration. Do not fabricate an Eventbrite-like Order ID for self-registration.

Do not attempt to merge/reconcile an Eventbrite imported registration with a qME self-registration based on name/email. They remain separate records if that unusual edge case occurs.

## Part A — Import / Re-Import Safety

Use the actual existing imported-registration workflow and make the smallest production-safe extension needed for this file.

Required:
- map first name, last name, email using the actual Eventbrite column names;
- preserve Eventbrite `Order ID` as external/source provenance where possible;
- preserve `Tickets` as total represented guest quantity/party size;
- normalize/validate quantity to a minimum of 1;
- one CSV row creates at most one imported registration;
- do not expand quantity into anonymous/fake companion records;
- do not alter existing check-in state merely because a file is imported again;
- subsequent Eventbrite exports may be supplied up until shortly before the event;
- a registration already imported from the same Eventbrite `Order ID` must be skipped rather than duplicated;
- a new Order ID in a later file should be added;
- do not perform destructive synchronization/deletion merely because a prior registration is absent from a later export;
- do not identity-merge against qME self-registered records.

Return/report useful import results such as rows processed, new registrations added, already-imported/skipped, and invalid rows where the current architecture supports it.

If the current schema cannot safely persist Order ID and/or party size, prepare the **exact SQL migration/RPC change** and report it. Do not silently overload an unrelated field. If production SQL is required before import can run safely, stop before importing and tell the Product Owner exactly what to execute.

## Part B — Party-Size-Aware Check-In Confirmation

When an imported Eventbrite registration checks in, use its total represented guest quantity.

### Quantity = 1

Keep natural single-person confirmation, equivalent to:

`Thanks, Paul! You are checked in.`

Then show the configured event instruction.

Also show a clear fulfillment count:

`Total guests: 1`

### Quantity > 1

Calculate additional guests as `Tickets - 1`.

Examples:
- total 2 -> `Thanks, Paul! You and your 1 guest are checked in.`
- total 3 -> `Thanks, Paul! You and your 2 guests are checked in.`
- total 4 -> `Thanks, Paul! You and your 3 guests are checked in.`

Use correct singular/plural grammar.

Then show the configured event instruction and a clearly visible:

`Total guests: N`

The purpose is operational: Tricia can glance at the guest's phone and immediately know how many evening event packages that check-in represents.

The **checked-in Event Check-In card on the guest event home** must also preserve/display `Total guests: N`, because the guest may return to the event home before reaching the front desk.

Do not hard-code Tricia or i-Pitch names into shared Check-In rendering. Party-size behavior should be reusable for other imported-registration events.

## Part C — Counts / Reporting Semantics

Do not create fake attendee records merely to make counts equal people represented.

Where the current UI/reporting already shows registration/check-in counts, preserve truthful semantics. If practical within this slice, distinguish:
- **registrations/check-ins** = number of qME registration records checked in;
- **guests represented** = sum of party sizes for checked-in registrations.

At minimum, preserve party size in export/reporting so event operators can determine represented attendance after the event.

Do not undertake a broad analytics redesign in this slice.

## Part D — Existing i-Pitch Content / Voting Position

Preserve the accepted event companion:
- Check-In;
- Agenda expanded on home;
- i-Pitch Finalists child cards with summary -> full detail;
- Meet the Judges content.

Digital voting prototype remains inactive/not visible in production. Physical balls are the production voting method Thursday.

The latest child-card regression is accepted:
- no broken image/placeholders when image URL absent;
- home shows summary;
- child detail shows full detail.

## Preserve Accepted Check-In Behavior

Do not regress:
- Auto Check-In;
- registration lookup by first/last/email;
- self-registration fallback;
- required email + Confirm email;
- inline email mismatch validation;
- event-configured post-check-in instruction;
- checked-in event-home card using that instruction;
- shared-device no-menu mode;
- Next Guest + 15-second auto-reset;
- personal-device session preservation;
- History/search/export and `registration_source` visibility;
- reusable admin test-data reset;
- SOTC behavior.

## Validation

At minimum:
- parser/import test using the actual Eventbrite header names;
- Tickets 1 / 2 / 4 mapping tests;
- Order ID duplicate/re-import test;
- later file with existing + new Order IDs adds only new registrations;
- prove re-import does not reset checked-in state;
- prove no companion/fake records are created for quantity > 1;
- self-registration defaults to party size 1 and has no Eventbrite Order ID;
- guest confirmation tests for 1, 2, and 4 total guests with correct grammar;
- checked-in event-home card preserves Total guests;
- export/reporting preserves party size if implemented;
- TypeScript;
- full test suite;
- production Vite build.

## Production Import / Product Owner Acceptance

Do **not** claim the production list is imported merely because import code/tests pass.

Handoff must state whether:
1. schema/SQL changes are required;
2. Product Owner must execute SQL first;
3. actual production CSV can then be imported through admin;
4. exact import steps and expected counts/results.

After production import, Product Owner acceptance should include:
- search/find a known `Tickets = 1` registration and check in;
- verify single-person confirmation + `Total guests: 1`;
- reset test data if needed;
- search/find a known multi-ticket registration and check in;
- verify `You and your N guests` wording and correct `Total guests`;
- return to event home and verify Total guests remains visible;
- verify admin/export retains Eventbrite source/Order ID/party size as appropriate;
- run a controlled repeat import and verify existing Order IDs are skipped, not duplicated.

## Handoff

Update this file with:
- exact Eventbrite CSV mapping;
- schema/storage fields used for Order ID and party size;
- duplicate/re-import semantics;
- party-size confirmation implementation;
- reporting/export behavior;
- SQL/manual production steps if required;
- files changed;
- tests/build results;
- actual production import status (not assumed);
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark i-Pitch production readiness done until the real Eventbrite list is imported and the production guest flow is smoke-tested.
