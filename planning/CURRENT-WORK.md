# Current Work

## Current Slice

Reusable guest-event theming is implemented for the bounded "qME owns the UX; the event supplies the skin" slice.

No schema migration is required. Theme configuration lives in existing `events.metadata`.

## Theme Metadata Shape

Event theme metadata is optional:

```json
{
  "guest_theme": {
    "primary_accent": "#4B2E83",
    "secondary_accent": "#2563EB",
    "highlight_accent": "#F59E0B",
    "header_image_url": "/images/optional-approved-banner.jpg"
  }
}
```

Color values are applied only when they are valid 3- or 6-digit hex colors. Invalid/missing colors fall back safely. Header/banner image URLs render only when they are relative paths or `http`/`https` URLs.

Unthemed events do not receive the themed wrapper class or CSS variables, so the existing/default qME guest event look remains intact.

## Admin Path

Normal event admin now includes a `Guest Event Theme` section on Edit/Create Event:
- Primary Accent
- Secondary Accent
- Highlight
- Optional Header/Banner Image URL

This is event-level configuration only. Organization administration was not broadened.

## Guest Surfaces Affected

The theme is applied selectively to guest-facing companion surfaces:
- `/events/:eventSlug` event home header, section header, section title accents, non-semantic home links/actions, and restrained hover accents.
- `/events/:eventSlug/check-in` scoped header/headline accent treatment.

Semantic/status colors are preserved:
- checked-in/success remains green;
- waiting/warning/error/removal messaging remains in the existing semantic color paths;
- the CHECKED IN badge keeps `ed-badge-active`.

Production-accepted Check-In/import behavior was preserved, including Eventbrite preview/import, party-size copy/counts, shared-device no-menu mode, Next Guest, 15-second reset, post-check-in instructions, child-card summary/full-detail behavior, and inactive production voting.

## Recommended i-Pitch Values

Configure `ipitch-092026` through normal admin after the automated deployment from `main`:
- Primary Accent: `#4B2E83`
- Secondary Accent: `#2563EB`
- Highlight: `#F59E0B`
- Optional Header/Banner Image URL: leave blank unless an already-approved banner/program image URL is available.

These are approximate values chosen to align with the i-Pitch/UARF program/sign direction. They are not asserted as official UARF brand standards and can be adjusted by the Product Owner in admin after deployment.

## Files Changed

- `app/src/lib/eventTheme.ts`
- `app/src/pages/admin/AdminEventForm.tsx`
- `app/src/pages/guest/GuestEventDetail.tsx`
- `app/src/pages/guest/GuestEventCheckIn.tsx`
- `app/src/styles/eventDetail.css`
- `app/src/styles/guest.css`
- `app/src/test/eventTheme.test.ts`
- `app/src/test/adminEventForm.test.tsx`
- `app/src/test/guestEventDetail.test.tsx`
- `app/src/test/guestEventCheckIn.test.tsx`

## Validation

Passed locally:
- `npx tsc -b`
- `npx vitest run src/test/eventTheme.test.ts src/test/guestEventDetail.test.tsx src/test/guestEventCheckIn.test.tsx src/test/adminEventForm.test.tsx --testTimeout 30000`
- `npx vitest run --testTimeout 30000` - 23 files / 175 tests passed.
- `npx vite build --outDir ..\tmp\vite-build-check-event-theme --emptyOutDir`

Vite reported the existing large-chunk warning only.

## Product Owner Acceptance

1. Open admin Edit Event for `ipitch-092026`.
2. Set the `Guest Event Theme` fields to the recommended i-Pitch values above.
3. Save the event.
4. Open `/events/ipitch-092026` on a phone-sized viewport and verify the header and event sections feel i-Pitch-branded while remaining qME.
5. Open `/events/ipitch-092026/check-in` and verify the same restrained accent direction appears.
6. Verify CHECKED IN remains semantic green and errors/warnings retain their existing semantic colors.
7. Verify Check-In, Eventbrite-imported party-size confirmation, Agenda, Finalists child details, Judges content, shared-device reset, and Back to Event still behave as accepted.
8. Verify an unthemed event still renders the prior/default qME look.

## Status

Implementation and local validation are complete. Commit/push to `main` is next.
