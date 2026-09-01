# Current Work

## Current Slice Status

Child-card rendering cleanup is implemented and validated.

## Implemented

Guest child-card presentation:
- `Name | Summary | Full Detail` now maps to summary on event-home child cards and full detail on the child detail page.
- Existing legacy `Name | Description | image URL` rows remain supported when the third pipe field is clearly an image URL.
- Blank image URLs render no image element, no broken-image alt text, no icon container, and no `*` placeholder for content-list top-level cards, child cards, expanded Agenda-style content, Judges-style collections, or child detail pages.
- Text naturally occupies the available space when no optional image is configured.
- Child detail now has normal spacing above **Back to Event**.

Preserved:
- Existing single card -> detail-list behavior.
- Expanded-on-home presentation for short Agenda-style content.
- Child cards on event home + child detail routing.
- Digital voting remains inactive/not visible unless explicitly enabled in content-list voting metadata.
- Accepted Check-In, shared-mode no-menu kiosk, **Next Guest**, and 15-second auto-reset behavior were not changed.

## i-Pitch Production Position

Digital voting must remain inactive/not visible for production i-Pitch Thursday unless the Product Owner explicitly activates it for controlled testing.

Do not import Eventbrite yet. The multi-ticket rule is still pending from Tricia; do not decide one Order ID equals one attendee and do not invent additional attendee names.

Do not mark i-Pitch readiness done until the Eventbrite multi-ticket rule is settled, the production list is imported, and production guest flow is smoke-tested.

## Files Changed

- `app/src/lib/contentListConfig.ts`
- `app/src/pages/guest/GuestContentList.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/adminEventDetail.test.tsx`
- `app/src/test/contentListConfig.test.ts`
- `app/src/test/guestContentList.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\contentListConfig.test.ts src\test\guestContentList.test.tsx src\test\guestEventDetail.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check-child-cards --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

## Product Owner Acceptance

1. Configure a child-card item as `VeeSafe | Home-card summary only. | Full detail for the child page.`
2. Verify the event home child card shows `Home-card summary only.` and not the full detail.
3. Open the child detail and verify it shows `Full detail for the child page.` and not the summary.
4. Verify blank image URLs produce no image, icon box, broken alt text, or `*` placeholder on Agenda, Finalists/Judges child cards, or child detail.
5. Verify **Back to Event** has normal spacing below child detail content.
6. Verify digital voting is still inactive/not visible for production i-Pitch unless explicitly enabled.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
