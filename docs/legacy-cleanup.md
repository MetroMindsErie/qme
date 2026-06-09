# Legacy Cleanup Inventory

This file tracks legacy/prototype code that is not part of the current event/queue-scoped web flow.

## Current Active Web Path

- Router: `app/src/App.tsx`
- Admin event/queue pages: `app/src/pages/admin/*`
- Guest event/check-in/ticket pages: `app/src/pages/guest/GuestEventDetail.tsx`, `GuestEventCheckIn.tsx`, `GuestQueueTicket.tsx`
- Kiosk display: `app/src/pages/demo/KioskDisplay.tsx`
- Supabase services: `app/src/lib/eventService.ts`, `queueService.ts`, `checkInService.ts`
- Queue ticket browser persistence: `app/src/hooks/useQueueTicket.ts`
- Per-queue now-serving state: `app/src/hooks/useQueueMetric.ts`

## Removed Legacy Code

Removed in this cleanup pass:

- `server.js` - old Express/static demo API with in-memory state and JSON persistence.
- root `package.json` server dependency and `node server.js` start script.
- `app/src/lib/supabaseService.ts` - old global/single-queue Supabase API compatibility layer.
- `app/src/hooks/useTicket.ts` - old global/single-queue ticket hook.
- `app/src/hooks/useMetric1.ts` - old global `settings.metric1` now-serving hook.
- `app/src/pages/AdminDashboard.tsx` - old global admin dashboard.
- `app/src/pages/GuestSingleView.tsx` - old global guest landing page.
- `app/src/pages/GuestQueueTicket.tsx` - old global guest ticket page.
- Tests for the old global flow:
  - `app/src/test/AdminDashboard.test.tsx`
  - `app/src/test/GuestSingleView.test.tsx`
  - `app/src/test/GuestQueueTicket.test.tsx`
  - `app/src/test/supabaseService.test.ts`
  - `app/src/test/useMetric1.test.ts`
  - `app/src/test/useTicket.test.ts`
- `figma_make_output/` tracked files - generated prototype/reference app with mock data. A Windows/Dropbox lock may leave empty directories behind locally until released.

## Watch Items

- `app/src/pages/guest/GuestQueueLanding.tsx` is currently bypassed by `DemoQueueSkip` in `App.tsx`, but it is a queue-scoped page and may still be useful later.
- `app/src/pages/guest/GuestEventList.tsx` is not currently routed by `App.tsx`.
- `app/src/test/routing.test.tsx` has been updated to match the current demo-focused router.

## Verification Notes

- `npm test` currently fails before tests execute because Vitest/jsdom hits an ESM compatibility error in `html-encoding-sniffer` requiring `@exodus/bytes/encoding-lite.js`.
- Until the test runner is repaired, use `npm run build` as the primary local verification signal.
