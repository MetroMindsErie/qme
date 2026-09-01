# Current Work

## Current Slice Status

Checked-in Event Check-In copy cleanup is implemented and validated.

The guest event-home **CHECKED IN** Event Check-In card now uses the event-configured `metadata.check_in.post_check_in_instruction`, matching the successful Check-In screen behavior. For i-Pitch, that resolves to: `You are checked in. Please go to the check-in desk to receive your event package.`

Events without a configured post-check-in instruction now use a neutral fallback on the checked-in card: `You are checked in. Return to the event page for next steps.`

Shared-device kiosk navigation cleanup remains complete: in guest Check-In shared mode (`?mode=shared` or `?shared=1`), the qMe hamburger/navigation menu is hidden so the kiosk surface contains only the event/check-in experience. Normal personal-device guest pages keep the existing navigation. **Next Guest** and the 15-second shared-device auto-reset are preserved.

Files changed:
- `app/src/lib/eventConfig.ts`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/eventConfig.test.ts`
- `app/src/test/guestEventCheckIn.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `planning/CURRENT-WORK.md`

Validation:
- `npx tsc -b` passed
- `npx vitest run src\test\eventConfig.test.ts src\test\guestEventDetail.test.tsx src\test\guestEventCheckIn.test.tsx src\test\components.test.tsx` passed
- `npx vitest run` passed
- `npx vite build --outDir ..\tmp\vite-build-check-acceptance --emptyOutDir` passed with the existing large chunk warning

Notes:
- The first full `npx vitest run` hit the known slow `guestEventCheckIn` timing edge at the default 5-second per-test timeout; after replacing one slow `userEvent` interaction with `fireEvent`, the full suite passed.
- The older temporary Vite output folder under `tmp/vite-build-check` and the acceptance output folder under `tmp/vite-build-check-acceptance` are not part of the implementation and were not staged. Windows/Dropbox reported them temporarily locked during cleanup.

Acceptance checks:
- i-Pitch checked-in event-home card uses the configured package pickup instruction.
- Events without configured instruction use the neutral fallback, not SOTC-specific copy.
- Shared Check-In URL hides the hamburger/menu.
- Personal Check-In URL still shows the hamburger/menu.
- Shared mode still supports **Next Guest** and auto-reset.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.

## Previous Shared Reset And Finalists Handoff

Bounded shared-device auto-reset and i-Pitch Finalists slice is implemented and validated.

Registration/check-in remains the production must-have. Accepted Check-In mechanics were preserved. No production voting work was continued or enabled.

## Live Production Context

Actual production event:
- organization: **University of Akron Research Foundation**
- event: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- date/time: September 3, 2026, 5:00-8:00 PM ET
- location: Missing Falls Brewery, 540 S Main St., Akron, OH 44311
- logo: `/images/i-pitch.png`

Already accepted:
- actual i-Pitch walk-up self-registration succeeds and Auto checks in;
- event-configured post-check-in instruction displays correctly;
- shared-device mode `/events/ipitch-092026/check-in?mode=shared` works;
- **Next Guest** clears the prior guest and returns to a clean Check-In screen;
- personal-device and shared-device flows both use the same event instruction.

The Eventbrite export is still outstanding. Do not fabricate imported attendees.

## Implemented

Shared-device 15-second auto-reset:
- Applies only when the Check-In URL has `?mode=shared` or `?shared=1`.
- The existing **Next Guest** button remains available for immediate reset.
- Shared-device success now shows `Next guest in 15 seconds...`.
- The countdown invokes the same reset behavior as **Next Guest** after 15 seconds.
- Reset clears the event check-in local record, event guest-session token, event-scoped local vote-allocation records, and in-memory form/search/result state.
- The timer is cleaned up when the success state/component is left before expiry.
- Personal-device check-in does not show a countdown and does not auto-clear identity.

i-Pitch Finalists informational feature:
- Added a reusable content-list eCe metadata reader.
- Added a generic guest content-list route: `/events/:eventSlug/content/:eceSlug`.
- Event-home eCes with `metadata.interaction_mode = "content_list"` open the content-list view.
- The content list is informational content, independent from voting.
- The existing voting prototype remains in code but was not expanded and is not required for Finalists.

Admin/configuration mechanism:
- Added a bounded **Guest Detail List** section to the normal Event eCe Create/Edit form for info/resource/session eCes.
- It stores configuration in existing eCe metadata:
  - `metadata.interaction_mode = "content_list"`
  - `metadata.home_action_label`
  - `metadata.content_list.enabled`
  - `metadata.content_list.title`
  - `metadata.content_list.items`
- Items are configured as one line each: `Name | Description | optional image URL`.
- No SQL/schema change is required.

## Exact Admin Steps For i-Pitch Finalists

1. Open the University of Akron Research Foundation organization.
2. If no reusable content/info expie exists yet, create an Expie such as:
   - name: `Event Content List`
   - slug: `event-content-list`
   - type: `Info`
   - status: `Active`
3. Open the `ipitch-092026` event and add an eCe from that expie.
4. Set:
   - eCe Name: `i-Pitch Finalists`
   - Slug: `ipitch-finalists`
   - Type: `Info`
   - Status: `Active`
   - Sort: desired home order
   - Description: `Meet tonight's four finalists.`
5. In **Guest Detail List**, enable `Open this eCe as a guest-facing list`.
6. Set Detail View Title: `i-Pitch Finalists`.
7. Set Card Action Label: `Open`.
8. Paste these List Items:

```text
VeeSafe | VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.
Quantum Fluent | Technical leaders and developers often struggle to find content that is both easy to understand and technically useful. Quantum Fluent helps them move forward with clear executive summaries for decision-makers and practical, hands-on technical content for builders.
Vettor | What if you walked into the dealership already knowing more than the salesperson? Vettor is the AI powered car-buying advocate in your pocket. Snap a photo of any offer and in seconds see every hidden fee, plus a deal score that shows exactly how your price stacks up against what real buyers actually paid. No more guessing. Know the price, skip the haggle, and save thousands.
corVita | corVita is a medical device startup developing corConnect, a universal adapter designed to improve compatibility between AED and defibrillator electrode pads. By reducing equipment-change delays during cardiac emergencies, corConnect aims to support faster, more seamless continuity of care from EMS arrival through hospital treatment.
```

## Files Changed

- `app/src/lib/contentListConfig.ts`
- `app/src/pages/guest/GuestContentList.tsx`
- `app/src/App.tsx`
- `app/src/pages/admin/AdminEceForm.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/contentListConfig.test.ts`
- `app/src/test/guestContentList.test.tsx`
- `app/src/test/guestEventCheckIn.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `app/src/test/routing.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\guestEventCheckIn.test.tsx src\test\contentListConfig.test.ts src\test\guestContentList.test.tsx src\test\guestEventDetail.test.tsx src\test\routing.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

## Product Owner Acceptance Steps

1. Shared mode: check in a test guest at `/events/ipitch-092026/check-in?mode=shared`; leave the success screen untouched and verify visible countdown plus automatic clean reset at about 15 seconds.
2. Shared mode: repeat and press **Next Guest** before expiry; verify immediate clean reset and no later stray timer behavior.
3. Personal mode: check in from `/events/ipitch-092026/check-in`; verify the guest remains identified and is not automatically cleared.
4. Use the normal admin steps above to add/verify **i-Pitch Finalists** on `ipitch-092026`.
5. Guest event home: verify `i-Pitch Finalists - Meet tonight's four finalists.` appears independently of voting.
6. Open Finalists and verify VeeSafe, Quantum Fluent, Vettor, and corVita with supplied descriptions.
7. Confirm no production voting feature was unintentionally enabled.

## Remaining Acceptance Position

Do not mark i-Pitch readiness done until the real Eventbrite export is imported and production smoke-tested.

Do not mark voting production-ready.

Implementation commit SHA: `c1f6a4c`.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
