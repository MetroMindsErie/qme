# Current Work

## Implementation Handoff

Final shared-iPad kiosk cleanup is implemented and validated. The shared device is now a closed loop:

`Find registration -> Check in -> confirmation -> Next Guest / 15-second automatic reset -> Find registration`

Shared-mode changes:
- Removed Back to Event from shared Check-In initial lookup.
- Removed Back to Event from shared expanded self-registration fallback.
- Removed Back to Event from shared completion/confirmation.
- Removed Back to Event from shared closed/scheduled and no-check-in/unavailable states.
- Preserved Next Guest, 15-second auto-reset, prior guest/session clearing, admin-test indicator, and availability enforcement.
- Preserved `shared=1` alias and primary `/events/:eventSlug/check-in?mode=shared` behavior.

Shared completion copy:
- Shared mode now uses kiosk-specific fulfillment wording without changing event configuration:
  `Please show this confirmation to the person at the desk to receive your evening's event package.`
- Personalized and party-size text still comes from qME's normal confirmation formatter.
- Personal-phone Check-In still uses the configured event instruction and still shows Back to Event.

Physical kiosk setup:
1. Open `/events/ipitch-092026/check-in?mode=shared`.
2. Safari Share -> Add to Home Screen.
3. Enable `Open as Web App`.
4. Launch the resulting i-Pitch Check-In Home Screen icon.
5. Start Guided Access on that clean web-app window.
6. Do not draw disabled touch regions over the qME screen.

Validation passed:
- Focused GuestEventCheckIn tests:
  `npm test -- --run src/test/guestEventCheckIn.test.tsx`
  Result: 13 tests passed.
- Full Vitest suite:
  `npm test -- --run`
  Result: 24 test files passed, 189 tests passed.
- Production build:
  `npm run build`
  Result: TypeScript and Vite build passed. Vite reported the existing large-chunk warning.

Files changed:
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/test/guestEventCheckIn.test.tsx`
- `planning/CURRENT-WORK.md`

Git/deployment:
- Commit SHA: pending.
- Push to `origin/main`: pending.
- Manual deploy: not requested. Normal automated deployment from `main` is expected.

## Current Slice

Final production cleanup for the i-Pitch front-table shared iPad Check-In kiosk.

The prior focused navigation/shared-device slice is implemented and was visually tested by the Product Owner on the actual iPad. Preserve it. This is a very small follow-up based on the physical-device acceptance test.

Read `AGENTS.md` first. Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded slice. Do not broaden into a new kiosk platform or change the personal-phone Check-In experience.

## Production Context / Physical Acceptance Completed

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET

The actual front-table iPad was tested successfully with:

`/events/ipitch-092026/check-in?mode=shared`

Verified on the physical iPad:
- shared tablet layout uses the screen well;
- no hamburger/menu;
- shared copy says `Enter your name or email to find your registration.`;
- Recovery phone is absent;
- imported Eventbrite registration lookup/check-in works;
- party-size behavior works (physical test: Meredith + 1 guest produced `Total guests: 2`);
- confirmation countdown and Next Guest are present;
- the iPad can use Safari `Add to Home Screen` with `Open as Web App`, which removes Safari browser chrome;
- iOS Guided Access can then lock the clean qME web-app window, producing the desired physical kiosk setup without drawing disabled regions over Safari controls.

The intended day-of physical kiosk setup is therefore:

**qME shared-device URL -> Add to Home Screen / Open as Web App -> launch Home Screen web app -> Guided Access**

No PWA/manifest work is required for tomorrow based on this successful physical test.

## Product Direction: Shared Mode Is a Dedicated Kiosk Experience

`mode=shared` is not simply the normal personal guest page on a larger screen. It is a dedicated front-table kiosk flow using shared underlying Check-In capabilities.

The kiosk loop should be intentionally closed:

**Find registration -> Check in -> confirmation -> Next Guest / 15-second automatic reset -> Find registration**

A person using the shared iPad should not navigate into the event companion from this device.

Personal-phone Check-In remains the guest's event-companion flow and must retain its existing behavior/copy where not explicitly changed below.

## Part A — Remove Back to Event From Shared Mode

When `mode=shared` (and alias `shared=1` if retained), remove `Back to Event` everywhere in the shared Check-In experience, including:
- initial registration lookup screen;
- expanded self-registration fallback;
- completed confirmation screen;
- closed/scheduled/unavailable shared-device state if a Back to Event action is currently rendered there.

The shared kiosk must not offer a path into the event companion.

Do **not** remove Back to Event from normal/personal guest Check-In. This is shared-device-only behavior.

Preserve:
- Next Guest;
- 15-second automatic reset;
- clearing prior guest/session state;
- admin-test indicator when applicable;
- availability enforcement.

## Part B — Shared-Device Post-Check-In Instruction

The approved personal-phone i-Pitch instruction remains:

`Please go to the check-in desk by the front entrance, show this check-in confirmation, and receive your evening's event package.`

That wording is incorrect on the shared front-table iPad because the guest is already standing at the check-in desk.

For `mode=shared`, use a kiosk-specific version of the post-check-in fulfillment instruction while preserving qME's generated personalized/party-size confirmation.

Target shared wording:

`Please show this confirmation to the person at the desk to receive your evening's event package.`

Example rendered result for a party of two:

`Thanks, Meredith! You and your 1 guest are checked in. Please show this confirmation to the person at the desk to receive your evening's event package.`

Then continue to show:
- `Total guests: 2`
- countdown such as `Next guest in 10 seconds...`
- `Next Guest`

Do not change the configured event-level post-check-in instruction stored for the personal-phone flow just to achieve the shared wording. Shared-device presentation should adapt the instruction for the kiosk context without altering the approved phone experience.

Keep this implementation bounded. If the cleanest reusable design is a small shared-device instruction override/fallback in the Check-In presentation layer, use that rather than introducing a broad content/configuration system in this slice.

## Part C — Preserve Physical Kiosk Setup

Do not add unnecessary install/PWA work. The Product Owner confirmed on the actual iPad that Safari's Add to Home Screen -> Open as Web App launches qME without Safari chrome, and Guided Access then locks the screen cleanly.

Document the day-of operator setup in the handoff:
1. Open the primary shared URL.
2. Safari Share -> Add to Home Screen.
3. Enable `Open as Web App`.
4. Launch the resulting i-Pitch Check-In Home Screen icon.
5. Start Guided Access on that clean web-app window.
6. Do not draw disabled touch regions over the qME screen.

Primary production kiosk URL:

`/events/ipitch-092026/check-in?mode=shared`

Pre-event authenticated test URL remains:

`/events/ipitch-092026/check-in?mode=shared&adminTest=1`

Do not weaken the permission-gated admin-test bypass.

## Preserve Accepted Production Behavior

Preserve all currently accepted behavior:
- untouched Eventbrite CSV preview/import;
- Order ID repeat-import safety;
- party-size handling and `Total guests`;
- separate `Checked In` and `Guests Represented` counts;
- Auto Check-In and self-registration fallback;
- Closed / Open manually / Scheduled Check-In availability;
- authenticated `adminTest=1` bypass only for admins who can manage the event;
- Upcoming / Live / Ended guest event state;
- guest event theme;
- Agenda / Finalists / Judges content;
- digital voting inactive for i-Pitch;
- no hamburger on focused event guest/admin workflows;
- shared-device copy/layout;
- Recovery phone hidden only in shared mode;
- Next Guest / 15-second reset.

## Validation

At minimum:
- TypeScript;
- focused GuestEventCheckIn tests proving shared mode has no Back to Event on initial, self-registration, completion, and unavailable states as applicable;
- tests proving normal/personal Check-In still has Back to Event where expected;
- tests proving shared post-check-in wording differs appropriately from the configured personal-phone instruction;
- party-size confirmation remains correct in shared mode;
- Next Guest and 15-second reset remain intact;
- shared ordinary URL still obeys closed/scheduled availability;
- shared `adminTest=1` remains permission-gated;
- full test suite;
- production Vite build.

## Product Owner Acceptance After Deployment

On the actual iPad Home Screen web app:
1. Open the shared Check-In kiosk and confirm there is no Back to Event action anywhere in the kiosk flow.
2. Find and check in one imported registration.
3. Confirm personalized/party-size wording and `Total guests` remain correct.
4. Confirm the shared fulfillment instruction says to show the confirmation to the person at the desk, rather than telling the guest to go to the front check-in desk.
5. Confirm `Next Guest` works.
6. Let one completed session sit untouched and confirm the 15-second automatic reset returns to a clean registration lookup screen.
7. Confirm the normal personal-phone Check-In still uses the approved front-entrance instruction and retains Back to Event.
8. Restore/confirm the intended production Check-In availability schedule after testing.

## Handoff

Update this FILE with:
- exact shared-mode Back to Event removals;
- exact shared-device completion copy behavior;
- confirmation personal-phone copy/navigation were preserved;
- tests/build results;
- files changed;
- implementation commit SHA;
- push status;
- concise final iPad acceptance steps.

Implementation, validation, FILE update, commit, and push to `main` are authorized for this bounded slice.
