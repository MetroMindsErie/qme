# Current Work

## Current Slice

Implement **configurable Check-In availability with manual/scheduled control plus a safe admin test path** for production events.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

This is a production-readiness slice for i-Pitch on September 3, 2026. The event companion should be viewable before the event, but ordinary guests should not be able to complete Check-In until the configured Check-In window is open.

## Actual Production State / Problem

Current production event:
- event: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- event date: `2026-09-03`
- event start: `17:00`
- event end: `20:00`
- timezone: `ET`
- event status: `active`
- `check_in_start`: currently null
- `check_in_end`: currently null
- Check-In metadata enabled: true

Observed problem on September 2 before the event:
- guest event page is available, which is desired;
- guest page displays **Live** because event `status = active`, even though the scheduled event has not started;
- Check-In can already be completed by ordinary guests because no availability/time gate is enforced;
- Product Owner needs to test Check-In before the event without exposing production Check-In to all guests.

## Product Model

Keep these concepts separate:

### 1. Event publication / administrative status
Controls whether the event companion is published/available.

Existing Draft / Active / Completed / Cancelled semantics may remain the administrative state. **Do not make `active` synonymous with “the event is happening right now.”**

### 2. Guest-facing temporal event state
Guest-facing label should be derived from event date/start/end where possible:
- **Upcoming** before scheduled event start;
- **Live** during the scheduled event window;
- **Ended** after scheduled event end;
- sensible fallback when schedule is incomplete.

The current top-right `Live` badge should not display merely because database `status = active`.

### 3. Check-In availability
Check-In needs its own operational state independent of event publication.

Required admin modes:
- **Closed** — event companion remains visible, but ordinary guest Check-In is unavailable.
- **Open manually** — Check-In is available until an admin closes it.
- **Scheduled** — Check-In opens/closes according to configured event-local date/time.

The model must also permit a practical admin override such as **Open now / Close now** when operational conditions change. Keep this implementation bounded and reusable; do not hard-code i-Pitch.

## Use Existing Fields Where Appropriate

The `events` table already has:
- `check_in_start`
- `check_in_end`
- `event_date`
- `timezone`
- event start/end times

Inspect existing semantics before introducing new storage. Prefer existing fields plus minimal metadata/configuration if a mode/override flag is needed. Do not add a schema migration unless there is a clear reason the existing columns/metadata cannot represent the required behavior honestly.

Because `check_in_start` / `check_in_end` are currently time-only fields, define clearly how they combine with `event_date` and timezone for a one-day event. Do not compare server UTC naïvely to an ET event time.

## Admin Configuration

Normal Event Admin / Check-In Settings should make Check-In availability understandable without SQL.

Minimum desired controls:
- Check-In Availability mode: **Closed / Open manually / Scheduled**;
- when Scheduled: opening time and closing time for the event date, using the event timezone;
- clear current/effective state, e.g. `Currently closed`, `Opens Sep 3 at 4:30 PM ET`, `Currently open`, `Closed at 8:00 PM ET`;
- manual operational action where appropriate: **Open now** / **Close now**.

Avoid ambiguous configuration where both scheduled and manual states silently fight each other. Define precedence explicitly and surface it in UI/copy.

For i-Pitch, Product Owner expects to configure a Check-In opening time before the 5:00 PM event start (likely around 4:30 PM; exact value will be chosen in admin during acceptance) while leaving the event companion publicly visible beforehand.

## Guest Behavior While Check-In Is Closed

The rest of the event companion remains accessible:
- Agenda;
- Finalists;
- Judges;
- future sponsor/menu content;
- other non-gated event information.

The Check-In card must **not** allow ordinary guest entry into a flow that can complete Check-In.

Show useful copy instead, based on state. Example for a scheduled future opening:

`Event Check-In`

`Check-In opens Thursday at 4:30 PM ET.`

`You can explore the event information below in the meantime.`

The action should be disabled/replaced with something like `Opens 4:30 PM` rather than an active Check In button.

If manually Closed without a future schedule, use plain non-confusing copy such as `Check-In is not open yet.`

Once open, preserve the currently accepted lookup/self-registration/check-in behavior.

## Safe Pre-Event Testing

Product Owner must be able to test the complete production guest Check-In flow **while public Check-In remains closed**.

Implement the smallest safe reusable mechanism. Acceptable patterns include an authenticated admin/superadmin preview/test action or an explicitly generated admin-only test route/token. The implementation must satisfy all of these:
- does not require publicly opening Check-In;
- ordinary guests with the normal event URL cannot bypass the gate;
- test capability is restricted to authorized admin context;
- Product Owner can exercise lookup, imported registration, self-registration, completion, party-size copy, and Back to Event before opening;
- test behavior is visibly distinguishable enough that an admin understands they are bypassing the public gate;
- do not create a permanent secret URL that can casually leak and bypass production controls.

If existing admin navigation/session context supports a simpler authenticated preview path, prefer it over inventing a new token system.

## Gate Enforcement

Do not enforce availability only by hiding a button.

The guest Check-In route/action itself must enforce effective availability so a guest cannot bypass the home card by navigating directly to `/events/:eventSlug/check-in`.

Any guest-facing RPC/mutation that completes Check-In should also be protected at the appropriate application/server/RPC layer if direct invocation could bypass the UI. Determine the smallest reliable enforcement point(s) based on the existing architecture.

Authorized admin test mode is the only intended bypass.

## Guest-Facing Event Status Badge

Correct the misleading `Live` behavior.

For an active/published event with a complete schedule:
- before start -> `Upcoming`;
- during start/end -> `Live`;
- after end -> `Ended`.

Continue to respect truly unavailable administrative states such as draft/cancelled/completed as appropriate. Do not expose draft events merely because their event time has arrived.

Use the event timezone when calculating temporal state.

## Preserve Accepted Production Behavior

Do not regress:
- untouched Eventbrite CSV preview/import;
- Order ID repeat-import safety;
- party-size model;
- `You and your N guests` confirmation copy;
- `Total guests: N` on success and checked-in home card;
- Check-In count vs Guests Represented count;
- imported registration lookup by name/email;
- self-registration fallback with required email + confirmation;
- configured post-check-in instruction;
- shared-device/iPad no-menu mode;
- Next Guest + 15-second reset;
- personal-device session behavior;
- reusable test-data reset;
- Agenda expanded on home;
- Finalists summary -> detail;
- Judges content;
- reusable guest-event theme;
- digital voting inactive for production i-Pitch;
- SOTC behavior.

## Validation

At minimum:
- active/published event before scheduled start displays **Upcoming**, not Live;
- event during scheduled start/end displays **Live**;
- after scheduled end displays **Ended**;
- calculations respect event timezone;
- Closed mode blocks ordinary guest Check-In while event companion remains available;
- Manual Open allows Check-In;
- Scheduled mode blocks before opening, allows during window, blocks after closing;
- direct navigation to `/check-in` cannot bypass closed state;
- ordinary guest cannot invoke completion through an obvious alternate path while closed;
- authorized admin test/preview path can complete the guest flow while public state is closed;
- admin test bypass does not inadvertently make Check-In public;
- manual Open now / Close now precedence is deterministic and tested;
- accepted Eventbrite party-size guest flow still passes when Check-In is open;
- shared-device reset still works when Check-In is open;
- TypeScript;
- focused tests;
- full test suite;
- production Vite build.

## Product Owner Acceptance — i-Pitch

After deployment:
1. Open normal guest event page before the event window and verify badge says **Upcoming** rather than Live.
2. Configure i-Pitch Check-In to **Scheduled** with the desired September 3 opening/closing times in ET (Product Owner will choose the exact opening time; likely around 4:30 PM).
3. From a normal/incognito guest session, verify the event companion is visible but Check-In is unavailable before opening.
4. Navigate directly to `/events/ipitch-092026/check-in` as an ordinary guest and verify the gate still holds.
5. Use the authorized admin test path and prove the full imported registration/party-size Check-In flow works while public Check-In remains closed.
6. Return to normal/incognito guest view and verify it is still closed.
7. Exercise manual **Open now** and verify ordinary guest Check-In becomes available.
8. Exercise **Close now** and verify it becomes unavailable again without hiding the rest of the event companion.
9. Restore the intended Scheduled production state for September 3.
10. Verify no accepted Eventbrite/party-size/event-content/theme behavior regressed.

Do not leave public Check-In manually open after acceptance testing.

## Handoff

Update this FILE with:
- exact availability storage/model;
- precedence rules for Closed / Manual / Scheduled / override;
- timezone calculation approach;
- guest route/action enforcement points;
- admin test/preview mechanism and authorization boundary;
- guest temporal badge implementation;
- files changed;
- tests/build results;
- any SQL/migration required (prefer none if existing fields/metadata suffice);
- exact i-Pitch admin configuration steps;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark this slice production-ready until ordinary public Check-In can be locked while the event companion remains available and the Product Owner can still perform an authorized pre-event end-to-end test.
