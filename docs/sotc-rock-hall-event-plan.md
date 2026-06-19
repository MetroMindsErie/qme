# SOTC Rock Hall Event Plan

Updated: 2026-06-19

## Event Anchor

Organization: Summer on the Cuyahoga

Event: SOTC Rock Hall Mixer

Date: 2026-07-22

Venue: Rock and Roll Hall of Fame and Museum

Purpose: use a real event to move qME from the Peony Festival demo toward a multi-organization, multi-event product without overbuilding the first SOTC slice.

## Product Goal

Model SOTC as a real organization-owned event that can include multiple event experiences, while preserving Peony Festival as the working demo.

The first SOTC plan should be broad but thin: represent the event structure and major experiences first, then choose which interactions become real for the July MVP.

## Foundation Dependencies

Before building the SOTC event deeply, qME needs:

- Governance principles for superadmin, organization admin, and staff.
- Image ownership decisions for organization, event, experience, sponsor, resource, and gallery images.
- Audit of hard-coded Peony/demo assumptions.
- Clean guest/check-in demo data.
- Organizations table.
- Peony Festival migrated into a demo organization without breaking existing demo URLs.
- Summer on the Cuyahoga organization.
- Events attached to organizations.
- Basic event create/edit flow that supports organization ownership.

## Initial SOTC Event Model

The SOTC event should initially include:

- Event name, slug, date, venue, description, status, and image/branding reference.
- Organization owner: Summer on the Cuyahoga.
- Public event page.
- Admin event detail page.
- Event experiences listed as structured records rather than hard-coded UI.
- A path to add queues to selected experiences.

Suggested event slug: `sotc-rock-hall`

The old Trello shorthand `SOTCRH` can remain an internal/project shorthand, but `sotc-rock-hall` is better for public URLs.

## Experience Inventory

### Registration

Type: check-in / information / passport start

Initial treatment:

- Guest can see registration instructions.
- Admin can view expected/checked-in guests later.
- Check-in can kick off passport activity later.

Open question:

Decision:

- Do not import attendees for the first SOTC slice.
- Simulate a guest walking up and giving their name: guest scans a QR code and enters their name.
- Registration staff see guest names in a registration admin console.
- Staff can mark the guest with the right tag/status, including photo access.
- Staff then find the name tag/materials and call the guest's name.
- SOTC staff can continue marking attendance in their own list/system such as Evite outside qME.
- Future attendee import/sync can be revisited later, but it creates more risk than value for the first slice.

### Sponsors

Type: sponsor cards / passport activity

Initial treatment:

- Sponsor cards with name, logo/image, description, and location.
- Passport/activity tie-in remains optional.
- Informational presence in the digital brochure is enough for the first slice.

Open question:

- What do sponsors want to measure or receive?

### Professional Headshots

Type: digital queue / special access

Initial treatment:

- Queue-bearing experience.
- Students can get headshots.
- Professionals may require paid/approved photo access.
- Photo access is assigned at registration/check-in.
- Access should not be modeled as Peony `flowers`; it needs SOTC-specific guest states.

Initial guest states:

- student-photo-eligible
- student-photo-used
- professional-general
- professional-photo-eligible
- professional-photo-used

Secondary tag placeholder:

- The brochure used colored nametag stickers representing different professions.
- qME should leave room for a second tag, either admin-assigned or self-assigned later.
- This may support networking activities in the future.

### Resume Reviews

Type: digital queue / service provider workflow

Initial treatment:

- Queue-bearing experience.
- Guest can join and see status.
- Host/reviewer can call next guest later.

Deferred:

- Resume upload/release flow.
- Reviewer assignment workflow.

### Networking

Type: prompts / future matching

Initial treatment:

- Simple information/prompts only.

Deferred:

- Forced networking.
- Interest matching.
- Beacon/location-based networking.

### Hors D'oeuvres

Type: food information

Initial treatment:

- Food card/list if content is available.

Deferred:

- Dietary filters, allergen matching, and notifications.

### Cocktail Bar

Type: beverage/menu information

Initial treatment:

- Cocktail/mocktail info card if content is available.

### Host and Sponsor Greetings

Type: scheduled gathering / notification

Initial treatment:

- Schedule card.
- Notification behavior deferred unless needed.

### Pop-Up Mini Workshops

Type: scheduled sessions / future signup

Initial treatment:

- Session cards with time, speaker, organization, location, title, and description if available.

Deferred:

- Guest signup.
- Queue coordination around session attendance.

### Galleries and Museum Landmarks

Type: map / points of interest / future activity

Initial treatment:

- Cards for galleries, levels, landmarks, and things to see.

Deferred:

- Scavenger hunt.
- Personalized tours.
- Beacon/location support.

### Mixer Resources

Type: resource cards / digital brochure

Initial treatment:

- Bring the existing mixer resources link into qME as structured resource cards over time.

Reference:

https://sites.google.com/summeronthecuyahoga.com/mixerresourcespage?usp=sharing

## MVP Direction

Use this plan as the working event anchor. The exact July 22 MVP should be decided after the SOTC org/admin/event foundation exists and can be demonstrated to SOTC leaders.

The next step is to make SOTC representable in the system without hard-coding it. Then demo the thin slice to Eric and Tanya and decide what is in the operational July event build.

Likely thin MVP candidates:

- Organization-owned SOTC event.
- Public event page with structured experience cards.
- Headshot queue.
- Resume review queue.
- Mixer resources/digital brochure cards.
- Basic registration/check-in path.
- Registration admin console for name entry/check-in and photo access tagging.

## 2026-06-19 Production Pilot Status

The first live SOTC queue/adventure pilot is working in production at:

- Guest event link: `https://qme-nine.vercel.app/events/sotc-test-check-in`
- Admin entry point: `https://qme-nine.vercel.app/admin/events`
- Admin event link: `https://qme-nine.vercel.app/admin/events/sotc-test-check-in`
- Admin queue link: `https://qme-nine.vercel.app/admin/events/sotc-test-check-in/queues/scan-code-adventure`
- Pilot queue/eCe: `Scan-Code Adventure`
- Station code: `4729`

Validated behavior:

- Guest event check-in gates access to the scan-code adventure.
- Guest check-in name is reused for the queue ticket; guests do not re-enter first/last name when joining the adventure.
- Guests can join the adventure queue and see stage-specific statuses: waiting, standby, your turn, and completed.
- Auto Assist advances the flow while the admin queue screen is open.
- Current pilot threshold settings are one active released guest and three standby guests.
- When a guest enters the correct station code, the ticket becomes completed and the next guest can advance.
- The completed adventure state appears on the event page without repeating active task instructions.
- Stage colors were verified in production: green for Your Turn, yellow for Standby, purple for Waiting, and green completed treatment on the event card.
- Slug-friendly admin routes were added after the live test so direct admin links can use the event slug and queue slug.
- The admin queue screen now labels the flow controls as standby nearby and active released, and shows the combined guests-in-motion count.

Pilot caveats:

- Auto Assist is client-driven and only runs while the admin queue screen is open.
- Manual station code entry works; phone camera scanning/QR completion is not yet implemented.
- Pilot RLS policies are intentionally permissive for testing and must be hardened before broader production use.
- Reset Practice Run now exists on the pilot admin queue screen for queue ticket reset/now-serving reset. Full test cleanup for check-ins and durable guest marks is still manual.

## Active Follow-Up Stories

- Add full pilot cleanup for event check-ins and durable guest marks between tests.
- Decide whether Auto Assist can remain admin-screen-driven for July or needs server-side/background queue automation.
- Add QR/scanning support for station completion while preserving manual code entry as a fallback.
- Replace permissive pilot RLS policies with event/role-aware access policies.
- Move pilot-specific image/asset references toward managed event/experience/queue assets.
- Generalize the scan-code adventure pilot into reusable queue/eCe behavior that can support headshots and resume review.

## Explicit Non-Goals For First Pass

- Full attendee import/sync.
- Full permissions engine.
- Full image upload UI.
- Beacon/location features.
- Resume upload workflow.
- Workshop signup/queue coordination.
- Sponsor analytics.
- Personalized networking/matching.

## Open Decisions

- What do sponsors want to measure or receive?
- Which images/logos/resources are available from SOTC or Rock Hall?
- What exact July 22 scope is approved after the first SOTC foundation demo?

## Decisions From 2026-06-11 Review

- Public event slug should be `sotc-rock-hall`.
- Do not import attendees before the first SOTC slice.
- Registration is QR/name entry plus an admin console where staff can mark check-in/access tags.
- Photo access is marked at check-in.
- Sponsors are informational for now.
- Day-one queue/service flows should include registration check-in, headshots, and resume review.
- Headshot states should include student-photo-eligible, student-photo-used, professional-general, professional-photo-eligible, and professional-photo-used.
- Keep a placeholder for a second profession/networking tag.
- The July 22 build should be treated as operationally reliable, not only demoable.
- Available SOTC/Rock Hall images, logos, and resources are still TBD; generated or placeholder assets can be used temporarily if needed.
