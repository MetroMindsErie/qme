# Current Work

## Current Slice

Check-In availability plus pre-event admin testing is implemented for production events.

The event companion can remain publicly visible while ordinary guest Check-In is Closed or Scheduled. No schema migration is required.

## Availability Storage / Model

Configuration lives under existing `events.metadata.check_in`:

```json
{
  "check_in": {
    "enabled": true,
    "completion_mode": "auto",
    "availability_mode": "closed | manual_open | scheduled",
    "scheduled_open_time": "16:30",
    "scheduled_close_time": "20:00",
    "manual_opened_at": "2026-09-02T...",
    "manual_closed_at": "2026-09-02T..."
  }
}
```

The reader also honors existing row-level `check_in_start` / `check_in_end` values as fallbacks when metadata times are absent.

Default for existing events without availability metadata is `manual_open`, preserving accepted SOTC/i-Pitch behavior unless an admin explicitly closes or schedules Check-In.

## Precedence Rules

- `closed`: public Check-In is closed.
- `manual_open`: public Check-In is open.
- `scheduled`: public Check-In follows `scheduled_open_time` / `scheduled_close_time` on the event date in the event timezone.
- `Open now`: sets `availability_mode = manual_open`, writes `manual_opened_at = now`, and clears `manual_closed_at`.
- `Close now`: sets `availability_mode = closed` and writes `manual_closed_at = now`.
- Choosing `scheduled` clears manual open/close timestamps so the event-local schedule is authoritative again.

## Timezone / Event Badge

`app/src/lib/eventTiming.ts` maps short zones such as `ET` to IANA zones such as `America/New_York` and converts event-local date/time to UTC instants for comparison.

Guest-facing event state no longer treats `status = active` as Live:
- before scheduled start: `Upcoming`;
- during start/end: `Live`;
- after scheduled end: `Ended`;
- draft/cancelled: unavailable;
- completed: ended.

## Enforcement

Guest home:
- Check-In card remains visible when closed/scheduled, but the action becomes disabled copy such as `Closed` or `Opens 4:30 PM ET`.
- Agenda, Finalists, Judges, theme, and other event companion content remain visible.

Guest Check-In route:
- `/events/:eventSlug/check-in` blocks ordinary guests while availability is closed or before/after the scheduled window.
- The route shows clear closed/scheduled copy and a Back to Event action.
- Guest form/search/claim handlers re-check availability before mutation.

App service layer:
- `createEventCheckIn`
- `searchImportedRegistrationsForGuest`
- `createImportedRegistrationCheckInForGuest`
- `reconnectImportedRegistrationCheckInForGuest`
- `checkInEventGuest`

These functions now refuse closed public Check-In unless called with the authenticated admin-test bypass from the guest route.

## Admin Test Path

Admin Check-In Settings exposes `Test as Admin`, linking to:

`/events/:eventSlug/check-in?adminTest=1`

That route bypasses public availability only after `getCurrentAdminPrincipal()` returns an authenticated admin who can manage the event via `canManageEvent`. Ordinary guests who copy the URL still see the closed/scheduled gate.

The bypass is visibly labeled on the guest Check-In screen.

## Admin Controls

Normal admin now exposes:
- Check-In Availability: Closed / Open manually / Scheduled.
- Scheduled Opens / Closes time inputs when Scheduled.
- Current/effective state label.
- Open now / Close now buttons in Check-In Settings.
- Test as Admin link in Check-In Settings.

The Edit Event form also persists the same availability fields in the Event Check-In Settings section.

## Files Changed

- `app/src/lib/eventTiming.ts`
- `app/src/lib/eventConfig.ts`
- `app/src/lib/checkInService.ts`
- `app/src/types/index.ts`
- `app/src/pages/admin/AdminEventCheckIns.tsx`
- `app/src/pages/admin/AdminEventForm.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/styles/eventDetail.css`
- `app/src/test/eventTiming.test.ts`
- `app/src/test/eventConfig.test.ts`
- `app/src/test/checkInService.test.ts`
- `app/src/test/adminEventCheckInsImportWorkflow.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `app/src/test/guestEventCheckIn.test.tsx`

## Validation

Passed locally:
- `npx tsc -b`
- `npx vitest run src/test/checkInService.test.ts src/test/eventTiming.test.ts src/test/eventConfig.test.ts src/test/guestEventDetail.test.tsx src/test/guestEventCheckIn.test.tsx src/test/adminEventCheckInsImportWorkflow.test.tsx --testTimeout 30000`
- `npx vitest run --testTimeout 30000` - 24 files / 187 tests passed.
- `npx vite build --outDir ..\tmp\vite-build-checkin-availability-2 --emptyOutDir`

One earlier build attempt failed because Windows/Dropbox had the previous temp output directory locked; the fresh-output production build passed. Vite still reports the existing large-chunk warning.

## i-Pitch Admin Configuration Steps

After automated deployment from `main`:
1. Open Admin -> Events -> `ipitch-092026` -> Check-Ins -> Settings.
2. Set Check-In Availability to `Scheduled`.
3. Set Opens to the chosen September 3 ET opening time, likely around `16:30`.
4. Set Closes to the chosen September 3 ET close time, likely `20:00`.
5. Use `Test as Admin` to exercise the full imported-registration/party-size Check-In flow while public Check-In remains closed.
6. Confirm a normal/incognito guest sees the event companion and an unavailable Check-In card before opening.
7. Use `Open now` / `Close now` only for operational testing or day-of override.
8. Restore `Scheduled` after manual testing so public Check-In follows the event-local window.

## Product Owner Acceptance

1. Before the event window, `/events/ipitch-092026` shows `Upcoming`, not Live.
2. Event companion content remains visible while Check-In is closed/scheduled.
3. Direct ordinary navigation to `/events/ipitch-092026/check-in` cannot complete Check-In while closed.
4. `?adminTest=1` works only for an authenticated admin who can manage the event.
5. Admin test mode can complete lookup, imported registration, self-registration, completion, party-size copy, and Back to Event without opening public Check-In.
6. Manual Open now makes ordinary guest Check-In available.
7. Manual Close now closes ordinary guest Check-In again.
8. Scheduled mode opens/closes by event-local ET times.
9. Existing Eventbrite import, party-size, shared-device reset, content/theme, and inactive production voting behavior remain intact.

## Status

Implementation, local validation, and push to `main` are complete.

Commit: `e78eff8`
