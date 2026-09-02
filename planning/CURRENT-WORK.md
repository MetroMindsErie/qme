# Current Work

## Current Slice Status

The field-ready untouched Eventbrite CSV preview/import workflow is implemented, validated locally, committed, and pushed to `main`.

Production SQL and production import have not been run by Steve.

## Production Event

- organization: University of Akron Research Foundation
- event: i-Pitch - September, 2026
- slug: `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET

Digital voting remains inactive/not visible for production i-Pitch. Physical balls remain the production voting method.

## Untouched File Workflow

Admin -> Event Check-In -> Settings now supports the field workflow:

Registration system -> Download CSV -> qME -> Upload that exact CSV -> Review preview -> Import.

Selecting a CSV no longer commits rows immediately. qME reads the file, recognizes the Eventbrite registration concepts, queries existing Eventbrite Order IDs, and shows a preview. The operator must then click **Import Registrations** to write imported registration rows.

Preview shows:
- rows found;
- First Name recognized/missing;
- Last Name recognized/missing;
- Email recognized/missing;
- Order ID recognized/missing;
- Tickets / party size recognized/missing;
- total guests represented;
- new registrations;
- already imported/skipped;
- invalid rows;
- first invalid row reason when present.

Malformed/unrecognized files fail during preview with an actionable missing-column message such as:
`Eventbrite CSV is missing required column: Order ID`

## Supported Concepts / Header Aliases

Required recognized concepts:
- external/source registration identity: `Order ID`;
- party size / represented guests: `Tickets`;
- first name: `First Name`, `Attendee First Name`, `Buyer First Name`;
- last name: `Last Name`, `Attendee Last Name`, `Buyer Last Name`;
- email: `Email`, `Email Address`, `Attendee Email`, `Buyer Email`.

Optional ticket/category concept:
- `Ticket Type`, `Ticket Class`, `Ticket Name`.

Column order does not matter. Extra/unrecognized columns are ignored operationally.

## Source Metadata

Raw/source export fields are preserved in `event_imported_registrations.source_metadata` for each imported row. The importer stores every CSV header/value there, along with normalized Eventbrite fields:
- `order_id`;
- `tickets`;
- `party_size`;
- `additional_guests`.

No broad new raw-row schema was added.

## Party-Size / Order-ID Behavior Preserved

- one Eventbrite CSV row/order = one qME imported registration;
- `Order ID` is the durable external/source order identity;
- `Tickets` is total people represented by that registration/check-in;
- no invented companion records;
- self-registration defaults to party size 1 and has no Eventbrite Order ID;
- no Eventbrite-vs-qME self-registration merge/reconciliation by name or email;
- later Eventbrite exports skip already-imported Order IDs and add new Order IDs;
- no destructive synchronization/deletion;
- re-import does not reset existing check-in state.

Guest Check-In still shows party-size fulfillment copy and `Total guests: N` on success and on the checked-in event-home card.

## SQL / Production Safety

The previous SQL remains the required production SQL:
- `supabase-eventbrite-party-size-checkin.sql`

This slice did not change that SQL.

Product Owner must run that SQL in production before the first production import. After SQL succeeds and the automated deployment from `main` is live, the actual Eventbrite CSV can be imported through qME.

## Validation

Passed:
- automated parser/import preview tests using an untouched UARF/Eventbrite-shaped CSV header set with unrelated extra columns, shuffled column order, `Email Address`, and `Ticket Class`;
- column-order independence;
- extra columns ignored operationally and preserved in source metadata;
- known email/ticket aliases;
- missing required concept blocks preview/import with actionable validation;
- preview totals rows / represented guests / new / skipped / invalid before commit;
- explicit import after preview preserves Order ID / party size / re-import semantics;
- repeated updated file behavior remains existing Order IDs skipped, new Order IDs inserted;
- `npx tsc -b`;
- focused tests:
  `npx vitest run src\test\eventbriteRegistrationImport.test.ts src\test\adminEventCheckInsImportWorkflow.test.tsx src\test\guestEventCheckIn.test.tsx src\test\guestEventDetail.test.tsx src\test\adminEventCheckIns.test.ts`;
- full suite:
  `npx vitest run --testTimeout 30000`
  passed 21 files / 168 tests;
- production build:
  `npx vite build --outDir ..\tmp\vite-build-check-registration-preview --emptyOutDir`.

Vite emitted the existing large chunk warning; build completed successfully.

Repository search found no actual CSV fixture checked into or near the qME repo, so validation used the actual UARF/Eventbrite export shape recorded in this file rather than a hand-cleaned subset.

## Files Changed

- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `planning/CURRENT-WORK.md`

## Production Import Status

Production Eventbrite list has not been imported.

Product Owner acceptance:
1. Run `supabase-eventbrite-party-size-checkin.sql` in production Supabase.
2. Wait for automated deployment from `main` to be live.
3. Download/use the untouched actual Eventbrite CSV.
4. In qME Event Check-In Settings, choose that exact file without editing it.
5. Verify qME recognizes required concepts and shows the preview counts.
6. Confirm row count and total guests represented are plausible against Eventbrite.
7. Click **Import Registrations** explicitly.
8. Verify processed/new/skipped/invalid result counts.
9. Search and test one party-size-1 registration.
10. Reset test participation if needed.
11. Search and test one multi-ticket registration; verify `You and your N guests` plus `Total guests: N`.
12. Return to event home and verify `Total guests` persists.
13. Export check-ins and verify source Order ID and party size.
14. Re-upload the same untouched file and verify existing Order IDs are skipped rather than duplicated.

Do not mark i-Pitch production readiness done until the actual untouched Eventbrite export is imported through qME and the production guest flow is smoke-tested.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
