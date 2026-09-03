# Current Work

## Current Slice — Untouched Eventbrite Excel Import From Mobile

Production-day field workflow gap discovered September 3, 2026.

The Product Owner received a new Eventbrite attendee export from Tricia and attempted the intended field workflow on iPhone/mobile web:

**download Eventbrite file -> choose file in qME -> preview -> import**

The file can be downloaded into Dropbox or iCloud Files and is visible in the iOS file picker, but it cannot be selected by qME because the actual Eventbrite export is an Excel `.xls` file, not CSV.

This is a production workflow gap, not a request to convert/edit the organizer's file manually. Product direction remains:

> A person should be able to download the untouched Eventbrite export and upload it directly to qME, including from a phone in the field, without opening Excel, selecting/reordering columns, renaming fields, or converting the file to CSV.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep the slice bounded to import-file compatibility and preserve the accepted import semantics.

## Production Context

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- event is today, September 3, 2026

Existing accepted Eventbrite import behavior to preserve:
- untouched Eventbrite CSV preview/import;
- recognized Eventbrite columns without manual mapping;
- Order ID as the stable repeat-import/dedupe key;
- repeat import skips existing Order IDs rather than altering existing records/check-ins;
- party-size from `Tickets`;
- preview shows rows found, recognized fields, total guests represented, new registrations, already imported/skipped, and invalid rows;
- existing attendance/check-in state is not disturbed by a later Eventbrite import;
- self-registered qME guests remain separate records if a later Eventbrite registration appears for the same person; do not introduce fuzzy person merging in this slice.

Before this new import attempt, the two fabricated test imported-registration rows for Tricia Heller and Kelly Bialek were deliberately deleted from production because they were manually added to an earlier spreadsheet only so those organizers could test. Neither deleted row was linked to a check-in/session. If Tricia/Kelly appear in the new real Eventbrite export, qME should therefore import their actual Eventbrite records normally.

## Required File Support

The Eventbrite import file picker and parser should support untouched exports in:
- `.csv`
- `.xls`
- `.xlsx`

The iOS/mobile web file picker must allow a downloaded `.xls` Eventbrite file from iCloud Files or a Files-provider such as Dropbox to be selected.

Do not solve this only by loosening the HTML `accept` attribute. qME must actually parse the selected Excel workbook and normalize it into the same import pipeline used by CSV.

Prefer one normalized internal row/header representation feeding the existing Eventbrite detection/preview/import logic rather than duplicating import business rules for each file format.

For Excel workbooks:
- parse the appropriate worksheet safely;
- for the normal Eventbrite export, use the worksheet containing the attendee/order table; if there is only one worksheet, use it;
- preserve header text/value semantics needed by the existing Eventbrite column recognizer;
- treat blank trailing rows as non-data;
- preserve Order IDs as strings so large numeric-looking IDs are not rounded or converted to scientific notation;
- preserve Tickets/party-size semantics;
- do not evaluate or depend on workbook formulas/macros;
- reject unsupported/corrupt files with a clear user-facing message rather than silently importing bad data.

If `.xls` support requires a browser-compatible workbook parsing dependency, choose a maintained, appropriate dependency and keep its use scoped to import parsing. Do not add a server-side conversion requirement for today's field workflow unless there is a compelling security/compatibility reason documented in the handoff.

## Mobile / iPhone Acceptance

Primary production acceptance is the Product Owner's actual iPhone/mobile-web workflow, not desktop emulation alone:

1. Download Tricia's untouched Eventbrite `.xls` file to iCloud Files or Dropbox/Files.
2. Open qME Admin -> i-Pitch -> Event Check-Ins -> Import.
3. Tap Choose File.
4. The `.xls` file is selectable in the iOS file picker.
5. qME parses it directly without conversion.
6. Preview renders before any database mutation.
7. Product Owner can inspect the preview and decide whether to press Import.

The user must not need to:
- open Excel;
- Save As CSV;
- edit columns;
- copy/paste into another workbook;
- rename the file extension;
- move the task to a laptop merely because the source is `.xls`.

## Preview / Import Semantics

Excel and CSV versions of equivalent Eventbrite data must produce equivalent normalized preview/import results.

Preview must continue to expose at minimum:
- source rows found;
- recognized fields/columns;
- total guests represented;
- new registrations;
- already imported/skipped registrations;
- invalid rows with useful reasons.

Order ID remains the primary repeat-import identity. Do not change dedupe semantics merely to support Excel.

The new export may contain registrations added since the prior import. Expected behavior is:
- previously imported Order IDs -> skipped;
- genuinely new Order IDs -> new/importable;
- no existing check-in is deleted, reset, or recreated;
- party size for new rows comes from the current source export.

Do not auto-import immediately after file selection. Preserve the explicit preview -> Import confirmation workflow.

## Security / Robustness

Treat workbook content as untrusted input.
- Do not execute macros or formulas.
- Do not inject workbook cell HTML into the DOM.
- Bound parsing reasonably for an event-attendee upload; avoid allowing an unexpectedly huge workbook to freeze the browser indefinitely.
- Show a clear error for an unsupported/corrupt workbook.
- Preserve existing admin authorization for preview/import and existing server-side import protections.

## Preserve Production-Accepted Behavior

Do not regress:
- guest Auto Check-In;
- imported-registration lookup/reconnect and completed-session recovery;
- shared iPad kiosk loop;
- party-size confirmation and `Total guests`;
- `Checked In` vs `Guests Represented` counts;
- Check-In availability/manual/scheduled/adminTest behavior;
- event companion content/theme;
- personal-phone and shared-device copy/navigation;
- current imported registrations and existing check-ins.

No production data reset is part of this slice.

## Validation

At minimum:
- tests for CSV compatibility remaining unchanged;
- tests for `.xls` Eventbrite parsing;
- tests for `.xlsx` Eventbrite parsing;
- equivalent CSV/XLS/XLSX fixtures normalize to the same key import fields and preview counts;
- Order ID is preserved exactly as a string;
- Tickets/party size is preserved;
- duplicate Order IDs are still skipped against existing imported registrations;
- corrupt/unsupported Excel input yields a clear error;
- file input accepts `.csv`, `.xls`, `.xlsx` on supported browsers;
- TypeScript;
- focused import workflow tests;
- full Vitest suite;
- production Vite build.

If practical, include a test fixture that reflects the actual Eventbrite column set already accepted for i-Pitch, including at minimum Order ID, First Name, Last Name, Email Address, and Tickets, plus the extra untouched Eventbrite columns that should simply pass through/normalize without requiring the user to edit the file.

## Product Owner Acceptance After Deployment

1. On the actual iPhone, download/save Tricia's untouched `.xls` Eventbrite export into Files/Dropbox.
2. In qME mobile web, open i-Pitch Event Check-Ins import.
3. Confirm the `.xls` file is selectable.
4. Select it and stop at Preview.
5. Verify preview counts before pressing Import, especially:
   - rows found;
   - total guests represented;
   - new registrations;
   - already imported/skipped;
   - invalid rows.
6. Compare the preview logically with the previous imported population; existing Order IDs should be skipped and only genuinely new Order IDs should be proposed for import.
7. Only after Product Owner review, press Import.
8. Confirm existing check-ins/attendance state remain unchanged after import.

Do not mark production acceptance complete until the actual untouched `.xls` file can be selected and previewed on the Product Owner's iPhone.

## Handoff

Update this FILE with:
- exact file formats supported;
- parser/dependency chosen and why;
- file-picker accept behavior;
- worksheet-selection behavior;
- normalization approach;
- preservation of Order ID and Tickets/party size;
- files changed;
- focused/full test and build results;
- implementation commit SHA and push status;
- concise actual-iPhone acceptance steps.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
