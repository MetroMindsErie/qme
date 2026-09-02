# Current Work

## Current Slice

Before Product Owner runs the Eventbrite party-size SQL or performs the first production import, finish the **field-ready registration import experience** so an operator can download a registration CSV from Eventbrite and upload that exact untouched file directly into qME.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

The previous Eventbrite party-size implementation is complete locally but **production SQL/import acceptance has not yet occurred**. Preserve that work while improving the actual import workflow described below.

## Product Principle

The field workflow must be:

> **Registration system -> Download CSV -> qME -> Upload that exact CSV -> Review preview -> Import**

The operator must **not** have to:
- open Excel;
- delete unrelated columns;
- select/copy only qME columns;
- rename headers;
- rearrange columns;
- create a qME-specific CSV;
- re-save/transform the registration-system export.

This matters especially for late event-day updates. If a new Eventbrite export arrives shortly before doors open, qME should accept the untouched download safely.

## Actual Production Context

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- September 3, 2026

The actual supplied Eventbrite export is the production fixture for this work. Test against its **real header names and extra columns**, not a hand-cleaned subset.

Previous SOTC registration work is also useful evidence: different registration sources/events contain different extra fields, but qME repeatedly needs a small set of stable registration concepts. Do not hard-code column positions or require every source to have the same complete shape.

## Part A — Recognize Registration Concepts, Not Column Positions

For the current Eventbrite format, qME should recognize/map the concepts it needs by header name/known aliases and ignore unrelated columns.

Core concepts for i-Pitch/Eventbrite:
- first name;
- last name;
- email;
- external/source registration identity (`Order ID` for this Eventbrite export);
- total registration quantity / party size (`Tickets` for this Eventbrite export);
- optional ticket/category/type where useful.

Known/expected aliases should be intentionally supported where evidence/current code justifies them. Examples may include:
- email: `Email`, `Email Address`;
- ticket category: `Ticket Type`, `Ticket Class`, `Ticket Name`;
- do not assume these examples are exhaustive without inspecting the actual fixture/current SOTC import handling.

Column **order must not matter**.

Extra/unrecognized columns must not make a valid import fail. Ignore them operationally unless preserving raw source metadata as described below is straightforward.

If a required concept genuinely cannot be found, **stop before import and explain exactly what is missing**. Do not guess from arbitrary columns.

## Part B — Untouched File Upload + Preview

Admin -> Event Check-In -> Settings should allow the operator to choose the untouched Eventbrite CSV file directly.

After file selection and **before committing rows**, show a useful recognition/preview state, ideally equivalent to:

`Eventbrite registration file recognized`

- rows found: N
- First Name: recognized
- Last Name: recognized
- Email: recognized
- Order ID: recognized
- Tickets / party size: recognized
- total guests represented: N
- new registrations: N
- already imported/skipped: N
- invalid rows: N

Then provide an explicit **Import Registrations** action.

The exact visual wording/layout may follow existing qME admin patterns; the important requirement is that the operator can see that qME understood the untouched file **before data is committed**.

For a malformed/unrecognized file, show actionable validation rather than a generic failure.

Do not require a separate column-mapping screen for this known Eventbrite format in the Thursday production path.

## Part C — Preserve Previous Eventbrite Party-Size Work

The previous bounded model remains accepted for implementation:

- one Eventbrite CSV row/order = one qME imported registration;
- `Order ID` = external/source order identity;
- `Tickets` = total people represented by that registration;
- do not create invented companion records;
- `Tickets = 1` -> one guest;
- `Tickets = 3` -> purchaser + 2 guests;
- self-registration defaults to party size 1 and has no Eventbrite Order ID;
- do not merge Eventbrite imports against qME self-registration;
- later Eventbrite exports skip already-imported Order IDs and add new Order IDs;
- no destructive synchronization/deletion;
- re-import must not reset existing check-in state.

Guest Check-In behavior remains:
- party size 1: `Thanks, Paul! You are checked in.`;
- party size > 1: `Thanks, Paul! You and your N guest(s) are checked in.` where N = party size - 1;
- visible `Total guests: N` on success and checked-in event-home card;
- configured event package instruction remains unchanged.

Tricia will use the guest's phone confirmation to know how many event packages to provide; do not make her dependent on an admin console.

## Part D — SQL / Production Safety

Previous work prepared:
- `supabase-eventbrite-party-size-checkin.sql`

It adds/preserves the required Order ID and party-size schema/RPC support.

**Do not run production import from code or mark production imported in this slice.**

After this untouched-file workflow is complete and deployed, handoff must tell Product Owner whether the previously prepared SQL is still the exact SQL to run or whether this slice changed it.

Product Owner will run required production SQL explicitly, then perform the real import through qME.

## Part E — Source Metadata / Future Import Direction

Do not overbuild this before Thursday, but preserve a clean architectural direction.

qME should distinguish:

### Normalized operational registration data
Examples:
- first name;
- last name;
- email;
- source/import system;
- external registration ID;
- party size;
- ticket/category where operationally useful;
- check-in/attendance state.

### Source-specific metadata
Registration exports may also contain fields such as company/employer, school, major, area of expertise, registration answers, price tier, etc. These may later become useful for personalization, tags, Perfect Phit/matching, analytics, or event-specific experiences even when Check-In does not currently use them.

If the existing schema already has a safe metadata/json field for imported registration source data, preserve the original row/source fields there where practical. **Do not add a broad new schema solely for raw-row preservation in this pre-event slice.** If not currently practical, document it as a future story rather than blocking Thursday.

Longer-term product direction (do not fully build now):
- rename/generalize `Eventbrite Import` toward **Import Registrations**;
- known source profiles (Eventbrite, recurring SOTC/custom exports, etc.);
- alias-based concept recognition;
- unknown-source/manual mapping when necessary;
- organization-level saved import profiles for recurring formats.

## Part F — Backlog Story: Structured Event Content Item Editor

Capture but **do not implement in this slice**:

Replace the current pipe-delimited content item editor (`Name | Summary | Full Detail | Image URL`) with a structured admin item editor.

Future desired UX:
- collection shows individual item cards/rows;
- **+ Add Item**;
- edit one item without replacing the entire text block;
- fields for Name, Summary, Full Detail, optional Image/Icon URL;
- Up / Down ordering;
- Delete;
- natural future place for URL, tags, and item-level interactions such as Vote;
- preserve bulk paste/import as an advanced convenience where useful.

The current pipe editor is acceptable for Thursday but has proven awkward and error-prone during live i-Pitch configuration.

## Preserve Accepted i-Pitch Behavior

Do not regress:
- Auto Check-In;
- imported lookup by first/last/email;
- self-registration fallback;
- email + Confirm email;
- post-check-in event instruction;
- party-size fulfillment copy/Total guests work from previous slice;
- shared iPad no-menu mode;
- Next Guest + 15-second reset;
- reusable event test-data reset;
- Agenda expanded on home;
- Finalists child cards summary -> full detail;
- Judges content;
- digital voting inactive/not visible for Thursday;
- SOTC behavior.

## Validation

At minimum:
- automated test using the actual untouched UARF/Eventbrite CSV header shape including unrelated extra columns;
- prove column order does not matter;
- prove extra columns are ignored safely;
- prove known email/ticket aliases where supported;
- prove missing required concepts block import with actionable validation;
- prove preview totals rows / represented guests / new / skipped / invalid before commit;
- prove import after preview preserves Order ID/party-size/re-import semantics;
- prove repeated untouched updated file adds only new Order IDs;
- TypeScript;
- full test suite;
- production Vite build.

## Product Owner Acceptance

After deployment, but **before production import**:
1. Run/confirm required SQL as instructed by Steve's handoff.
2. Download/use the untouched actual Eventbrite CSV.
3. In qME Event Check-In Settings, choose that exact file without editing it.
4. Verify qME recognizes required concepts and shows a preview.
5. Verify row count and total guests represented are plausible against the source file.
6. Import explicitly.
7. Verify processed/new/skipped/invalid result counts.
8. Search and test one party-size-1 registration.
9. Reset test participation if needed.
10. Search and test one multi-ticket registration; verify `You and your N guests` plus `Total guests: N`.
11. Return to event home and verify Total guests persists.
12. Export/check reporting for source Order ID and party size.
13. Re-upload the same untouched file and verify all existing Order IDs are skipped rather than duplicated.

## Handoff

Update this FILE (`planning/CURRENT-WORK.md`) with:
- exact untouched-file recognition behavior;
- supported header aliases/concepts;
- preview implementation;
- actual fixture/header validation performed;
- whether raw/source metadata is preserved or deferred;
- confirmation that previous party-size SQL is unchanged or exact replacement SQL if changed;
- files changed;
- tests/build results;
- production import status (must remain truthful);
- commit SHA;
- concise Product Owner SQL/import acceptance steps.

Do not mark i-Pitch production readiness done until the actual untouched Eventbrite export is imported through qME and the production guest flow is smoke-tested.
