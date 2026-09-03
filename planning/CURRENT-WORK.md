# Current Work

## Current Slice - Ignore Eventbrite TOTALS Footer Row

Final production-day import cleanup for i-Pitch, September 3, 2026.

Status: implemented and pushed to `main`; ready for final Product Owner Preview acceptance using Tricia's exact untouched workbook before Import.

Implementation commit:
- `ecf4b7d68416025f00e9b4cfc5de56fc715e3512` - `Ignore Eventbrite totals footer row`

## What Changed

The Eventbrite parser now ignores the known `TOTALS` summary/footer row before required-field validation and repeated-order grouping.

Footer detection rule:
- skip when the normalized `Order ID` cell is exactly `totals`;
- also skip when `TOTALS` is the first populated cell and the canonical identity fields (`Order ID`, first name, last name, email) are empty;
- matching trims whitespace and is case-insensitive.

This is intentionally narrow. A malformed registration row still becomes invalid, and a real registration with `TOTALS` in some unrelated cell is not skipped.

## Preview Semantics

`rowCount` remains the physical post-header row count for compatibility.

Admin Preview shows:
- `Source rows: N` as data rows after ignored footer rows are removed;
- `Ignored footer rows: N` only when a footer was ignored;
- `Registrations / orders found: N`;
- `Total registered guests represented: N`;
- `Invalid orders: N`.

Expected final Preview for Tricia's exact workbook:
- Source rows: 74
- Ignored footer rows: 1
- Registrations / orders found: 57
- Total registered guests represented: 74
- New registrations: 8
- Already imported/skipped: 49
- Invalid orders: 0

## Preserved

- Compatible repeated Order IDs still consolidate into one canonical order.
- Mourad `15545403573` remains one order with party size 3.
- Terica `15563970373` remains one order with party size 4.
- Conflicting repeated rows remain invalid rather than guessed.
- Header aliases remain supported.
- CSV, `.xls`, and `.xlsx` direct upload remain supported.
- Exact original Eventbrite Order ID remains the dedupe identity.
- Preview remains non-mutating and Import remains explicit.
- Existing imported registrations, completed check-ins, and named additional attendees remain untouched.
- Guest Check-In, actual party size, History/Export, kiosk, recovery, and availability behavior are unchanged.

## Files Changed

- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npm test -- --run src/test/eventbriteRegistrationImport.test.ts src/test/adminEventCheckInsImportWorkflow.test.tsx` - 42 tests passed
- `npx tsc -b`
- `npm test -- --run --maxWorkers=1` - 24 files / 232 tests passed
- `npm run build`

Note: the parallel build attempt hit the recurring transient Dropbox `dist/images` file-lock (`EBUSY`) while Vite was emptying output; isolated build retry passed.

## Product Owner Acceptance

Use Tricia's exact untouched workbook and stop at Preview.

1. Open Admin -> i-Pitch -> Event Check-Ins -> Settings.
2. Choose the new `.xlsx` workbook.
3. Confirm Preview shows 57 registrations/orders.
4. Confirm Preview shows 74 total registered guests represented.
5. Confirm Preview shows 8 new registrations and 49 already imported/skipped.
6. Confirm Preview shows 0 invalid orders.
7. Confirm the `TOTALS` footer is ignored rather than shown as invalid.
8. Only after Product Owner approval, press Import Registrations.
9. After import, confirm import reports 8 newly imported and 49 skipped, with no invalid real orders.
10. Confirm existing completed check-ins and named additional attendees remain unchanged.
