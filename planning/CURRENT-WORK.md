# Current Work

## Current Slice - Consolidate Eventbrite Ticket Rows Into Orders

Production-day import compatibility follow-up for i-Pitch, September 3, 2026.

Status: implemented and pushed to `main`; ready for Product Owner Preview acceptance using Tricia's exact untouched workbook before production Import.

Implementation commit:
- `a1a27f756307c5ce2b2560c32b8cd8ee06d2eb0a` - `Consolidate Eventbrite ticket rows by order`

## What Changed

The Eventbrite importer now consolidates compatible source ticket rows into one canonical registration/order before Preview, dedupe, and Import.

Algorithm:
- CSV, `.xls`, and `.xlsx` still normalize into the existing worksheet row matrix first.
- Alias-aware header recognition still maps old and new Eventbrite headers into canonical fields.
- Each valid source row is grouped by the trimmed original Eventbrite `Order ID`.
- Within each Order ID group, primary first name, last name, and email are compared after harmless case/whitespace normalization.
- Compatible groups emit one canonical registration.
- Registered party size is the sum of `Tickets` / `Ticket quantity` across all rows in the group.
- The original Order ID remains the primary `external_order_id` and `external_attendee_id`.
- Existing exact Order ID repeat-import dedupe then runs once per canonical order.

Real production examples now represented correctly:
- Mourad Krifa, `15545403573`, three `Ticket quantity = 1` source rows -> one registration with party size 3.
- Terica Lacey, `15563970373`, four `Ticket quantity = 1` source rows -> one registration with party size 4.

## Conflict / Invalid Rules

The importer does not guess across conflicting repeated rows.

An Order ID group is invalid when:
- any grouped row has invalid/non-positive/non-numeric ticket quantity;
- first name conflicts across rows after normalization;
- last name conflicts across rows after normalization;
- email conflicts across rows after normalization.

Conflict reason: `conflicting_order_rows`.

Compatible repeated rows no longer produce `duplicate_order_id_in_file`.

Canonical metadata records the consolidation shape:
- `source_row_count`
- `source_row_numbers`
- `source_export_shape`
- `summed_ticket_quantity` for multi-row groups

## Preview Semantics

Admin Preview now distinguishes physical rows from canonical registrations/orders:
- `Source rows: N`
- `Registrations / orders found: N`
- `Total registered guests represented: N`
- `Invalid orders: N`

New/skipped/invalid classification is now at the canonical registration/order level. Preview still does not mutate the database.

## Preserved

- Old order-level Eventbrite exports still work.
- Header aliases remain supported: `Order ID`; `First Name` / `Attendee First Name` / `Buyer First Name`; `Last Name` / `Attendee Last Name` / `Buyer Last Name`; `Email` / `Email Address` / `Attendee Email` / `Buyer Email`; `Tickets` / `Ticket quantity`; optional ticket type/class/name.
- CSV, `.xls`, and `.xlsx` direct upload remains supported.
- Preview-before-Import remains unchanged.
- Existing imported registrations are skipped once per canonical Order ID.
- Existing check-ins and named additional attendees are untouched.
- Guest Check-In, kiosk, recovery, History, Export, and availability behavior are unchanged.

## Files Changed

- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npm test -- --run src/test/eventbriteRegistrationImport.test.ts src/test/adminEventCheckInsImportWorkflow.test.tsx` - 35 tests passed
- `npx tsc -b`
- `npm test -- --run --maxWorkers=1` - 24 files / 225 tests passed
- `npm run build`

Note: as in prior event-day slices, parallel build attempts hit a transient Dropbox `dist/images` file-lock (`EBUSY`) while Vite was emptying output; isolated build retry passed.

## Product Owner Acceptance

Use Tricia's exact untouched new Eventbrite workbook. Do not Import until Preview is reviewed.

1. Open Admin -> i-Pitch -> Event Check-Ins -> Settings.
2. Choose the new `.xlsx` workbook.
3. Confirm Preview no longer reports repeated ticket rows as duplicate-order invalids.
4. Confirm Preview shows both source rows and registrations/orders found.
5. Confirm total registered guests represented is consistent with the 75 ticket rows in the real workbook.
6. Confirm Mourad `15545403573` is one registration with registered party size 3.
7. Confirm Terica `15563970373` is one registration with registered party size 4.
8. Review new registrations, existing/skipped registrations, and invalid orders.
9. Stop and report Preview counts to Product Owner before pressing Import.
10. Only after Product Owner approval, press Import Registrations.
11. Verify existing completed check-ins and named additional attendees remain unchanged after import.
