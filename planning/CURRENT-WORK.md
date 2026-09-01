# Current Work

## Current Slice Status

Event Feature management, reusable collection presentation, child-detail routing, prototype child-attached voting, and reusable reset cleanup are implemented and validated.

## Implemented

Admin Event Feature management:
- Existing Event Features now have an **Edit** action in the Admin Event **Setup** tab, reopening the reusable eCe form for existing supported fields and metadata.
- Event Admin/Superadmin can move Event Features with **Up** / **Down** controls. Sort order is persisted through the normal eCe update path and immediately reflected locally.
- Non-managing admins do not see Setup/edit/reorder controls.

Guest presentation modes:
- `metadata.content_list.presentation_mode` now supports:
  - `detail_list`: existing single card -> detail list behavior;
  - `expanded_home`: renders configured items directly on the event home, for short Agenda-style content;
  - `child_cards`: renders configured child cards directly on the event home and links each child to its own detail route.
- Content-list items now support reusable `name`, generated/configured `slug`, `summary`, `description`, and optional image URL.
- Child detail route added: `/events/:eventSlug/content/:eceSlug/:itemSlug`.

Prototype child-attached voting:
- Optional voting metadata can be configured under the content list.
- When voting is disabled/closed, finalist/judge/info content remains visible and vote controls are absent or closed.
- When enabled/open for controlled testing, voting is attached to the individual child detail, requires completed event check-in, shows `2 votes remaining` -> `1 vote remaining` -> `0 votes remaining`, requires explicit **Confirm Vote**, and marks `Your vote`.
- Prototype vote state remains browser-local under `qme:contentVotes:*`; it is not production voting and does not replace Thursday's physical balls.

Reusable reset:
- Admin reset remains Event Admin/Superadmin-only through the existing Admin Event Setup surface.
- Confirmation is now event-specific: type the event slug to continue.
- Reset copy explicitly states imported registration definitions, event setup, features, queues, and staff access are preserved.
- Reset copy also documents that browser-local prototype state on guest devices is not controlled by the server reset.
- Service path remains the existing `reset_event_test_data` RPC; no new SQL was added in this slice.

## i-Pitch Production Position

Digital voting must remain inactive/not visible for production i-Pitch Thursday unless the Product Owner explicitly activates it for controlled testing.

Do not import Eventbrite yet. The multi-ticket rule is still pending from Tricia; do not decide one Order ID equals one attendee and do not invent additional attendee names.

Do not mark i-Pitch readiness done until the Eventbrite multi-ticket rule is settled, the production list is imported, and production guest flow is smoke-tested.

## Files Changed

- `app/src/App.tsx`
- `app/src/lib/contentListConfig.ts`
- `app/src/lib/eceService.ts`
- `app/src/pages/admin/AdminEceForm.tsx`
- `app/src/pages/admin/AdminEventDetail.tsx`
- `app/src/pages/guest/GuestContentList.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/test/adminEceForm.test.tsx`
- `app/src/test/adminEventDetail.test.tsx`
- `app/src/test/contentListConfig.test.ts`
- `app/src/test/eventService.test.ts`
- `app/src/test/guestContentList.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `app/src/test/routing.test.tsx`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\adminEceForm.test.tsx src\test\adminEventDetail.test.tsx src\test\contentListConfig.test.ts src\test\guestContentList.test.tsx src\test\guestEventDetail.test.tsx src\test\eventService.test.ts src\test\routing.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check-event-feature --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

Note: temporary Vite output under `tmp/` is not part of the implementation and was not staged. Windows/Dropbox reported a temporary lock when cleanup was attempted.

## Product Owner Acceptance

1. Admin Event Setup: edit an existing i-Pitch feature without recreating it.
2. Admin Event Setup: move Agenda/Finalists/Judges with **Up** / **Down** and verify guest home order follows the saved sort order.
3. Configure Agenda as `Expanded list on event home` and verify the four schedule lines appear directly on the event home.
4. Configure Finalists as `Child cards on event home` and verify Quantum Fluent, VeeSafe, Vettor, and corVita appear as individual cards.
5. Open an individual finalist and verify full detail content.
6. Verify optional image/icon URL can be edited after creation.
7. Configure Judges with the same child-card pattern if desired.
8. Verify digital voting is inactive/not visible for production i-Pitch.
9. In controlled testing only, enable child voting and verify confirmation, `2 -> 1 -> 0 votes remaining`, `Your vote`, and no voting at zero.
10. Run reusable event reset and verify i-Pitch can be tested again without losing configuration/import definitions.

Implementation commit SHA: this commit.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
