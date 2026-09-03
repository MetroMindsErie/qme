# Current Work

## Current Slice - Remove Imported Claim Email Confirmation

Production-day investigation for i-Pitch, September 3, 2026.

Status: implemented locally and live i-Pitch Supabase migration applied.

## Finding

Robert Covington has two ready imported registrations for i-Pitch with the same first name, last name, and email, but different Eventbrite Order IDs:
- `15318060603`
- `15572143453`

The live Supabase claim RPC resolves by the selected `event_imported_registrations.id`, not by name/email, and does not auto-merge duplicate-name orders. A rollbacked live SQL call using Robert's verified email and one selected imported-registration ID successfully created the expected completed check-in row inside the transaction.

Live RPC execute permissions for `anon` and `authenticated` are present for imported-registration search, create, and reconnect functions. There is no `event_check_ins` uniqueness constraint by name/email/session that would block this duplicate-name/same-email scenario.

Craig D'Andrea has the same production shape: two ready imported registrations with the same first name, last name, and email, different Eventbrite Order IDs, and `party_size = 2`. The multi-ticket flow defers the create RPC until the additional-guest form is submitted, so the hidden server-side email gate produced the generic `Check-in could not be saved` failure at final `Check In`.

## What Changed

The guest imported-registration search card now displays `Order ID` when available, so two same-name/same-email imported orders are distinguishable before `This is me`.

The imported-registration duplicate-name email confirmation UI/state was removed for now. Imported registration claims send `emailConfirmation: null`.

## Guardrails Added

- UI regression: two Robert Covington search results with the same name/email and different Order IDs show separate Order IDs, no email confirmation field, and claiming the second row sends that exact selected imported-registration ID.
- Service regression: imported-registration claim sends the exact selected imported-registration ID and no email confirmation to the RPC.

## Preserved

- No auto-merge of duplicate Eventbrite orders.
- Imported claims continue to use exact imported-registration ID / Eventbrite Order ID linkage.
- Existing imported registrations, completed check-ins, named additional attendees, recovery, kiosk, and check-in behavior remain unchanged.

## Live Supabase

Applied live migration `allow_ipitch_duplicate_imported_claim_without_email`.

Scope:
- i-Pitch only (`events.slug = 'ipitch-092026'`) bypasses duplicate-name email confirmation in imported-registration search/create/reconnect RPCs.
- Other events retain the existing duplicate-name email confirmation gate.

Verified in a rollback transaction:
- Craig D'Andrea order `15588379013` with Donna D'Andrea as additional guest returns a completed check-in.
- `actual_party_size = 2`.
- No production check-in row was committed by the verification.

## Validation

Passed:
- `npm test -- --run src/test/guestEventCheckIn.test.tsx src/test/checkInService.test.ts` - 26 tests passed
- `npx tsc -b`
- `npm run build`

Note: the first build attempt hit the recurring transient Dropbox `dist/images` file-lock (`EBUSY`) while Vite was emptying output; isolated build retry passed.
