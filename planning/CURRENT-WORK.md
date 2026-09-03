# Current Work

## Production Slice Complete - Eventbrite CSV/XLS/XLSX Import

Production-day import compatibility gap addressed September 3, 2026.

Workflow now supported:
- untouched Eventbrite `.csv` download -> qME admin upload -> Preview -> explicit Import;
- untouched Eventbrite `.xls` download -> qME mobile/admin upload -> Preview -> explicit Import;
- untouched Eventbrite `.xlsx` download -> qME mobile/admin upload -> Preview -> explicit Import.

Implementation:
- Added direct browser-side Eventbrite workbook parsing with `xlsx`, scoped to import parsing so Tricia's untouched `.xls` export can be selected and parsed without Excel, CSV conversion, a laptop, or server-side file conversion.
- The admin Eventbrite file picker now accepts `.csv`, `.xls`, `.xlsx`, `text/csv`, `application/vnd.ms-excel`, and `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- CSV and Excel files normalize into the same internal `string[][]` row/header representation before the existing Eventbrite column recognition, preview, dedupe, and import logic runs.
- Worksheet selection scans workbook sheets for the Eventbrite attendee/order table containing required concepts: Order ID, Tickets, first name, last name, and email. If there is only one sheet, that sheet is used and then validated by the normal parser.
- Workbook reads disable formula/html/style extraction and convert cells to text using formatted cell text when present. Import parsing still treats workbook content as untrusted input and never injects cell HTML into the DOM.
- File/workbook bounds were added for browser safety: 8 MB file limit, 10,000 worksheet rows, and 200 worksheet columns.
- Unsupported file extensions and unreadable/oversized workbook content produce clear preview errors before any database mutation.

Preserved behavior:
- Order ID remains the exact repeat-import/dedupe key and is preserved as string text in normalized rows.
- Tickets remains the party-size / guests-represented source, including minimum party size of 1 and invalid-row reporting for non-numeric values.
- Preview still reports rows found, recognized fields, total guests represented, new registrations, already imported/skipped registrations, and invalid rows.
- Import remains explicit after preview; selecting a file does not mutate the database.
- Existing imported registrations and check-ins are not altered by repeat imports; existing Order IDs are skipped and only genuinely new Order IDs are inserted.
- Self-registered qME guests remain separate records; no fuzzy person merge was introduced.
- Accepted Check-In behavior, shared iPad kiosk loop, party-size confirmation, availability/adminTest behavior, and current attendance state were not changed.

Validation:
- Focused Eventbrite parser/import workflow:
  `npm test -- --run src/test/eventbriteRegistrationImport.test.ts src/test/adminEventCheckInsImportWorkflow.test.tsx`
  Result: 2 files passed, 15 tests passed.
- TypeScript:
  `npx tsc -b`
  Result: passed.
- Full Vitest suite:
  `npm test -- --run --maxWorkers=1`
  Result: 24 files passed, 199 tests passed.
- Production Vite bundle:
  `npx vite build --outDir dist-eventbrite-verify`
  Result: passed. Existing large-chunk warning remains.
- Standard `npm run build`:
  TypeScript completed, then Vite failed during output cleanup because Dropbox/Windows locked existing `app/dist/images`. This is the recurring local `EBUSY` filesystem lock before bundle output, not an application compile failure. The clean-output production Vite build above passed.

Files changed:
- `app/package.json`
- `app/package-lock.json`
- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `planning/CURRENT-WORK.md`

Git/deployment:
- Implementation commit SHA: pending.
- Push to `origin/main`: pending.
- Manual deploy: not requested. Normal automated deployment from `main` is expected after push.

Product Owner actual-iPhone acceptance still required:
1. On the actual iPhone, download/save Tricia's untouched `.xls` Eventbrite export into iCloud Files or Dropbox/Files.
2. In qME mobile web, open Admin -> i-Pitch -> Event Check-Ins -> Import.
3. Tap Choose File and confirm the `.xls` file is selectable.
4. Select it and stop at Preview.
5. Verify rows found, total guests represented, new registrations, already imported/skipped, and invalid rows.
6. Confirm existing Order IDs are skipped and only genuinely new Order IDs are proposed for import.
7. Press Import only after Product Owner review.
8. Confirm existing check-ins/attendance state remain unchanged after import.

Do not mark production acceptance complete until the actual untouched `.xls` file can be selected and previewed on the Product Owner's iPhone.
