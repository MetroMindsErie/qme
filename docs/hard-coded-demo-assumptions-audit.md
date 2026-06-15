# Hard-Coded Demo Assumptions Audit

Date: 2026-06-15

Purpose: identify hard-coded Peony/demo assumptions before the multi-organization foundation work starts. This document is an inventory only. Removal and generalization should happen in separate, tested steps so the Peony Festival demo remains stable.

## Summary

The current app is intentionally still a Peony Festival demo shell. The main product risk is not that these assumptions exist; the risk is forgetting where they are and building the multi-organization foundation around them as if they were generic product rules.

The biggest assumptions are:

- Guest routes are guarded to one event slug: `peony-festival`.
- The public event page mixes database queues with hard-coded Peony activity cards, menus, festival notices, vendor information, and static images.
- Bouquet Bar access is a special rule tied to queue slug `wrapped-bouquets` and check-in `ticket_type = flowers`.
- Event check-in still uses Peony-specific access labels: `general` and `flowers`.
- Admin queue dashboard has a Bouquet-specific Festival + Flowers panel.
- Static image paths are embedded throughout the guest/admin/demo UI.
- Browser persistence and `fresh=1` are demo-support tools and should be treated carefully.

## Classification Key

- **Keep for demo**: leave in place until Peony has been migrated safely into the new foundation.
- **Migrate to data**: should become organization/event/experience/queue/asset data.
- **Generalize soon**: should become a reusable product concept before SOTC and multi-org work depends on it.
- **Remove later**: cleanup once replacement behavior exists.

## Audit

| Area | Location | Hard-coded assumption | Classification | Peony safety note | Future direction |
| --- | --- | --- | --- | --- | --- |
| App routing | `app/src/App.tsx` | `DEMO_EVENT = 'peony-festival'`; `/`, `/demo`, `/events/:eventSlug`, check-in, and queue ticket routes all funnel to Peony. | Keep for demo, then generalize soon | Do not remove until Peony works as an organization-owned event and old QR/demo links are accounted for. | Route public event pages by database event slug, not a single demo constant. |
| Non-demo route behavior | `app/src/App.tsx` | Any non-Peony event slug redirects back to `/demo`. | Remove later | This protects the demo now, but will block SOTC public URLs. | Replace with real event lookup and an event-not-found page. |
| Old comments | `app/src/App.tsx`, `app/src/pages/guest/GuestEventDetail.tsx`, routing tests | Comments still refer to I-Pitch/ipitch even though current demo is Peony. | Remove later | Low behavioral risk. | Clean comments when routing is generalized. |
| Guest event content | `app/src/pages/guest/GuestEventDetail.tsx` | Peony static activity cards: Pick Your Own Peonies, Live Music, Vendor Market, Photo Ops, Festival Notices. | Migrate to data | Keep visible for tomorrow's Peony demo. | Model as event experiences/cards with sort order, content, image assets, and optional menus. |
| Static menus | `app/src/pages/guest/GuestEventDetail.tsx` | Detailed Peony menu content, vendor list, festival notices, host copy, weather notes, bouquet pricing, and field-pick details are in TypeScript. | Migrate to data | Do not rewrite until the event/experience model can represent this content. | Move to event experience records and/or content blocks. |
| DB experiences disabled | `app/src/pages/guest/GuestEventDetail.tsx` | `SHOW_DB_EXPERIENCES = false`; `SHOW_STATIC_ACTIVITIES = true`. | Generalize soon | These toggles keep the known demo layout stable. | Replace toggles with database-driven event page composition. |
| Bouquet queue visibility | `app/src/pages/guest/GuestEventDetail.tsx` | Queues with slug `wrapped-bouquets` are hidden unless event check-in `ticket_type` is `flowers`. | Generalize soon | Preserve this exact behavior until a generic eligibility model passes Peony tests. | Use queue eligibility rules based on guest event attributes/tags/statuses. |
| Bouquet queue display name | `app/src/pages/guest/GuestEventDetail.tsx` | Queue slug `wrapped-bouquets` displays as "Bouquet Bar." | Migrate to data | Safe to keep while Peony data catches up. | Store guest-facing queue label in queue data. |
| Bouquet queue copy | `app/src/pages/guest/GuestEventDetail.tsx`, `GuestQueueLanding.tsx`, `GuestQueueTicket.tsx` | Copy references Bouquet Bar, Festival + Flowers, mobile bar, bouquet team, and flowers ticket access. | Migrate to data | Messaging was recently tested and should remain stable. | Store no-access and eligible-access messaging per queue/eligibility rule. |
| Bouquet access type | `app/src/pages/guest/GuestQueueLanding.tsx`, `GuestQueueTicket.tsx` | `BouquetAccess = 'none' | 'checked-in' | 'general' | 'flowers'`. | Generalize soon | This is the working Peony access model. | Replace with generic event guest states/attributes, e.g. SOTC photo eligibility states. |
| Ticket claim guard | `app/src/pages/guest/GuestQueueTicket.tsx` | Ticket claim is blocked if queue slug is `wrapped-bouquets` and access is not `flowers`. | Generalize soon | Preserve until queue eligibility rules exist. | Enforce eligibility through queue rules rather than queue slug checks. |
| Event check-in access | `app/src/pages/admin/AdminEventCheckIns.tsx` | Staff/admin buttons are `General` and `Flowers`; completed guests can be upgraded to `flowers`. | Generalize soon | Useful Peony recovery tool; do not remove before generic guest eligibility exists. | Event-specific eligibility/status assignment, role-restricted and audit logged. |
| Event check-in labels | `app/src/pages/admin/AdminEventCheckIns.tsx`, `GuestEventCheckIn.tsx` | Labels such as "Mobile Bar Check-In," "Festival + Flowers Access," and "Bouquet Bar Ready." | Migrate to data | Preserve for Peony. | Event/station configuration should provide check-in labels and completion messaging. |
| Ticket type domain | `app/src/types/index.ts` | `ticket_type` is typed as `'general' | 'flowers' | null`. | Generalize soon | Existing Supabase data depends on these values. | Replace or supplement with event guest attributes/status records. |
| Admin Bouquet panel | `app/src/pages/admin/AdminQueueDashboard.tsx` | If queue slug is `wrapped-bouquets`, show "Flowers Check-Ins" list filtered by `ticket_type = flowers`. | Generalize soon | Useful for Peony operations/demo. | Service-provider/station consoles should show eligible/checked-in guests based on configured eligibility rules. |
| Queue operation controls | `app/src/pages/admin/AdminQueueDashboard.tsx` | Now-serving dashboard is generic enough, but reset and now-serving controls are unauthenticated and not role-scoped yet. | Generalize soon | Keep for demo but do not treat as production governance. | Add admin identity, role scope, confirmation for sensitive actions, and audit logging. |
| Static images | Many files, especially `GuestEventDetail.tsx`, `GuestQueueLanding.tsx`, `GuestQueueTicket.tsx`, admin pages, `KioskDisplay.tsx` | Images are referenced as `/images/...` paths in code and forms. | Migrate to data | Keep Peony images stable until managed assets exist. | Move event, queue, experience, and organization images into asset/storage records. |
| Kiosk route | `app/src/pages/demo/KioskDisplay.tsx` | Kiosk is still under `pages/demo`; it assumes open kiosk URLs and QR generation from current origin. | Keep for demo, then generalize later | User explicitly deferred kiosk work. | Revisit after event/queue foundation and staff/station model. |
| Browser persistence | `GuestEventDetail.tsx`, `GuestQueueLanding.tsx`, `GuestQueueTicket.tsx`, `useQueueTicket` | Guest check-in and ticket recovery rely on localStorage keys. | Keep for demo, then generalize later | Recent phone testing depends on this behavior. | Longer-term guest identity/recovery model should separate browser identity from reusable qMe guest identity. |
| Fresh reset | `app/src/pages/guest/GuestEventDetail.tsx` | `?fresh=1` clears local check-in and queue tickets for the browser. | Keep for demo | Useful for testing QR flows; does not delete Supabase rows. | Keep as a demo/testing utility or move behind admin/test tooling later. |
| Nuke reset | `app/src/pages/guest/GuestQueueTicket.tsx` | `?nuke=1` clears a queue ticket locally. | Keep for demo, then remove later | Useful for debugging but should not be public production behavior. | Replace with explicit guest leave/recovery tools. |
| Planning access code | `planning` and `api/planning-data.js` | Internal planning workspace uses code `3298`. | Out of app foundation scope | This is not a public event product assumption. | Leave until roadmap auth is revisited. |

## Peony Demo Safety Requirements

- Preserve `https://qme-nine.vercel.app/events/peony-festival` during foundation work.
- Preserve Flower Photos and Wrapped Bouquets guest flows until replacement routing and eligibility rules are tested.
- Preserve Bouquet Bar behavior: not checked in -> tell guest to check in; checked in general -> explain no Bouquet access; checked in flowers -> allow queue join.
- Preserve admin ability to check guests in as general or flowers until a generic eligibility/status tool replaces it.
- Preserve current event page cards and images for Peony demos until equivalent data-driven content exists.
- Do not bulk-clean or mutate Peony guest/check-in rows without a reviewed cleanup plan.
- Keep `fresh=1` available for controlled demo testing until a better guest reset/recovery path exists.

## Foundation Implications

Before building SOTC or multi-organization support around this code, the foundation should introduce:

- `organization_id` ownership on events.
- Event-scoped operational guest records.
- A generic event guest eligibility/status model that can represent Peony `flowers` and SOTC photo states.
- Data-driven event page composition for experiences, queues, notices, and service cards.
- Managed asset records for event/experience/queue images.
- Admin identity, role scope, and audit logging before production-like operations.

## Follow-Up Work

- Keep `Migrate Peony Festival into a demo organization without breaking it` as the safety bridge.
- Keep `Remove or generalize hard-coded demo assumptions` as a separate implementation story after the foundation exists.
- Use this audit as the checklist for that future removal/generalization pass.
