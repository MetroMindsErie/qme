# Current Work

## Current Slice

Finish Sprint 3 story **Make station operational controls visible and understandable** with one small consistency fix discovered during Product Owner acceptance.

Read `AGENTS.md` first. Implementation is authorized. Keep this slice narrowly bounded to the compact queue summary on the event/admin overview. Do not expose the Settings tab to station/check-in staff, change edit permissions, change queue flow semantics, alter SQL, or redesign the queue dashboard.

## Product Decision

Live Product Owner review changed the earlier assumption that station staff need read-only access to queue configuration.

Station/check-in staff **do not need the Settings tab** merely to understand Target, Max, stale seconds, cooldown, or other algorithm configuration. Their operational job is to understand the current condition of the line and act on guests, not to reason through Event Admin configuration.

The existing station Live Line already provides the operational visibility needed:
- Waiting / Gathering / Your Turn / Completed totals;
- compact Gathering readiness detail including OMW / NRBY / STALE where applicable;
- Released active capacity;
- guest Stage/State/timestamps;
- Cooling Down and remaining cooldown where applicable;
- Apply Flow / Not Here and other authorized station actions;
- ordered/searchable guest list.

Event Admin/Superadmin Settings already exposes the configurable controls with explanatory copy: Join Status, Run mode, Gathering Target, Gathering Max, Gathering stale seconds, Not Here cooldown, and Active Released. Keep configuration visibility/edit authority there.

Product principle accepted on 2026-08-25:

> Station operators should understand the **current operational condition** of their queue without needing access to the configuration that produces it.

Do not add a read-only Settings tab to staff in this slice.

## Remaining Consistency Gap

On the higher-level event/admin overview, the compact Headshot Photographer queue summary currently shows chips such as:

`Waiting 21 | Gathering 13 | Nearby 2 | Your Turn 1 | Done 43`

On My Way is now a real operational readiness condition within Gathering, but this compact summary does not show it. This is inconsistent with the detailed Live Line headline, which already exposes fresh OMW / Nearby / Stale composition.

### Required change

Add a compact **On My Way / OMW** count to the higher-level queue summary when there are one or more **fresh/current** OMW guests.

- Use the same freshness semantics already accepted for current OMW: expired OMW must not remain in the OMW count.
- Do not double-count Nearby as OMW.
- Prefer omitting the OMW chip when the count is zero to avoid unnecessary clutter.
- Preserve the existing Waiting, Gathering, Nearby, Your Turn, and Done chips and Manage Queue behavior.
- Do not add STALE to this higher-level summary unless it is already part of the existing design; detailed stale diagnostics belong on Live Line.

## Story Acceptance Interpretation

For this story, "visible and understandable" now means:
- Event Admin/Superadmin can see and edit station-level queue operating configuration with explanatory labels/copy.
- Station/check-in staff can see the live operational consequences needed to run the station without being given unnecessary configuration UI.
- Role permissions remain intentional: configuration edit access is not expanded merely for visibility.
- Current readiness signals shown at the higher-level summary remain consistent with the detailed queue view, including fresh On My Way.

This Product Owner interpretation supersedes any older acceptance wording that implied every station operator must see the underlying configuration values.

## Validation

Validate at minimum:
- with zero fresh OMW guests, the compact higher-level queue summary does not add unnecessary OMW clutter;
- with one or more fresh OMW guests, the compact summary shows the correct OMW count;
- when an OMW guest expires, the compact OMW count updates/disappears using the same current/fresh semantics as the detailed queue view;
- Nearby is not double-counted as OMW;
- existing Waiting / Gathering / Nearby / Your Turn / Done counts remain correct;
- station/check-in staff still have no Settings tab unless separately authorized by an existing role rule;
- Event Admin/Superadmin Settings remains unchanged and editable according to existing permissions;
- targeted tests/build pass where practical and Vercel deployment is clean.

No SQL changes are expected. Do not apply SQL to Supabase.

## Handoff

Report exact files changed, validation results, commit SHA, and whether any unexpected permission/configuration change was necessary.

Do not mark the story done. Product Owner will close **Make station operational controls visible and understandable** after live acceptance of the compact OMW summary.

## Current Slice Status Update

- Compact admin event overview queue summaries now include an `OMW` chip only when one or more fresh/current On My Way guests exist.
- The OMW count uses the accepted current-state freshness rule from `on_my_way_at` and the queue Gathering stale seconds; expired OMW drops out of the chip.
- No Settings tab, permission, queue-flow, or SQL changes were made.
