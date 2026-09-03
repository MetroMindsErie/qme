# Current Work

## Production Slice Complete - Named Additional Attendees + Actual Party Size

Production-day check-in enhancement for i-Pitch completed September 3, 2026.

Implemented behavior:
- Imported Eventbrite registrations with `Tickets = 1` keep the existing flow: `This is me` completes check-in normally.
- Imported Eventbrite registrations with `Tickets > 1` now pause after `This is me` and show one additional-attendee row for each ticket beyond the primary attendee.
- Each remaining additional-attendee row requires First Name and Last Name. Whitespace-only values are rejected before check-in completion.
- Each additional-attendee row has `Remove guest`. Removing a row means that registered guest did not attend.
- Actual attendance is `1 + remaining named additional guests`.
- Confirmation wording, `Total guests`, admin `Guests Represented`, and attendance CSV `party_size`/`actual_party_size` use the actual attending party size.
- Original Eventbrite `Tickets` / registered party size is preserved separately as `registered_party_size` and `tickets`.
- Personal-phone and shared-iPad flows both use the same additional-attendee step. Shared mode retains kiosk-specific completion copy, no Back to Event, Next Guest, and 15-second reset.

Model/persistence:
- No new table was introduced for this bounded production slice.
- Additional attendees are persisted as deterministic child-attendee records inside the completed primary `event_check_ins.metadata.additional_attendees` JSON array.
- Each child attendee record is linked to the primary check-in/imported registration through the same check-in metadata:
  - `imported_registration_id`
  - original `external_order_id`
  - `registered_party_size`
  - `actual_party_size`
  - `additional_attendees`
- Child identities are deterministic: `<originalOrderId>-<position>`, where positions start at `1` for the first additional registered guest.
- Removed positions are not renumbered and are not persisted. Example: order `123456789`, remove position `2`, attending children remain `123456789-1` and `123456789-3`.
- The primary imported registration keeps its original Eventbrite Order ID unchanged; derived child identities are not used by the Eventbrite import/dedupe path.
- Completion is one server RPC call with the final additional-attendee list, so retries do not create partial child records. Existing active/completed check-ins still block duplicate primary check-ins.
- Completed-session recovery reconnects to the existing completed check-in and preserves `actual_party_size`, `registered_party_size`, and `additional_attendees` rather than reopening the guest-capture step.

Database change:
- Added `supabase-eventbrite-additional-attendees.sql`.
- It adds a new overload of `create_event_check_in_from_imported_registration_for_guest(..., p_additional_attendees jsonb)` that validates positions/names, stores actual attendance metadata, and preserves original registered Tickets.
- It also refreshes `reconnect_event_check_in_from_imported_registration_for_guest` so recovery does not overwrite actual attendance with the original registered party size.
- The app has a compatibility fallback for single-attendee claims if the new RPC overload is not present, but named additional attendees require this SQL to be applied.

Preserved behavior:
- Untouched Eventbrite `.csv` / `.xls` / `.xlsx` import support.
- Eventbrite primary Order ID repeat-import safety.
- Repeat imports skip existing primary Order IDs and do not touch completed attendance or named additional attendees.
- Existing imported registrations and check-ins are not deleted, reset, or recreated.
- Self-registered qME guests remain separate; no fuzzy person merge was introduced.
- Check-In availability/manual/scheduled/adminTest behavior, personal-phone copy/navigation, shared iPad kiosk loop, and event companion content/theme were not changed.

Validation:
- Focused check-in tests:
  `npm test -- --run src/test/guestEventCheckIn.test.tsx src/test/checkInService.test.ts src/test/adminEventCheckIns.test.ts`
  Result: 3 files passed, 28 tests passed.
- TypeScript:
  `npx tsc -b`
  Result: passed.
- Full Vitest suite:
  `npm test -- --run --maxWorkers=1`
  Result: 24 files passed, 203 tests passed.
- Production build:
  `npm run build`
  Result: passed. Existing large-chunk warning remains.

Files changed:
- `app/src/lib/checkInPartySize.ts`
- `app/src/lib/checkInService.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/test/adminEventCheckIns.test.ts`
- `app/src/test/checkInService.test.ts`
- `app/src/test/guestEventCheckIn.test.tsx`
- `app/src/types/index.ts`
- `supabase-eventbrite-additional-attendees.sql`
- `planning/CURRENT-WORK.md`

Git/deployment:
- Implementation commit SHA: `3bb3cc1541d21f21a7ce81c0edb4f64da92b4c0c`.
- Push to `origin/main`: pushed.
- Manual deploy: not requested.
- Production database SQL application is required before actual multi-ticket named-attendee acceptance can pass in production.

Product Owner acceptance after deployment/SQL:
1. Apply `supabase-eventbrite-additional-attendees.sql` to production.
2. Deploy/pick up latest `main`.
3. On personal phone, search for an imported registration with `Tickets > 1`.
4. Select `This is me` and confirm qME shows one First/Last row for each additional registered guest.
5. Confirm First Name and Last Name are mandatory for every remaining row.
6. Remove one guest row, enter names for the remaining additional guests, and complete check-in.
7. Confirm confirmation wording and `Total guests` reflect actual attendance, not original Eventbrite quantity.
8. Confirm admin `Guests Represented` reflects actual attendance while original registered Tickets remains preserved.
9. Confirm additional attendee names and child identities are persisted as `<originalOrderId>-1`, `<originalOrderId>-2`, etc., with removed positions absent.
10. Repeat on shared iPad mode and confirm kiosk copy/reset behavior remains intact.
11. Refresh/recover the completed guest session and confirm the additional attendee step does not reopen, no duplicates are created, and actual party size remains correct.
