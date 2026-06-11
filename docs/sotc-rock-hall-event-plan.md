# SOTC Rock Hall Event Plan

Updated: 2026-06-11

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

Suggested event slug: `sotc-rock-hall-mixer`

The old Trello shorthand `SOTCRH` can remain an internal/project shorthand, but a human-readable slug is better for URLs.

## Experience Inventory

### Registration

Type: check-in / information / passport start

Initial treatment:

- Guest can see registration instructions.
- Admin can view expected/checked-in guests later.
- Check-in can kick off passport activity later.

Open question:

- Will qME import attendees before the event, or start with manual/QR check-in only?

### Sponsors

Type: sponsor cards / passport activity

Initial treatment:

- Sponsor cards with name, logo/image, description, and location.
- Passport/activity tie-in remains optional.

Open question:

- What do sponsors want to measure or receive?

### Professional Headshots

Type: digital queue / special access

Initial treatment:

- Queue-bearing experience.
- Students can get headshots.
- Professionals may require paid/approved photo access.
- Access should not be modeled as Peony `flowers`; it needs SOTC-specific guest states.

Likely future guest states:

- student
- professional
- student-photo-eligible
- student-photo-used
- professional-photo-eligible
- professional-photo-used

Open question:

- Who marks professional photo access, and when?

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

Do not decide the full July MVP yet.

The next step is to make SOTC representable in the system without hard-coding it. Then choose a thin July slice.

Likely thin MVP candidates:

- Organization-owned SOTC event.
- Public event page with structured experience cards.
- Headshot queue.
- Resume review queue.
- Mixer resources/digital brochure cards.
- Basic registration/check-in path.

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

- What is the minimum July 22 MVP?
- Should public URLs use `sotc-rock-hall-mixer`, `sotc-rock-hall`, or another slug?
- What guest types/states are needed for headshot access?
- Does SOTC need attendee import before the event?
- Which images/logos/resources are available from SOTC or Rock Hall?
- Which experiences need queues on day one?
- What must be demoable versus operationally reliable for July?
