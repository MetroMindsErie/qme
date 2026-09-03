# Current Work

## Current Slice — Consolidate Eventbrite Attendee/Ticket Rows Into Orders

Production-day import compatibility follow-up for i-Pitch, September 3, 2026.

The prior Eventbrite header-alias slice is accepted: Tricia's exact new `.xlsx` workbook is now recognized and reaches Preview. Product Owner stopped before Import as required.

The real workbook exposed a second legitimate Eventbrite export shape that must be normalized before production import.

Read `AGENTS.md` first. Implement, validate, update this FILE, commit, and push to `main`. Keep this bounded to Eventbrite repeated-order/ticket-row normalization. Do not change guest Check-In, named additional attendees, History/Export, kiosk, recovery, or availability behavior.

## Real Production Evidence

Tricia's untouched new Eventbrite workbook contains **75 source rows** after the header.

The accepted alias-aware Preview currently reports:
- Rows found: 75
- Total guests represented: 57
- New registrations: 8
- Already imported/skipped: 49
- Invalid rows: 18
- first invalid example: `duplicate_order_id_in_file`

Inspection of the actual workbook confirms these are not accidental duplicate rows. This Eventbrite export is **ticket/attendee-row shaped**:
- each physical row has `Ticket quantity = 1`;
- a multi-ticket Eventbrite order is represented by repeating the same Order ID once for each ticket;
- the same primary attendee name/email is repeated on those rows.

Confirmed examples from the real workbook:
- Mourad Krifa, Order ID `15545403573`, appears 3 times, each row `Ticket quantity = 1` -> one registration/order with registered party size 3.
- Terica Lacey, Order ID `15563970373`, appears 4 times, each row `Ticket quantity = 1` -> one registration/order with registered party size 4.

This aligns with the named-additional-attendee Check-In feature already in production: one imported primary registration with registered party size N should later ask the primary guest for N-1 actual additional attendee names at check-in.

## Product Rule

Do **not** treat every repeated Order ID in an Eventbrite source file as an invalid duplicate.

Before normal duplicate validation/import classification, qME should consolidate compatible source rows sharing the same Eventbrite Order ID into one canonical imported registration/order.

For a compatible group:
- primary Order ID = exact shared original Order ID;
- primary first/last/email = the compatible shared primary attendee identity;
- registered party size = **sum of the source ticket quantity values across rows in that Order ID group**;
- ticket type/source metadata should remain sensible and deterministic;
- one canonical registration is then fed into the existing dedupe/Preview/Import pipeline.

Example:

Source rows:
- `15545403573 | Mourad | Krifa | mourad.krifa@gmail.com | 1`
- `15545403573 | Mourad | Krifa | mourad.krifa@gmail.com | 1`
- `15545403573 | Mourad | Krifa | mourad.krifa@gmail.com | 1`

Canonical registration:
- Order ID: `15545403573`
- Mourad Krifa
- registered party size / Tickets: `3`

Do not create three imported registrations and do not derive `-1/-2` child identities during import. Child attendee identities remain a **check-in-time** concept for actual additional attendees, exactly as currently implemented.

## Compatibility / Conflict Safety

Repeated Order IDs may be consolidated only when the rows are compatible as one Eventbrite order.

At minimum, compare normalized primary identity fields across rows in a group:
- first name;
- last name;
- email.

Harmless case/outer-whitespace differences may normalize consistently with existing importer behavior.

If the same Order ID appears with conflicting non-empty primary identity values, do **not** silently choose one row. Mark that **order/group** invalid for Preview with a clear reason such as:

`conflicting_order_rows`

and surface enough information in the Preview/error details to make the issue understandable.

Likewise, if any ticket quantity in a group is invalid/non-numeric/non-positive under existing rules, the canonical order should be invalid rather than partially summing only the good rows.

Do not guess or fabricate identity values.

## Two Supported Eventbrite Shapes

The importer must continue to support both representations through one canonical order model.

### Shape A — order-level export
One source row per Order ID, with `Tickets` or equivalent already representing total registered party size.

Example:
- Order `ABC`, Tickets `3` -> canonical party size 3.

### Shape B — ticket/attendee-row export
Multiple compatible source rows share Order ID; each row has `Ticket quantity` (in Tricia's workbook, each is 1).

Example:
- Order `ABC`, quantities 1 + 1 + 1 -> canonical party size 3.

General rule should be **sum ticket quantity across compatible rows in an Order ID group**. For a one-row order, this naturally preserves the source value.

Do not double-sum an already order-level file across unrelated rows; grouping is strictly by exact normalized Order ID.

## Preview Semantics

The current Preview language should distinguish **physical source rows** from **canonical registrations/orders** now that they can differ.

For Tricia's real file, the UI should make the transformation understandable. Preferred information:
- `Source rows: 75`
- `Registrations / orders found: <unique valid+invalid Order ID groups>`
- `Total registered guests represented: 75` if all 75 ticket rows are represented by valid canonical orders;
- `New registrations: ...`
- `Already imported/skipped: ...`
- `Invalid orders: ...`

Do not keep calling legitimate extra ticket rows `Invalid rows` merely because their Order ID repeats.

If preserving `Rows found` for backward compatibility is useful, clarify that it means source rows and add a separate canonical-order count.

Preview counts must reconcile at the **canonical registration/order** level for new/skipped/invalid classification, while total registered guests represented is the sum of canonical registered party sizes.

Do not mutate the database during Preview.

## Repeat-Import / Existing Registration Semantics

After consolidation, feed canonical registrations into the existing exact Order ID dedupe behavior.

- Existing primary Order ID -> skipped, not inserted again.
- New primary Order ID -> importable.
- Existing completed check-ins and named additional attendees remain untouched.
- No fuzzy person merge.

Important: if a repeated-row canonical order has an Order ID that already exists in qME from an earlier order-level Eventbrite export, it remains **one skipped existing registration**, not multiple skipped rows.

Do not overwrite the existing imported registration's party size in this slice unless the existing repeat-import contract already explicitly supports updates. Preserve current skip semantics.

## Import Metadata

Preserve enough source metadata to understand the normalization if practical, for example:
- source row count for that order;
- summed registered ticket quantity;
- source/export shape indicator.

This is optional if it complicates the bounded production slice; correctness of canonical Order ID + registered party size is primary.

## Preserve Accepted Header/File Support

Preserve the alias map already implemented:
- Order ID;
- First Name / Attendee First Name / Buyer First Name;
- Last Name / Attendee Last Name / Buyer Last Name;
- Email / Email Address / Attendee Email / Buyer Email;
- Tickets / Ticket quantity;
- optional Ticket Type / Ticket Class / Ticket Name.

Preserve:
- `.csv`, `.xls`, `.xlsx`;
- mobile/iPhone selection;
- alias-aware worksheet detection;
- safe missing-column errors;
- exact Order ID as text;
- Preview -> explicit Import.

## Validation

At minimum add/adjust tests for:
- one-row order with Tickets=3 remains one canonical order with party size 3;
- three compatible rows same Order ID with Ticket quantity 1 each consolidate to one canonical order with party size 3;
- quantities 2 + 1 for same compatible Order ID consolidate to party size 3;
- Terica-style four repeated rows quantity 1 -> party size 4;
- repeated Order ID no longer creates `duplicate_order_id_in_file` for compatible rows;
- conflicting first name within same Order ID -> invalid order/group;
- conflicting last name within same Order ID -> invalid order/group;
- conflicting email within same Order ID -> invalid order/group;
- invalid ticket quantity in any grouped row -> invalid order/group, no partial sum;
- harmless case/whitespace normalization does not falsely conflict;
- existing Order ID dedupe happens once per canonical order;
- new Order ID inserts once with summed registered party size;
- total guests represented sums canonical party sizes correctly;
- Preview exposes source-row count separately from canonical registration/order count;
- old order-level CSV/XLS/XLSX fixtures still behave as before;
- new attendee-row `.xlsx` vocabulary and grouping work together;
- TypeScript;
- focused Eventbrite parser/import workflow tests;
- full Vitest suite;
- production Vite build.

## Product Owner Acceptance After Deployment

Use Tricia's exact untouched new workbook again. Do **not** Import until Preview is reviewed.

1. Open Admin -> i-Pitch -> Event Check-Ins -> Settings.
2. Choose the new `.xlsx` workbook.
3. Confirm Preview no longer reports the 18 repeated ticket rows as duplicate-order invalids.
4. Confirm Preview distinguishes source rows from canonical registrations/orders.
5. Confirm total registered guests represented is consistent with the 75 ticket rows in the real workbook.
6. Confirm Mourad's repeated 3-row order is represented as one registration with registered party size 3.
7. Confirm Terica's repeated 4-row order is represented as one registration with registered party size 4.
8. Review new registrations, existing/skipped registrations, and invalid orders.
9. Stop and report Preview counts to Product Owner before pressing Import.
10. Only after Product Owner approval, Import Registrations.
11. Verify existing completed check-ins/named additional attendees remain unchanged after import.

## Handoff

Update this FILE with:
- exact grouping/consolidation algorithm;
- conflict normalization/rules;
- Preview source-row vs canonical-order semantics;
- how registered party size is calculated;
- confirmation repeat-import dedupe still occurs once per canonical Order ID;
- files changed;
- focused/full test and build results;
- implementation commit SHA and push status;
- concise acceptance steps using Tricia's exact real workbook.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded production-day slice.
