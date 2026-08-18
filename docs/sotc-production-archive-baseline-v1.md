# SOTC Production Archive and Internal Baseline

## Purpose

Sprint 3 starts by preserving the July 22 SOTC production record before future testing continues.

The intent is to keep two different things:

- A production archive snapshot for review.
- The existing `sotc-rockhall` event as the private internal full-data working baseline for realistic testing.

The internal baseline may contain real names, contact fields, check-ins, queue activity, credits, and marks. Treat it as private internal data. For now, the live `sotc-rockhall` event remains usable for Sprint 3 testing, resets, and workflow rehearsal. The archive snapshot protects the July 22 record.

## Migration

Run:

```sql
supabase-sotc-production-archive-baseline.sql
```

Expected final result:

```text
sotc_archive_baseline_foundation_ready
```

This creates:

- `public.event_data_snapshots`
- `public.create_event_dataset_snapshot(...)`
- `public.admin_mark_event_archive_lock(...)`
- `public.admin_clear_event_archive_lock(...)`
- `public.admin_mark_event_internal_baseline(...)`

It also installs archive-lock triggers on event-owned operational tables.

## Create The Production Archive Snapshot

Run this before resetting, overwriting, or continuing heavy testing against the SOTC event:

```sql
select public.create_event_dataset_snapshot(
  (select id from public.events where slug = 'sotc-rockhall'),
  'sotc-rockhall-production-2026-07-22',
  'production_archive',
  'July 22 SOTC Rock Hall production event archive.'
);
```

## Optional: Lock The Production Event

Run this only if the original `sotc-rockhall` event should become read-only. Do not run this while the existing event is still serving as the working baseline:

```sql
select public.admin_mark_event_archive_lock(
  (select id from public.events where slug = 'sotc-rockhall'),
  'sotc-rockhall-production-2026-07-22',
  'Preserve July 22 production evidence. Future testing should use a separate internal baseline or clone.'
);
```

After this, normal inserts, updates, deletes, resets, queue actions, check-ins, and ticket changes against that event should fail. Current Sprint 3 decision: do not lock yet; use the archive snapshot as the protected historical record and keep `sotc-rockhall` usable as the working baseline.

## Create The Internal Full-Data Baseline Snapshot

If the live SOTC event still contains the desired full operational dataset, create the internal baseline snapshot before resetting or overwriting it:

```sql
select public.create_event_dataset_snapshot(
  (select id from public.events where slug = 'sotc-rockhall'),
  'sotc-rockhall-internal-full-data-baseline-v1',
  'internal_baseline',
  'Private internal full-data baseline for Sprint 3 testing. Contains real operational data.'
);
```

Current decision: the existing `sotc-rockhall` event is the working baseline for now. If a future relational working copy is created, mark that copied event as the internal baseline:

```sql
select public.admin_mark_event_internal_baseline(
  (select id from public.events where slug = 'sotc-rockhall-working-baseline'),
  'sotc-rockhall-internal-full-data-baseline-v1',
  'Working baseline copied from the July 22 production shape for internal testing.'
);
```

## Verify Snapshots

```sql
select
  snapshot_key,
  snapshot_type,
  source_event_id,
  jsonb_array_length(payload->'event_check_ins') as check_ins,
  jsonb_array_length(payload->'tickets') as tickets,
  jsonb_array_length(payload->'event_imported_registrations') as imported_registrations,
  created_at
from public.event_data_snapshots
where snapshot_key in (
  'sotc-rockhall-production-2026-07-22',
  'sotc-rockhall-internal-full-data-baseline-v1'
)
order by created_at desc;
```

## Verify Archive Lock

```sql
select
  slug,
  public.event_is_archive_locked(id) as archive_locked,
  metadata->'archive_lock' as archive_lock
from public.events
where slug = 'sotc-rockhall';
```

## Emergency Unlock

Only qMe superadmin can clear an archive lock:

```sql
select public.admin_clear_event_archive_lock(
  (select id from public.events where slug = 'sotc-rockhall'),
  'Reason for clearing the lock.'
);
```

Do not use this for normal testing. Keep the event unlocked while it is intentionally serving as the internal working baseline.

## Current Limit

This first Sprint 3 slice preserves data by snapshot. It does not yet create a relational event clone that can be opened as a separate working event. Current decision: a clone is not needed immediately because the existing `sotc-rockhall` event remains the working baseline and can be reset or overwritten as needed, while the archive snapshot preserves the July 22 record.
