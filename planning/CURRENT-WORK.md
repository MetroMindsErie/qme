# Current Work

## Current Slice Status

Pre-call i-Pitch Check-In operating cleanup is implemented and validated.

Registration/check-in remains the production must-have. Further voting work remains paused until Kelly and Tricia clarify desired event operations. The existing voting prototype code was preserved.

## Live Production Context

The Product Owner manually created the real organization and event through qME admin rather than using the prepared setup SQL.

Organization:
- **University of Akron Research Foundation**

Event:
- name: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- date: September 3, 2026
- time: 5:00-8:00 PM ET
- location: **Missing Falls Brewery, 540 S Main St., Akron, OH 44311**
- event logo: `/images/i-pitch.png`
- status: Active

The prepared `supabase-ipitch-2026-event-setup.sql` is now fallback/reference only. Do **not** run it against production for this event.

The real Eventbrite export has not yet been received. Do not invent/fake imported attendees. Final readiness still requires import plus production smoke test when Kelly/Tricia supply it.

## Implemented

Post-check-in instruction:
- Stored as event metadata at `metadata.check_in.post_check_in_instruction`.
- Editable in the normal Event Create/Edit Check-In Settings form.
- Used after successful imported-registration check-in and successful self-registration/Auto check-in.
- Existing events without the field keep the existing generic fallback.
- For i-Pitch, Product Owner should enter: `Please go to the check-in desk to receive your event package.`

Shared-device/iPad mode:
- Entry URL: `/events/ipitch-092026/check-in?mode=shared`
- Alternate supported flag: `?shared=1`
- Uses the existing guest Check-In flow.
- After success, shows the same configured post-check-in instruction.
- Shows **Next Guest** only in shared-device mode.
- **Next Guest** clears the event check-in local record, the event guest-session token, any local vote-allocation records for that event, and all in-memory form/search/result state, then returns to a clean Check-In screen.
- Normal personal-device behavior is unchanged.

Check-In card copy:
- Auto/imported/self-registration events now say: `Find your registration and check in when you arrive. If you're not on the list, you can register here.`
- Auto/imported-only events and Auto simple check-in events have matching non-staff-confirmation copy.
- Staff Check-In events still describe staff confirmation.

Guest event summary taxonomy:
- Replaced misleading `Sessions` count with neutral `Feature` / `Features`.
- Check-In is no longer presented as a session.

## Files Changed

- `app/src/lib/eventConfig.ts`
- `app/src/lib/guestSessionService.ts`
- `app/src/pages/admin/AdminEventForm.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/adminOrganizationList.test.tsx`
- `app/src/test/eventConfig.test.ts`
- `app/src/test/guestEventCheckIn.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\eventConfig.test.ts src\test\guestEventCheckIn.test.tsx src\test\guestEventDetail.test.tsx src\test\adminOrganizationList.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

## Product Owner Acceptance Steps

1. Edit `ipitch-092026` and set/verify `Post-Check-In Instruction` as: `Please go to the check-in desk to receive your event package.`
2. Fresh personal-device walk-up: self-register -> Auto check-in -> verify desk/package instruction.
3. Shared-device/iPad: open `/events/ipitch-092026/check-in?mode=shared`, Guest A checks in -> verify instruction -> **Next Guest** -> verify clean Check-In screen -> Guest B begins with no Guest A state.
4. Guest event home: verify Auto Check-In card no longer says staff will confirm.
5. Guest event home: verify the summary says `Feature`/`Features`, not `Sessions`.
6. When Eventbrite export arrives, import it and smoke-test a real imported attendee separately.

## Remaining Acceptance Position

Do not mark i-Pitch readiness done until the real Eventbrite export is imported and production smoke-tested.

Do not mark voting production-ready.

Implementation commit SHA: `454087b`.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
