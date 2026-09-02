# Current Work

## Current Slice

Polish the production i-Pitch event/check-in experience around two concrete issues discovered during acceptance:

1. focused event guest/admin workflows should not show the global hamburger menu;
2. shared-device Check-In already has a dedicated URL/mode and reset behavior, but needs shared-device-specific copy and tablet presentation for the front-table iPad.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Do not broaden into a general navigation redesign or a new kiosk platform.

The previous Check-In availability/admin-test slice is complete and pushed as `e68d1fb`. Preserve it.

## Production Context

Event:
- University of Akron Research Foundation
- i-Pitch - September, 2026
- slug `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET

Accepted production behavior to preserve:
- untouched Eventbrite CSV preview/import;
- Order ID repeat-import safety;
- party-size handling and `Total guests`;
- separate `Checked In` and `Guests Represented` counts;
- Auto Check-In plus self-registration fallback;
- configurable Closed / Open manually / Scheduled availability;
- authenticated `adminTest=1` bypass only for admins who can manage the event;
- Upcoming / Live / Ended guest event state;
- guest event theme;
- Agenda / Finalists / Judges content;
- digital voting inactive for i-Pitch;
- shared-device Next Guest / 15-second reset behavior.

## Part A — Remove Hamburger From Focused Event Workflows

Product direction: once a user is inside an event-focused workflow, navigation should come from the event workflow itself rather than the global hamburger menu.

Remove/hide the hamburger menu from the focused event surfaces below, provided each page retains an explicit safe navigation path such as Back to Event / Back / tabs/buttons already present.

### Guest event surfaces
At minimum:
- `/events/:eventSlug` event companion;
- `/events/:eventSlug/check-in`;
- guest event content/detail pages reached from the event companion;
- shared-device Check-In.

The shared-device route must not expose the hamburger/menu because the iPad will be physically locked to qME with iOS Guided Access.

### Admin event surfaces
At minimum:
- Admin Event detail;
- Admin Event Check-In tabs/settings/history/live view;
- Edit Event while entered from an event context;
- Edit/Add event eCe/content screens where the existing event/back navigation is sufficient.

Do **not** delete the global Header/menu component or remove it from unrelated qME/admin areas. This is scoped event-workflow presentation, not a platform-wide navigation rewrite.

Verify no page becomes a dead end after hiding the menu.

## Part B — Dedicated Shared-Device URL

The existing shared-device mode is the intended front-table iPad path and must remain supported:

`/events/:eventSlug/check-in?mode=shared`

Alias `shared=1` may remain supported if already present, but `mode=shared` is the documented/primary URL.

For pre-event authenticated testing while public Check-In is closed/scheduled:

`/events/:eventSlug/check-in?mode=shared&adminTest=1`

The admin-test bypass remains permission-gated exactly as implemented in the prior slice; copying the URL must not grant an ordinary guest the bypass.

Shared mode must preserve:
- Next Guest behavior;
- automatic reset after 15 seconds following a completed shared-device guest session;
- clearing the prior guest/session from the shared device;
- no hamburger/menu.

## Part C — Shared-Device Copy

The current generic copy `Find your registration to self check in.` is written for a guest on their own phone and is not appropriate for the front-table shared iPad.

When `mode=shared`, use shared-device-specific copy such as:

**Event Check-In**

`Enter your name or email to find your registration.`

Keep the existing `Find your registration` field heading/search behavior unless there is a strong accessibility/duplication reason to refine it.

The goal is to tell the person standing at the check-in table what to do, not describe a personal-device self-check-in journey.

Do not change the approved post-check-in i-Pitch fulfillment instruction:

`Please go to the check-in desk by the front entrance, show this check-in confirmation, and receive your evening's event package.`

## Part D — Hide Recovery Phone on Shared Device

Do not show the optional Recovery phone field/helper text in `mode=shared`.

Reason:
- it adds friction to a communal front-table device;
- the shared device should be optimized for rapid lookup/check-in;
- recovery-phone product purpose remains a separate future backlog decision;
- ordinary personal-device behavior should remain unchanged in this slice.

Ensure shared-device lookup, imported-registration claim, self-registration fallback, and reset flows continue to work without the visible phone field.

## Part E — Tablet / iPad Shared-Device Layout

The current shared-device Check-In renders like a narrow phone card floating in a large iPad viewport, with substantial unused space.

For `mode=shared` only, create a tablet/kiosk presentation that uses the viewport more effectively while remaining visually contained and consistent with qME/i-Pitch theming.

Desired behavior:
- substantially reduce unnecessary top whitespace;
- allow a wider content/card width appropriate for an iPad in portrait or landscape;
- use the available viewport height more naturally;
- keep forms readable rather than stretching controls edge-to-edge across the entire screen;
- retain generous touch targets;
- preserve the i-Pitch theme accents and existing semantic success/error colors;
- remain responsive on common tablet widths and avoid breaking phone guest Check-In.

Do not hard-code one exact iPad pixel dimension. Use shared-mode responsive CSS/layout.

The Product Owner's acceptance reference is the actual iPad/table setup, not desktop emulation alone.

## Part F — Relationship to Check-In Availability

Preserve the previous availability model:
- event companion may be public while Check-In is Closed/Scheduled;
- ordinary shared-device URL obeys public Check-In availability;
- authenticated `mode=shared&adminTest=1` can be used before the event for authorized testing;
- scheduled/manual/closed state remains enforced by the service layer, not only presentation.

Do not weaken or bypass availability enforcement to make shared mode easier.

## Validation

At minimum:
- TypeScript;
- focused GuestEventCheckIn tests for shared-mode copy, hidden Recovery phone, no menu, reset behavior, and admin-test compatibility;
- guest event/detail tests proving focused guest event pages no longer render hamburger navigation and retain Back/Event paths;
- admin event/check-in/form/eCe tests as appropriate proving focused admin pages no longer render hamburger navigation and retain explicit navigation;
- phone/personal guest Check-In remains unchanged where intended;
- shared URL without admin permission still obeys closed/scheduled availability;
- shared + authenticated adminTest still bypasses availability exactly as prior slice;
- full test suite;
- production Vite build.

## Product Owner Acceptance

After deployment:

1. Open normal guest event companion on phone and confirm no hamburger appears; event content/navigation still works.
2. Open normal personal-device Check-In and confirm no hamburger appears and normal personal copy/recovery behavior remains otherwise unchanged.
3. Open front-table shared URL:
   `/events/ipitch-092026/check-in?mode=shared`
4. On the actual iPad, confirm:
   - no hamburger;
   - shared-device copy says to enter name/email;
   - Recovery phone is absent;
   - layout uses the tablet screen substantially better than the previous narrow centered phone card;
   - search/imported registration/self-registration can be completed normally when Check-In is open.
5. Complete one shared-device Check-In and confirm Next Guest + automatic 15-second reset still clears the device for the next person.
6. While public Check-In is closed/scheduled, verify ordinary shared URL is blocked and authenticated:
   `/events/ipitch-092026/check-in?mode=shared&adminTest=1`
   still supports authorized testing.
7. Inspect Admin Event, Admin Check-In, Edit Event, and event eCe/content setup flows and confirm hamburger is gone but explicit Back/Event navigation prevents dead ends.
8. Re-smoke Eventbrite party-size confirmation, Total guests, Guests Represented, Agenda, Finalists, Judges, and theme.

## Handoff

Update this FILE with:
- exact guest/admin event surfaces where hamburger was removed;
- documented shared-device URL(s);
- shared-device copy/layout behavior;
- confirmation Recovery phone is hidden only in shared mode;
- files changed;
- tests/build results;
- any navigation dead-end issue found/resolved;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark the slice accepted until the shared-device presentation is visually checked on the actual iPad.
