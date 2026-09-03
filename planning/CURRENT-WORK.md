# Current Work

## Current Slice - History + Export for Named Additional Attendees

Production-day follow-up for i-Pitch, September 3, 2026.

Status: implemented and pushed to `main`; ready for Product Owner acceptance.

Implementation commit:
- `aeed8859727b77e4c6fc77ac3f6f364190a2d2a7` - `Surface additional attendees in history export`

## What Changed

Admin History now keeps one primary entry per completed/cancelled check-in, while projecting persisted party details under that primary entry when present:
- `Actual party size: N`
- `Registered tickets: N` when registered and actual differ
- one visible line per persisted additional attendee, including deterministic child identity when available, e.g. `Guest 1: Ava One (123456789-1)`

History search still matches primary fields and now also matches persisted additional attendee names and child identities.

Export Check-Ins now exports an attendee-level CSV projection:
- one primary row for each check-in;
- one additional row for each persisted attending additional attendee;
- primary row uses the original Eventbrite Order ID;
- additional rows use deterministic child identities, e.g. `<orderId>-1`, `<orderId>-2`;
- all party rows include `primary_order_id`, `registered_party_size`, `actual_party_size`, and `guests_represented`;
- existing status, ticket type, import/source, timestamp, and primary contact/credit columns remain available where applicable.

No database rows are created for additional attendees. Existing completed `event_check_ins.metadata.additional_attendees` projects correctly without migration or re-check-in.

## Preserved

- `Checked In` count remains primary completed check-ins only.
- `Guests Represented` remains actual attending party size.
- Capture/recovery/shared iPad/personal phone flows were not changed.
- Eventbrite dedupe/import behavior was not changed.
- The held Eventbrite new-column compatibility work was not started.

## Files Changed

- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/test/adminEventCheckIns.test.ts`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npm test -- --run src/test/adminEventCheckIns.test.ts src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `npx tsc -b`
- `npm test -- --run --maxWorkers=1` - 24 files / 206 tests passed
- `npm run build`

Note: first full build attempt hit a transient Dropbox `dist/images` file-lock (`EBUSY`) while Vite was emptying output; retry passed.

## Product Owner Acceptance

Use the multi-ticket check-in completed during acceptance testing.

1. Open Admin Check-In -> History.
2. Locate the primary person.
3. Confirm actual party size is visible.
4. Confirm all named additional attendees are visible under/within that single primary History entry.
5. Confirm History still represents one primary check-in, not one check-in per party member.
6. Export Check-Ins.
7. Confirm export contains one row for the primary plus one row for each actual named additional attendee.
8. Confirm primary Order ID and child `-1`, `-2`, etc. identities are correct.
9. Confirm registered party size and actual party size are both available.
10. Confirm Admin top counts remain unchanged/correct.

After Product Owner acceptance, return to the held Eventbrite new-column compatibility work as a separate slice.
