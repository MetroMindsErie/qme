# Current Work

## Current Slice — Ignore Eventbrite TOTALS Footer Row

Final production-day import cleanup for i-Pitch, September 3, 2026.

The repeated-ticket-row consolidation slice is deployed and Product Owner tested Tricia's exact untouched workbook in production Preview. The consolidation behavior is accepted. One final non-data footer row remains incorrectly classified as an invalid order.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. This should be a very small bounded parser cleanup. Do not broaden the importer or change any accepted check-in/import semantics.

## Production Acceptance Evidence

Using Tricia's exact untouched new Eventbrite workbook after the repeated-order deployment, Preview now reports:
- Source rows: 75
- Registrations / orders found: 58
- Total registered guests represented: 74
- New registrations: 8
- Already imported/skipped: 49
- Invalid orders: 1
- First invalid order: `row 76, missing_required_field`

Inspection of the actual workbook confirms Excel row 76 is not a registration. It is an Eventbrite summary/footer row whose first populated value is:

`TOTALS`

Therefore the real attendee/order math is:
- 74 actual ticket/attendee source rows;
- 57 real canonical Eventbrite orders;
- 74 registered guests represented;
- 8 new orders;
- 49 already imported/skipped orders;
- 0 invalid real orders.

`8 + 49 = 57` real orders.

The prior assumption that all 75 source rows represented attendees was corrected by inspecting the actual workbook: one of the 75 physical post-header rows is the `TOTALS` footer.

## Required Behavior

Recognize the known Eventbrite `TOTALS` summary/footer row as **non-data** and ignore it before required-field validation/grouping.

For the real workbook, after this change Preview should show the equivalent of:
- Source rows: 74 data rows (preferred if source-row count means importable/data rows), OR `75 physical rows / 1 ignored footer` if preserving physical-row semantics is cleaner;
- Registrations / orders found: 57;
- Total registered guests represented: 74;
- New registrations: 8;
- Already imported/skipped: 49;
- Invalid orders: 0.

Whichever source-row presentation is chosen, make it unambiguous that the TOTALS footer is intentionally ignored and is not an invalid registration.

## Footer Detection Safety

Keep footer detection narrow and deterministic.

At minimum:
- after normal cell trimming/case normalization, a row whose Order ID/source first identifying cell is exactly `TOTALS` should be treated as an Eventbrite summary/footer row and skipped;
- case variants such as `Totals` / `totals` may be treated equivalently;
- surrounding whitespace may be ignored.

Do **not** broadly skip arbitrary rows merely because required fields are missing. Genuine malformed attendee/order rows must continue to be invalid and visible in Preview.

Do not skip a legitimate order merely because another unrelated cell happens to contain the word totals. Detection should be anchored to the expected Eventbrite footer shape / Order ID position.

If the parser already has a concept of ignored blank/non-data rows, integrate this footer into that mechanism rather than creating a second import path.

## Preserve Accepted Import Behavior

Preserve all previously accepted behavior:
- compatible repeated Order IDs consolidate into one canonical order;
- registered party size is summed across grouped Ticket quantity/Tickets rows;
- Mourad's three ticket rows -> one order, party size 3;
- Terica's four ticket rows -> one order, party size 4;
- conflicting repeated rows remain invalid rather than guessed;
- exact original Eventbrite Order ID remains dedupe identity;
- existing Order IDs skip once per canonical order;
- header aliases remain supported;
- CSV/XLS/XLSX remain supported;
- mobile/iPhone upload remains supported;
- alias-aware worksheet selection remains supported;
- Preview remains non-mutating and Import remains explicit;
- edited/reduced files missing required safe concepts still fail;
- existing completed check-ins/named additional attendees remain untouched;
- guest Check-In, actual party size, History/Export, kiosk, recovery, and availability are unchanged.

## Validation

At minimum test:
- exact `TOTALS` footer in Order ID position is ignored;
- `Totals` / whitespace/case variants are ignored;
- ignored TOTALS row does not increment invalid-order count;
- ignored TOTALS row does not increment canonical order count;
- ignored TOTALS row does not increment total registered guests;
- a normal malformed row missing required fields is still invalid;
- a legitimate order with some other cell containing `TOTALS` is not incorrectly skipped;
- Tricia-style fixture yields 74 attendee/ticket data rows, 57 canonical orders, 74 represented guests, and zero invalid orders when all real orders are valid;
- repeated-order grouping tests remain passing;
- old order-level export tests remain passing;
- header alias tests remain passing;
- focused Eventbrite parser/import workflow tests;
- TypeScript;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Use Tricia's exact untouched workbook again and stop at Preview.

Expected production Preview:
- 57 registrations/orders;
- 74 total registered guests represented;
- 8 new registrations;
- 49 already imported/skipped;
- 0 invalid orders;
- TOTALS footer is ignored rather than shown as invalid.

If those values are confirmed, Product Owner may approve **Import Registrations**.

After import:
1. Confirm import reports 8 newly imported and 49 skipped, with no invalid real orders.
2. Confirm existing completed check-ins and named additional attendees remain unchanged.
3. Confirm one of the newly imported registrations can be found by guest search if desired; no need to create another test check-in unless Product Owner wants to.

## Handoff

Update this FILE with:
- exact TOTALS/footer detection rule;
- source-row Preview semantics chosen;
- tests/build results;
- files changed;
- implementation commit SHA and push status;
- concise final Preview acceptance steps.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded final production-day import cleanup.
