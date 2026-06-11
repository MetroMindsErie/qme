# Pre-Multi-Org Cleanup Pass

Updated: 2026-06-11

## Fixed In This Pass

- Admins can now upgrade a completed event check-in from `general` to `flowers`.
- This lets the Peony Festival demo recover when a guest was checked in as general admission but should have Festival + Flowers access.
- The guest's existing browser identity remains valid because the same `event_check_ins` row is updated.

## Verified

- TypeScript compile passed.
- ESLint passed.
- Vitest suite passed.
- Vite production bundle passed with `--emptyOutDir false`.

## Intentionally Kept For Now

- The app shell is still guarded to the Peony Festival demo slug.
- Peony-specific guest content remains in `GuestEventDetail`.
- Bouquet Bar access is still a Peony-specific rule tied to `wrapped-bouquets` and `flowers`.
- These should remain stable until the multi-organization and multi-event foundation is ready.

## Carry Forward

- Preserve Peony Festival as a demonstrable event while adding organizations.
- Assign Peony Festival to a demo/test organization during the multi-org migration.
- Generalize special access from `flowers` into a broader guest access/tag model after the foundation is in place.
- Model SOTC photo access separately from Peony bouquet access. SOTC will need state changes such as eligible, used, student-used, or professional-used rather than a simple bouquet upgrade.
- Keep documenting local Windows/Dropbox build-folder locks separately from app compile failures.
