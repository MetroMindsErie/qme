# Current Work

## Current Slice Status

Eventbrite import + party-size Check-In implementation is complete, validated locally, committed, and ready for Product Owner SQL/import acceptance.

## Production Event

- organization: University of Akron Research Foundation
- event: i-Pitch - September, 2026
- slug: `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET
- Missing Falls Brewery, 540 S Main St., Akron, OH 44311

Digital voting remains inactive/not visible for production i-Pitch. Physical balls remain the production voting method.

## Eventbrite Mapping

Actual Eventbrite CSV columns used:
- `Order ID` -> durable external/source order identity
- `Tickets` -> total people represented by this one imported registration/check-in
- `First Name` -> registration first name
- `Last Name` -> registration last name
- `Email` -> registration email/normalized email
- `Ticket Type` or `Ticket Class`/`Ticket Name` when present -> source ticket type hint

Quantity rule:
- `Tickets = 1` means party size 1.
- `Tickets = 2` means party size 2, shown as purchaser + 1 guest.
- `Tickets = 4` means party size 4, shown as purchaser + 3 guests.
- Missing/zero numeric quantities normalize to at least 1.
- Non-numeric quantities are invalid rows.

One Eventbrite row/order remains one qME imported registration. The importer does not create companion/fake records.

## Storage / SQL

Schema/RPC SQL is required before production import.

Prepared SQL:
- `supabase-eventbrite-party-size-checkin.sql`

It adds:
- `event_imported_registrations.external_order_id`
- `event_imported_registrations.party_size`
- check constraint `party_size >= 1`
- unique Eventbrite Order ID protection on `(event_id, import_source, external_order_id)`
- updated guest search/claim/reconnect RPCs that return/preserve `party_size` and `external_order_id`

The SQL uses existing guest-session token handling via `ensure_guest_session(...)`; it does not depend on storing raw browser tokens.

Manual production step required:
1. Product Owner runs `supabase-eventbrite-party-size-checkin.sql` against production Supabase.
2. After SQL succeeds and automated deployment from `main` is live, import the actual Eventbrite CSV from Admin -> Event Check-In -> Settings -> Eventbrite Import.
3. Do not run production import before the SQL is applied.

## Import / Re-Import Semantics

- Existing Eventbrite `Order ID`s are skipped, not duplicated.
- New `Order ID`s in later Eventbrite files are inserted.
- Re-import does not update, delete, or reset existing imported registrations/check-ins.
- No destructive sync occurs when a previously imported order is absent from a later export.
- No qME self-registration reconciliation/merge is attempted by name or email.
- Import reports rows processed, new registrations, existing Order IDs skipped, and invalid rows.

## Check-In Behavior

Imported Eventbrite registration check-in now uses `party_size` for guest-facing fulfillment copy:
- party size 1: `Thanks, Paul! You are checked in.`
- party size 2: `Thanks, Paul! You and your 1 guest are checked in.`
- party size 4: `Thanks, Paul! You and your 3 guests are checked in.`

Then it shows the configured event post-check-in instruction and a visible `Total guests: N`.

The checked-in Event Check-In card on guest event home also shows `Total guests: N`.

Self-registered qME guests default to party size 1 and have no Eventbrite Order ID.

## Reporting / Admin

- Check-In CSV export now includes:
  - `external_order_id`
  - `party_size`
  - `guests_represented`
- Admin live Check-In now distinguishes registration/check-in count from represented guests with a `Guests represented` count.
- Existing `registration_source` behavior is preserved.

## Preserved

- Auto Check-In
- imported registration lookup by first/last/email
- self-registration fallback
- required email + Confirm email
- inline email mismatch validation
- event-configured post-check-in instruction
- shared-device no-menu mode
- Next Guest + 15-second auto-reset
- personal-device session preservation
- SOTC behavior
- accepted i-Pitch content: Check-In, Agenda, Finalists summary -> detail, Meet the Judges

## Files Changed

- `app/src/lib/checkInPartySize.ts`
- `app/src/lib/eventbriteRegistrationImport.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/adminEventDetail.test.tsx`
- `app/src/test/eventbriteRegistrationImport.test.ts`
- `app/src/test/guestEventCheckIn.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `app/src/types/index.ts`
- `supabase-eventbrite-party-size-checkin.sql`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\eventbriteRegistrationImport.test.ts src\test\guestEventCheckIn.test.tsx src\test\guestEventDetail.test.tsx src\test\adminEventCheckIns.test.ts`
- `npx vitest run --testTimeout 30000`
- `npx vite build --outDir ..\tmp\vite-build-check-eventbrite-party --emptyOutDir`

The first full test run at default timeout had environment/load timeouts in several already-slow UI tests; rerunning with `--testTimeout 30000` passed all 20 files / 164 tests. Vite emitted the existing large chunk warning; build completed successfully.

## Production Import Status

Production Eventbrite list has not been imported by this implementation turn.

Product Owner acceptance after SQL + import:
1. Import the actual Eventbrite CSV and confirm result counts: processed, new, skipped existing, invalid.
2. Search/find a known `Tickets = 1` registration and check in.
3. Verify single-person confirmation plus `Total guests: 1`.
4. Reset test data if needed.
5. Search/find a known multi-ticket registration and check in.
6. Verify `You and your N guests` wording and correct `Total guests`.
7. Return to event home and verify `Total guests` remains visible.
8. Export check-ins and verify Eventbrite source, Order ID, party size, and represented guest count.
9. Run a controlled repeat import and verify existing Order IDs are skipped, not duplicated.

Do not mark i-Pitch production readiness done until the real Eventbrite list is imported and the production guest flow is smoke-tested.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
