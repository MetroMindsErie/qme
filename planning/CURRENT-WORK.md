# Current Work

## Current Slice Status

Superadmin organization creation is implemented and validated.

Added `+ New Organization` to the Superadmin Organizations screen only. Superadmins can create an organization with Name, Slug, Description, and Status. The existing organization model supports `active`, `inactive`, and `archived`, so the create form exposes `active` and `inactive` for a bounded create path rather than inventing `draft`.

After creation, the new organization is inserted through the existing `createOrganization` service, appended to the Organizations list, and will be returned by the existing `listOrganizations()` call used by the Create Event Organization dropdown. Non-superadmin organization admins still see only organizations they manage and do not see the create control.

Files changed:
- `app/src/pages/admin/AdminOrganizationList.tsx`
- `app/src/test/adminOrganizationList.test.tsx`
- `planning/CURRENT-WORK.md`

Validation:
- `npx tsc -b` passed
- `npx vitest run src\test\adminOrganizationList.test.tsx src\test\routing.test.tsx` passed
- `npx vitest run` passed on rerun; first full run had one `guestEventCheckIn` timeout while the Vite build was running in parallel
- `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir` passed with the existing large chunk warning

Implementation commit SHA: `6a46f75`.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.

## Previous i-Pitch Handoff

## Current Slice Status

The i-Pitch registration/check-in and bounded voting prototype slice is implemented locally and ready for Product Owner review after the required production SQL/admin setup is applied.

Priority guardrail preserved: the accepted generic registration/check-in behavior was not changed. The new voting work is additive and is gated behind a completed event check-in.

## Actual i-Pitch Event Setup

Production read check found no live `ipitch-2026` event through the available browser/app credential. Attempting to create it with the available anon credential returned `401`, so Steve did not mutate production directly.

Prepared setup script:
- `supabase-ipitch-2026-event-setup.sql`

The script creates or updates:
- event slug: `ipitch-2026`
- guest event link: `/events/ipitch-2026`
- guest check-in link: `/events/ipitch-2026/check-in`
- Check-In Mode: Auto
- imported registration lookup: enabled
- unlisted self-registration fallback: enabled
- self-registration email: required
- completed check-in required for participation
- voting eCe slug/link: `/events/ipitch-2026/vote/ipitch-voting`

Manual/authenticated production action still required before the Kelly/Tricia demo: run `supabase-ipitch-2026-event-setup.sql` from an authenticated event/organization admin or superadmin DB context, or create the same event/eCe through an admin account with write access.

Eventbrite export status: not received. Do not invent or fake attendee data. When the real file arrives, import rows into `event_imported_registrations` for the `ipitch-2026` event using the existing imported-registration table/RPC flow; map at minimum first name, last name, and email where present. The guest QR/direct link should point to `/events/ipitch-2026`; guests can then find imported registration or self-register if unlisted.

## Voting Prototype Status

Implemented a reusable vote-allocation metadata reader for eCes:
- interaction mode: `vote_allocation`
- voting state: open/closed
- result visibility: hidden/visible
- credit limit: configurable, i-Pitch uses 2
- choices: configured in eCe metadata

Implemented a guest voting page prototype:
- available only after completed event check-in
- lets a checked-in guest allocate 2 digital balls across configured choices
- supports putting both balls on one choice or splitting 1 + 1
- supports reallocation while voting is open
- locks controls when voting is closed
- always shows the guest their own allocation
- hides aggregate results while results are hidden
- includes a simple glass-cylinder reveal visualization when results are visible

Prototype-only limits:
- votes are stored in browser `localStorage`, scoped to event/eCe/check-in
- aggregate totals are not persisted server-side yet
- admin open/closed and hidden/visible controls are display/status only via eCe metadata, not editable controls in this slice
- admin aggregate totals are not implemented

## Files Changed

- `app/src/lib/votingConfig.ts`
- `app/src/pages/guest/GuestVoteAllocation.tsx`
- `app/src/App.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/pages/admin/AdminEventDetail.tsx`
- `app/src/test/routing.test.tsx`
- `app/src/test/votingConfig.test.ts`
- `supabase-ipitch-2026-event-setup.sql`
- `planning/CURRENT-WORK.md`

## Validation

Passed:
- `npx tsc -b`
- `npx vitest run src\test\votingConfig.test.ts src\test\routing.test.tsx src\test\guestEventDetail.test.tsx`
- `npx vitest run`
- `npx vite build --outDir ..\tmp\vite-build-check --emptyOutDir`

Vite emitted the existing large chunk warning; build completed successfully.

## Demo Steps

1. Apply `supabase-ipitch-2026-event-setup.sql` with authenticated production write access.
2. Open `/events/ipitch-2026` on mobile or desktop.
3. Use `/events/ipitch-2026/check-in` to demo imported-registration lookup explanation and unlisted self-registration fallback.
4. After a completed check-in, open `/events/ipitch-2026/vote/ipitch-voting`.
5. Allocate two balls among VeeSafe, Quantum Fluent, Vettor, and corVita.
6. To demonstrate open/closed or hidden/visible, update the voting eCe metadata fields `voting.state` and `voting.results_visibility`.

## Remaining Acceptance Position

Do not mark i-Pitch readiness done until the real Eventbrite export is imported and the production guest flow is smoke-tested.

Do not mark voting production-ready until Product Owner live acceptance and a server-side persistence/admin-control pass are explicitly authorized.

Implementation commit SHA: `2c4633d`.

Final pushed SHA is reported in the completion summary; it cannot be embedded in the same commit that defines it.
