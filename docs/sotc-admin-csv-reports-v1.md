# SOTC Admin CSV Reports v1

## Purpose

Sprint 3 adds lightweight CSV exports for operational review before building richer reporting or analytics.

## Access

CSV export controls are visible to Event Admin or higher. Limited station/staff users do not see the export controls in this first pass.

## Attendance / Check-In Export

Available from the admin Event Check-In screen.

Columns:

- `event_name`
- `event_slug`
- `check_in_id`
- `first_name`
- `last_name`
- `status`
- `ticket_type`
- `email`
- `phone`
- `imported_registration_id`
- `registration_match_status`
- `needs_help`
- `headshot_credit_status`
- `headshot_credit_quantity`
- `headshot_credit_used_quantity`
- `created_at`
- `updated_at`
- `metadata_json`

Notes:

- `status` distinguishes waiting, completed, and removed/cancelled check-ins.
- `headshot_credit_status` is blank when no credit exists, `available` when the Headshot credit remains unused, and `used` after the Headshot queue consumes it.
- `metadata_json` is included so imported-registration context and pilot exception details are preserved without adding a custom report field for every pilot detail.

## Queue Activity Export

Available from the admin queue screen for queue-based event features, including Headshot Photographer.

Columns:

- `event_name`
- `event_slug`
- `queue_name`
- `queue_slug`
- `ticket_id`
- `ticket_number`
- `first_name`
- `last_name`
- `stage`
- `status`
- `nearby_confirmed`
- `service_started_at`
- `service_started_source`
- `joined_at`
- `stage_updated_at`
- `nearby_confirmed_at`
- `released_at`
- `completed_at`
- `left_at`
- `left_reason`
- `mark_metadata_json`

Notes:

- `service_started_at` is populated when the queue records a durable service-start marker, such as the Headshot `headshot_service_started` marker.
- Admin-served completion and guest-confirmed completion both remain visible through `completed_at`.
- This report intentionally exports operational state and timestamps, not analytics summaries.

## Deferred

Future reporting can add filtered exports, saved report views, aggregated dashboards, and sanitized public-demo exports after the CSV shape proves useful.
