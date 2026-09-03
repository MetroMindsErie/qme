# Current Work

## Current Slice — Eventbrite Export Column Compatibility

Production-day import compatibility follow-up for i-Pitch, September 3, 2026.

The prior named-additional-attendee History + Export slice is accepted by the Product Owner on production:
- History correctly shows one primary check-in plus actual party size and named additional attendees.
- Export correctly produces one row for the primary attendee plus one row per actual additional attendee, with original/child Order IDs and registered vs actual party size.

Do not revisit that accepted slice unless required to prevent a regression.

## Production Problem

Tricia supplied multiple Eventbrite exports during event preparation. qME correctly supports `.csv`, `.xls`, and `.xlsx`, but Eventbrite/organizer export shapes are not using one fixed set of column labels.

A newly supplied `.xlsx` file is rejected with:

`Preview failed: Eventbrite import file is missing required column: Tickets`

The new workbook does contain the concepts qME needs, but uses a different Eventbrite column vocabulary. The Product Owner has both real workbooks and has already observed the new workbook's first sheet.

Known new-export columns include:
- `Order ID`
- `Attendee first name`
- `Attendee last name`
- `Attendee email`
- `Ticket quantity`

The existing/previous accepted export vocabulary includes concepts such as:
- `Order ID`
- `First Name`
- `Last Name`
- `Email Address`
- `Tickets`

Product direction: qME should recognize supported Eventbrite export variants by **semantic field aliases**, normalize them into the same canonical import model, and preserve the existing safe Preview -> explicit Import workflow.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep this bounded to Eventbrite column/header compatibility. Do not broaden into fuzzy import, arbitrary spreadsheet mapping, or removal of safe identity requirements.

## Required Canonical Field Recognition

Maintain one canonical Eventbrite row model and expand header aliases feeding it.

At minimum support these aliases:

### Primary Order Identity — REQUIRED
Canonical: `order_id`

Recognize:
- `Order ID`

Do **not** make Order ID optional in this slice. It remains the safe repeat-import/dedupe identity for primary Eventbrite registrations.

### First Name — REQUIRED
Canonical: `first_name`

Recognize at minimum:
- `First Name`
- `Attendee first name`

Matching should be reasonably case/whitespace tolerant using the importer's existing header-normalization approach.

### Last Name — REQUIRED
Canonical: `last_name`

Recognize at minimum:
- `Last Name`
- `Attendee last name`

### Email — REQUIRED under current accepted import behavior
Canonical: `email`

Recognize at minimum:
- `Email Address`
- `Attendee email`

Preserve current email validation/normalization behavior.

### Registered Party Size / Tickets — REQUIRED
Canonical: `tickets` / registered party size

Recognize at minimum:
- `Tickets`
- `Ticket quantity`

`Ticket quantity` is semantically equivalent to the prior `Tickets` field for this import workflow.

Preserve current numeric validation, minimum party size 1, and registered-party-size semantics. Do not confuse this source quantity with actual attendance captured later during qME Check-In.

## Header Normalization / Alias Design

Do not add one-off conditionals scattered through CSV vs Excel paths.

Preferred design:
- file parser continues to normalize CSV/XLS/XLSX into the same row/header representation;
- one canonical header recognizer maps known Eventbrite aliases to canonical concepts;
- worksheet detection uses the same alias-aware concept recognizer rather than requiring only the old literal header names;
- preview/import business logic consumes canonical concepts and does not care which supported Eventbrite label was used.

Be tolerant of harmless header formatting differences such as capitalization and surrounding whitespace. Avoid overly broad aliases that could silently map an unrelated column.

If additional obvious Eventbrite variants are already represented in fixtures/code/history, include them only when unambiguous and document them in the handoff.

## Safety Boundary — Edited/Reduced Spreadsheets

Earlier, Tricia also sent/created an edited spreadsheet that removed important source fields. qME rejected it because required safe import concepts were absent. That was correct.

This slice must **not** turn qME into an arbitrary spreadsheet importer.

Still reject files that lack required canonical concepts, especially:
- Order ID;
- registered ticket/party quantity;
- primary attendee identity fields required by current import behavior.

Improve the error wording if straightforward so the admin understands the distinction, for example:

`This file is missing the Eventbrite Order ID column required for safe repeat imports. Please use an Eventbrite export that includes Order ID.`

or

`This file is missing the Eventbrite ticket quantity column (Tickets or Ticket quantity).`

Do not guess Order IDs from names/emails and do not fabricate primary Order IDs.

## Preserve Import Semantics

Preserve all accepted behavior:
- `.csv`, `.xls`, `.xlsx` direct browser upload;
- mobile/iPhone file selection;
- worksheet scanning for the Eventbrite table;
- Preview before any mutation;
- exact original Eventbrite Order ID preserved as text;
- Order ID repeat-import dedupe;
- existing Order IDs skipped;
- genuinely new Order IDs proposed/imported;
- registered party size preserved from source Tickets/Ticket quantity;
- existing completed check-ins and named additional attendees untouched by later imports;
- no fuzzy person merge;
- no automatic import on file selection.

Do not modify guest Check-In, named additional attendees, History/Export, kiosk, availability, or recovery behavior in this slice except as required to keep tests passing.

## Real-File Acceptance Context

The Product Owner has a new real Tricia `.xlsx` export that currently fails only because qME expects the old `Tickets` vocabulary. The first sheet includes the new attendee-style headers described above.

After deployment, the Product Owner will use that exact untouched workbook for production acceptance.

Expected acceptance behavior:
1. Choose the untouched new `.xlsx` file.
2. qME identifies `Order ID`, `Attendee first name`, `Attendee last name`, `Attendee email`, and `Ticket quantity` as the required canonical fields.
3. Preview succeeds.
4. Preview reports rows found, recognized fields, total registered guests represented, new registrations, existing/skipped Order IDs, and invalid rows.
5. Product Owner stops at Preview and reviews counts before Import.

Do not import the production file as part of implementation/testing.

## Validation

At minimum add/adjust tests proving:
- old export vocabulary still works: `Order ID`, `First Name`, `Last Name`, `Email Address`, `Tickets`;
- new export vocabulary works: `Order ID`, `Attendee first name`, `Attendee last name`, `Attendee email`, `Ticket quantity`;
- equivalent old/new header variants normalize to the same canonical key fields;
- alias-aware worksheet selection finds a sheet using the new vocabulary;
- `Ticket quantity` produces the same registered party-size semantics as `Tickets`;
- Order ID remains exact string text and dedupe behavior is unchanged;
- mixed harmless capitalization/whitespace does not break recognized aliases;
- missing Order ID is still rejected clearly;
- missing both `Tickets` and `Ticket quantity` is still rejected clearly;
- edited/reduced sheets without safe required fields remain rejected;
- CSV/XLS/XLSX support remains intact;
- focused Eventbrite parser/import workflow tests;
- TypeScript;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Using Tricia's exact new untouched workbook:
1. Open Admin -> i-Pitch -> Event Check-Ins -> Settings.
2. Choose the new `.xlsx` Eventbrite file.
3. Confirm Preview succeeds rather than reporting missing `Tickets`.
4. Stop before Import.
5. Review and report:
   - rows found;
   - recognized fields;
   - total guests represented;
   - new registrations;
   - already imported/skipped;
   - invalid rows.
6. Confirm the counts make sense against the existing imported population.
7. Only after Product Owner review should Import Registrations be pressed.
8. After import, verify existing check-ins and named additional attendees remain unchanged.

## Handoff

Update this FILE with:
- exact alias map implemented;
- how header normalization works;
- confirmation worksheet detection uses alias-aware recognition;
- error behavior for missing safe required concepts;
- files changed;
- focused/full test and build results;
- implementation commit SHA and push status;
- concise Product Owner acceptance steps using the real new workbook.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
