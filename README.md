# qME

Current qME development is centered on the React/Supabase apps:

- `app/` - Vite + React web app for the current demo, guest queue flow, kiosk display, and admin event/queue operations.
- `mobile/` - Expo/React Native app scaffold using Supabase Auth and profiles.
- `app/supabase-event-check-ins.sql` - local SQL migration for event-level named check-ins.

The active web app talks directly to Supabase through `@supabase/supabase-js`. Event and queue CRUD live in `app/src/lib/eventService.ts` and `app/src/lib/queueService.ts`; guest ticket persistence lives in `app/src/hooks/useQueueTicket.ts`.

## Web App

```powershell
cd app
npm install
npm run dev
```

Important routes:

- `/demo` - current demo entry point.
- `/events/:eventSlug` - guest event detail.
- `/events/:eventSlug/check-in` - event-level guest check-in.
- `/events/:eventSlug/q/:queueSlug/ticket` - queue ticket claim/view.
- `/kiosk/:eventSlug/:queueSlug` - kiosk QR/display.
- `/admin/events` - admin event list.
- `/admin/events/:eventId/queues/:queueId` - admin queue dashboard.

## Mobile App

```powershell
cd mobile
npm install
npm start
```

The mobile app uses Expo Router, Supabase Auth, and a `profiles` table.

## Legacy Code

This repository still contains generated Figma prototype output from an earlier design phase. See `docs/legacy-cleanup.md` for the current cleanup inventory.
