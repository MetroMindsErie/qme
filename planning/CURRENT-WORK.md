# Current Work

## Current Slice

Implement the effective-Gathering capacity correction for Sprint 3 story `story-explain-queue-automation-blockers` — **Explain queue automation blockers to operators**.

Read `AGENTS.md` first. Product behavior below is resolved and implementation is authorized. Keep the slice bounded to queue-flow capacity semantics and directly necessary operator feedback; do not broaden into unrelated queue redesign.

## Product Decision

Core principle: **silent invitations must not starve the service line.** qME should keep the service supplied with meaningfully engaged guests rather than treating every ticket whose Stage is Gathering as equivalent operational capacity.

### Effective Gathering

Count toward effective Gathering capacity/Target and Max only while operationally active:
- `Gathering` + `Nearby` — callable readiness signal.
- `Gathering` + `On My Way` — active commitment; count for now while not stale.
- newly invited `Gathering` with no response — count during the configured response/stale grace period.

Do not count toward effective Gathering capacity/Target or Max:
- unconfirmed Gathering guests after the stale threshold;
- On My Way guests after an appropriate later stale threshold if they never become Nearby. If the existing data/config does not safely support a distinct On My Way stale duration in this bounded slice, preserve the existing stale duration and document that follow-up rather than inventing a new operator setting.

Stale guests remain in Gathering and retain queue position/history. Mere silence does **not** Return to Waiting or trigger cooldown. They may recover by later marking On My Way or Nearby.

### Gathering Target and Max

Keep both concepts for now, but redefine Max rather than removing it:
- **Target** = desired effective engaged population feeding service.
- **Max** = ceiling on the same currently active/effective Gathering exposure.
- Stale Gathering guests do not consume either Target or Max.

Do not allow stale tickets to block replenishment merely because total historical/current-stage Gathering rows exceed Max. Existing Target <= Max configuration relationship may remain unless a code change is necessary for the effective-capacity behavior.

### Auto vs Manual

- **Auto mode:** automatically replenish effective Gathering when it falls below Target. No Apply Flow action is required for normal replenishment.
- **Manual mode:** do not replenish automatically. `Apply Flow` runs the same flow algorithm once. If nothing moves, provide concise actionable feedback explaining why.

### Nearby

Nearby remains the only normal callable signal for progression to Your Turn. Do not create a separate Nearby-target invitation algorithm in this slice.

## Existing Implementation Findings

- `run_queue_pilot_flow` already removes stale non-nearby standby tickets from `blocking_standby_count`, but stale tickets remain in total `standby_pool_count`, so `gathering_max` can still block replenishment.
- Target and Max are coupled by a floor (`gathering_max >= standby_target`) but are not forced equal.
- Stale Gathering already remains in Gathering rather than being returned to Waiting.
- On My Way exists end-to-end through `tickets.on_my_way_at`, guest/admin display state, and admin override support.
- Nearby is already the release-ready signal.
- Auto mode already re-applies flow periodically; Manual Apply Flow invokes the same RPC.

## Implementation Scope

1. Correct SQL/RPC effective-capacity math so stale Gathering tickets do not consume Target or Max and therefore cannot starve replenishment.
2. Ensure On My Way is treated as an active commitment for capacity while fresh and becomes non-blocking when stale according to the safest existing timing semantics.
3. Preserve Nearby as the only normal release-ready/callable signal.
4. Preserve stale tickets in Gathering with history/position; do not add automatic cooldown/Return to Waiting for silence.
5. Preserve Not Here cooldown behavior.
6. Keep Auto mode replenishment automatic and Manual mode operator-driven.
7. Add the smallest useful Manual Apply Flow no-movement feedback based on actual flow outcome/reason. Do not build a generalized diagnostics engine.
8. Update admin wording only where needed so Target/Max descriptions match effective active Gathering semantics and do not misleadingly describe stale tickets as consuming capacity.

## Validation / Acceptance

Validate at minimum:
- Target can replenish even when raw Gathering count is above Target/Max because some Gathering tickets are stale.
- fresh unconfirmed Gathering counts until stale threshold, then stops blocking.
- fresh On My Way counts; stale On My Way stops blocking; On My Way never becomes callable without Nearby.
- Nearby counts and remains release-ready.
- stale guests remain Gathering and can later recover by On My Way/Nearby.
- Auto mode replenishes without Apply Flow.
- Manual mode does not auto-replenish; Apply Flow runs once and explains a zero-movement result.
- Not Here still returns to Waiting/cooldown according to existing policy.
- Existing guest/admin Stage + State behavior remains consistent.

## Implementation Status

- Status: completed in this branch.
- Changes applied:
  - `run_queue_pilot_flow` now applies the same freshness filter to both effective blocking and effective total Gathering cap calculations, so stale non-nearby Gathering/On My Way tickets no longer consume max capacity.
  - Added flow outcome telemetry from `admin_apply_queue_pilot_flow` (`released_count`, `invited_count`, headroom/candidate metrics) and surfaced concise manual Apply Flow feedback in admin UI.
  - Updated admin queue settings text for Target/Max wording to describe fresh effective Gathering semantics.
- Validation:
  - `npm --prefix app test src/test/queueService.test.ts` (pass)
  - `npm --prefix app run build` (pass after clearing `app/dist`).
  - Initial full build attempt failed once with a local lock (`EBUSY`) while cleaning output, then reran successfully.
- Next action: none for this slice.

## Snapshot Restore Mechanism

- Status: implemented as SQL only; not applied to Supabase and no restore executed from this environment.
- Added `supabase-event-data-snapshot-restore.sql`, which installs `public.restore_event_dataset_snapshot(...)`.
- Restore guardrails:
  - superadmin-only via `public.is_qme_superadmin()`;
  - same-event restore only: snapshot event id/source id and slug must match the target event;
  - source snapshot must be `internal_baseline`;
  - target event must not be archive locked;
  - a unique safety snapshot is created through `public.create_event_dataset_snapshot(...)` before any restore deletes/inserts;
  - deletes are scoped to the target event and its queue/session/check-in/ticket ids;
  - `p_preserve_current_queue_config = true` preserves current queue control fields after baseline queue rows are restored.
- Intended SOTC restore source for acceptance testing: `sotc-rockhall-internal-full-data-baseline-v2-headshot-credit-corrected`.
- Intended safety snapshot key: `sotc-rockhall-pre-restore-2026-08-25-effective-gathering-acceptance`.
- Expected baseline checks after manual restore: 132 event check-ins, 96 tickets, 105 guest-credit rows, Headshot Photographer queue restored from baseline operational data, and current queue configuration fields preserved.

Run targeted validation plus full local TypeScript/Vite validation before completion. Do not change roadmap status; Billy/Product Owner will close the story after acceptance. Do not deploy without explicit Product Owner authorization. Update CURRENT-WORK with implementation/validation state and stop with one concise completion summary.
