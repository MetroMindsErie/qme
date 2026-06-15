# qME Image Ownership Model v1

Date: 2026-06-15

## Purpose

This document defines how qME should think about images and visual assets before multi-organization and multi-event schema work begins. It is a design decision document, not an implementation of uploads or storage.

## Core Rule

Images should be managed as asset records with clear ownership, not hard-coded public file paths.

Ownership should follow the object the image represents: organization, event, experience, queue, participant/provider, or guest/private context.

## Asset Classes

### Public Display Assets

Public display assets are intended to appear on event pages, queue pages, cards, sponsor placements, menus, maps, or public-facing resources.

Examples:

- Organization logos.
- Event hero images.
- Event map/floor images.
- Experience images.
- Queue/service images.
- Sponsor logos.
- Menu/item photos.
- Public resource graphics.

These assets may be stored in a public Supabase Storage bucket or served through a public URL, with metadata in database tables.

### Private Guest Assets

Private guest assets are uploaded by or about a guest and should not be mixed with public event images.

Examples:

- Resumes.
- Personal documents.
- Private profile photos.
- Payment/receipt images if ever supported.
- Any file containing personal or sensitive information.

Private guest assets need stricter access control, likely a separate bucket/path strategy, and should be linked to event guest records or future guest identities.

## Ownership Levels

### Organization Assets

Owned by an organization and reusable across the organization's events.

Examples:

- Organization logo.
- Brand images.
- Default event placeholder images.
- Reusable sponsor graphics if managed at the org level.
- Default resource images.

Schema implication:

- Assets may have `organization_id`.
- These assets can be selected/reused when creating events.

### Event Assets

Owned by one event.

Examples:

- Event hero image.
- Event map.
- Event schedule graphic.
- Event-specific QR/resource image.
- Event-specific gallery images.

Schema implication:

- Assets may have `event_id`.
- Event assets should not automatically appear in other events unless intentionally copied or promoted to organization-level assets.

### Experience Assets

Owned by one event experience.

Examples:

- Headshot area photo.
- Resume review area image.
- Workshop image.
- Sponsor booth image.
- Food/bar experience image.

Schema implication:

- Assets may have `experience_id`.
- Experience assets are event-scoped for MVP.

### Queue / Service Assets

Owned by one queue or service point.

Examples:

- Flower Photos queue image.
- Bouquet Bar queue image.
- Photo booth queue image.
- Resume review queue image.
- Food truck ordering/status queue image.

Schema implication:

- Assets may have `queue_id`.
- Queue assets are event-scoped for MVP.

### Participant / Provider Assets

This is future-compatible, not an MVP feature.

Examples:

- Food truck logo and menu images.
- Vendor photos.
- Photographer logo or sample work image.
- Sponsor images.
- Workshop host images.

MVP approach:

- Store provider-related visuals as event, experience, or queue assets under the host event.

Future approach:

- A participant/provider organization may own reusable assets and attach approved content into host events.

Schema implication:

- Avoid assuming every asset is permanently owned by the host event.
- A future `owner_type` / `owner_id` or participant/provider relation may be useful.

## Defaults and Hard-Coded Images

Static app images should be limited over time to:

- App defaults.
- Placeholders.
- Icons or visual UI assets.
- Emergency fallback images.

Event/demo content images should move toward managed assets with database references.

Peony Festival images can remain hard-coded during the demo-stabilization phase, but the schema should not further entrench that approach.

## Initial Schema Implications

Likely table:

`assets`

Possible fields:

- `id`
- `organization_id`
- `event_id`
- `experience_id`
- `queue_id`
- `owner_type`
- `owner_id`
- `asset_type`
- `storage_bucket`
- `storage_path`
- `public_url`
- `alt_text`
- `caption`
- `sort_order`
- `created_by_principal_id`
- `created_at`
- `updated_at`

Private guest uploads may later need a separate table, such as `guest_assets`, or a clearly separated asset class with stricter access policies.

## Storage Implications

Likely Supabase Storage approach:

- Public bucket/path for public org/event/experience/queue assets.
- Private bucket/path for guest/private files.
- Storage paths should include ownership context where possible.

Example public paths:

- `organizations/{organization_id}/logo/...`
- `organizations/{organization_id}/events/{event_id}/...`
- `organizations/{organization_id}/events/{event_id}/experiences/{experience_id}/...`
- `organizations/{organization_id}/events/{event_id}/queues/{queue_id}/...`

Example private paths:

- `organizations/{organization_id}/events/{event_id}/guests/{event_guest_id}/...`

## Deferred

- Upload UI.
- Image picker/selector UI.
- Image editing/cropping.
- CDN optimization.
- Private guest upload workflow.
- Participant/provider-owned reusable asset library.
- Migration of all hard-coded Peony images.

## Follow-On Stories

- Implement managed image storage in Supabase.
- Add upload/select UI for organization, event, experience, and queue images.
- Inventory current static event/demo images.
- Migrate Peony demo images into managed assets when the multi-org/event model is ready.
