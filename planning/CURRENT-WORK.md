# Current Work

## Current Slice Status

Production child-card acceptance regression is fixed and validated.

## Finding

The live `ipitch-092026` event is visible via the anon client. Its **i-Pitch Finalists** eCe is active, uses `child_cards`, and currently has slug `event-content-list`.

Live metadata exposed the real failure path: the prior Admin eCe save had persisted each three-field row as:
- `summary`: short summary;
- `description`: short summary again;
- `imageUrl`: full detail paragraph.

That made the guest home show a broken image because the full paragraph was treated as an image URL, and made child detail show the summary because the full detail was not in `description`.

## Implemented

- `Name | Summary | Full Detail` is now unambiguous with exactly three fields:
  - field 1 -> name;
  - field 2 -> summary for home child cards;
  - field 3 -> full detail/description for child detail;
  - field 4 -> optional image URL.
- Legacy `Name | Description | image URL` compatibility remains only when the third field clearly looks like an image URL.
- Existing mis-saved rows with a non-URL `imageUrl` paragraph are recovered at read time: the paragraph becomes full detail and no image is rendered.
- Optional images are genuinely optional for configured content collections: no image element, broken alt text, icon box, or `*` placeholder is rendered when no usable image URL exists.
- Child detail keeps normal spacing above **Back to Event**.

Preserved:
- Home child cards continue to use summary.
- Child detail route continues to use `/events/:eventSlug/content/:eceSlug/:itemSlug`.
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
- `app/src/test/contentChildCardsAdminIntegration.test.tsx`
- `app/src/test/contentListConfig.test.ts`
- `app/src/test/guestContentList.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- Read-only live Supabase check of `ipitch-092026` / active finalist eCe metadata; confirmed the mis-saved `imageUrl` full-detail shape described above.
- `npx tsc -b`
- `npx vitest run src\test\contentChildCardsAdminIntegration.test.tsx src\test\contentListConfig.test.ts src\test\guestContentList.test.tsx src\test\guestEventDetail.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check-child-cards-actual --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

## Product Owner Acceptance

1. Open the i-Pitch event home and verify each finalist child card shows its short summary with no broken image/alt text/placeholder.
2. Open a finalist child detail and verify the full paragraph appears, not the short summary.
3. Verify no image element appears on child detail when no image URL is configured.
4. Verify **Back to Event** spacing on child detail.
5. Keep digital voting inactive/not visible for production i-Pitch unless explicitly enabled for controlled testing.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
