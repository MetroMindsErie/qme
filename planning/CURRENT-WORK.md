# Current Work

## Current Slice - Eventbrite Export Column Compatibility

Production-day import compatibility follow-up for i-Pitch, September 3, 2026.

Status: implemented and pushed to `main`; ready for Product Owner acceptance using Tricia's exact untouched new workbook before any production import.

Implementation commit:
- `371739c6150d8314060fd019cb1d6fa5227c3288` - `Support Eventbrite attendee column aliases`

## What Changed

The existing Eventbrite import pipeline now recognizes supported header aliases before parsing rows. CSV, `.xls`, and `.xlsx` still normalize to the same `string[][]` representation, then one canonical recognizer maps headers to the existing row model.

Implemented alias map:
- `orderId`: `Order ID`
- `firstName`: `First Name`, `Attendee First Name`, `Buyer First Name`
- `lastName`: `Last Name`, `Attendee Last Name`, `Buyer Last Name`
- `email`: `Email`, `Email Address`, `Attendee Email`, `Buyer Email`
- `tickets`: `Tickets`, `Ticket quantity`
- optional `ticketType`: `Ticket Type`, `Ticket Class`, `Ticket Name`

Header matching trims surrounding whitespace, collapses repeated internal whitespace, and compares case-insensitively. The parser still returns the actual source header label in `headerMapping`, so Preview can report what was recognized.

Worksheet detection now uses the same alias-aware recognizer. A workbook sheet with `Order ID`, `Attendee first name`, `Attendee last name`, `Attendee email`, and `Ticket quantity` is selected as the Eventbrite attendee table.

## Safety Preserved

- `Order ID` remains required for safe repeat-import dedupe.
- `Ticket quantity` maps only to the existing registered party-size / tickets concept.
- Files missing both `Tickets` and `Ticket quantity` are still rejected.
- Edited/reduced files missing safe required concepts are still rejected.
- No Order IDs are guessed or fabricated.
- Existing `.csv`, `.xls`, `.xlsx`, Preview-before-Import, import dedupe, existing check-ins, named additional attendees, History/Export, and guest Check-In behavior are unchanged.

Improved missing-column messages:
- missing order identity: `This file is missing the Eventbrite Order ID column required for safe repeat imports...`
- missing ticket quantity: `This file is missing the Eventbrite ticket quantity column (Tickets or Ticket quantity).`

## Files Changed

- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npm test -- --run src/test/eventbriteRegistrationImport.test.ts` - 21 tests passed
- `npm test -- --run src/test/adminEventCheckInsImportWorkflow.test.tsx` - 3 tests passed
- `npx tsc -b`
- `npm test -- --run --maxWorkers=1` - 24 files / 214 tests passed
- `npm run build`

Note: one production build attempt hit a transient Dropbox `dist/images` file-lock (`EBUSY`) while Vite was emptying output; isolated retry passed.

## Product Owner Acceptance

Use Tricia's exact new untouched Eventbrite workbook.

1. Open Admin -> i-Pitch -> Event Check-Ins -> Settings.
2. Choose the new `.xlsx` Eventbrite file.
3. Confirm Preview succeeds and no longer reports missing `Tickets`.
4. Stop before Import.
5. Review rows found, recognized fields, total guests represented, new registrations, already imported/skipped, and invalid rows.
6. Confirm counts make sense against the existing imported population.
7. Only after Product Owner review should Import Registrations be pressed.
8. After import, verify existing check-ins and named additional attendees remain unchanged.
