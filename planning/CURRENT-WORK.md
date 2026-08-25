# Current Work

## Current Slice

Finish Sprint 3 by completing **On My Way** end to end while preserving the queue blocker visibility behavior already accepted.

Read `AGENTS.md` first. Implementation is authorized. Keep this slice bounded to On My Way semantics, guest action, queue-flow capacity math, directly related admin/headline behavior, tests, and required SQL definition updates. Do not broaden into SMS, reconnect UX, new queue states, unrelated admin redesign, or new timing settings.

## Product Decision

Product flow is:

`Waiting -> Gathering (invited/unconfirmed) -> On My Way -> Nearby -> Your Turn -> Completed`

On My Way is **State within Gathering**, not a separate Stage.

Meaning:
- newly invited/unconfirmed Gathering counts toward effective Gathering only during the configured stale grace period;
- **On My Way is an affirmative guest commitment and starts a new freshness window when the guest marks On My Way**;
- for this slice, that On My Way freshness window uses the existing configured Gathering stale duration; do not add a second operator timing setting;
- while that On My Way window is fresh, the guest counts toward effective Gathering Target and Max;
- when that On My Way window expires, the guest stops consuming effective capacity but remains Stage = Gathering and retains the On My Way history/state information; silence/staleness does not Return them to Waiting or trigger cooldown;
- **On My Way is not callable** and must not progress normally to Your Turn until Nearby;
- Nearby remains the only normal callable/release-ready state and is not made stale by the Gathering/OMW stale mechanism;
- a guest may move On My Way -> Nearby without losing queue position/history;
- stale/silent Gathering remains recoverable and does not automatically Return to Waiting or incur cooldown.

Operational summary semantics must be mutually meaningful:
- a **fresh/current** On My Way guest appears in the `OMW` headline subcount and not `STALE`;
- once that On My Way freshness window expires, the guest appears in `STALE` rather than `OMW` for headline capacity/readiness purposes;
- the individual guest row/history may continue to show that the guest previously said On My Way, while also making clear that the commitment is now stale if the current UI supports that distinction cleanly.

Example with Gathering stale = 300 seconds: invited at 6:00, guest taps On My Way at 6:04 -> the OMW freshness window runs from approximately 6:04 to 6:09, not from the original 6:00 invitation.

Do **not** invent another operator setting now. A distinct/longer OMW duration can be considered later from event evidence.

## Acceptance Finding That Triggered This Slice

Live testing with Target = 7 exposed the mismatch:
- headline correctly showed `1 OMW · 1 NRBY · 23 STALE`;
- Apply Flow released the Nearby guest to Your Turn;
- flow then invited **7** Waiting guests rather than accounting for the existing On My Way commitment;
- result was `4 Waiting / 31 Gathering / 1 Your Turn` rather than replenishing around On My Way as effective capacity.

Inspection confirmed `run_queue_pilot_flow` currently counts effective Gathering using Nearby or stage freshness, but does not explicitly use current `on_my_way_at` semantics. Fix this so UI and automation agree.

## Required Implementation

1. **Queue flow / SQL**
   - Update the production SQL definitions for `run_queue_pilot_flow` so a fresh On My Way ticket counts toward both effective Target occupancy and effective Max occupancy based on freshness from `on_my_way_at` (or the authoritative existing OMW transition timestamp if represented differently).
   - On My Way must remain non-release-ready; only Nearby can be released normally.
   - After the OMW freshness window expires, the ticket stops blocking effective capacity but remains Gathering/recoverable.
   - Keep stale tickets in Gathering; do not Return to Waiting merely because the timer expires.
   - Keep Not Here cooldown behavior unchanged.
   - If the same function definition exists in more than one checked-in SQL file, update all authoritative copies consistently.

2. **Guest action**
   - Add an explicit guest-facing **On My Way** action while the guest is Gathering and has not yet marked Nearby.
   - Use the existing ticket/RPC/state plumbing where possible; do not create a parallel state model.
   - Marking On My Way must establish/reset the OMW freshness timestamp/window.
   - After On My Way, guest and admin should show Stage = Gathering / State = On My Way while fresh.
   - Guest must still be able to mark Nearby afterward.
   - Preserve timestamps/history/source attribution where the existing model supports it.

3. **Admin/headline consistency**
   - Preserve the accepted headline display: Waiting may show `N COOLING`; Gathering may show `N OMW · N NRBY · N STALE`.
   - `OMW` means fresh/current OMW for effective-capacity purposes.
   - A stale OMW moves from the OMW subcount to STALE; do not count it in both.
   - The displayed OMW/STALE interpretation must agree with the flow algorithm.
   - Nearby must not be double-counted as stale.

## Already Accepted — Do Not Rework

Live acceptance already passed:
- stale Gathering does not starve replenishment;
- Manual vs Auto behavior;
- Nearby -> Your Turn via Apply Flow in Manual;
- admin/guest synchronization through completion;
- Return to Waiting and Not Here cooldown behavior;
- cooldown visibility and expiry back to ordinary Waiting;
- headline `COOLING`, `NRBY`, `STALE`, and basic `OMW` display/arithmetic.

Do not reopen those behaviors except as regression checks needed for the On My Way change.

## Validation

Validate at minimum:
- guest in Gathering can choose On My Way;
- marking On My Way starts/resets its freshness window from the OMW action time;
- admin and guest both show Gathering / On My Way while fresh;
- fresh On My Way counts toward effective Target and Max;
- with Target 7, one fresh OMW and no other effective Gathering yields six invitations, not seven;
- On My Way does not progress to Your Turn without Nearby;
- On My Way -> Nearby -> Your Turn still works normally;
- after the configured stale duration measured from the OMW action, OMW stops consuming effective capacity but remains Gathering/recoverable;
- stale OMW is represented as STALE rather than OMW in the headline operational subcounts and is not double-counted;
- Nearby remains active/release-ready and is not made stale by this mechanism;
- headline OMW/NRBY/STALE counts agree with flow semantics;
- existing queue service tests and full app build pass where environment permits;
- Vercel/deployment compile status is clean after push.

## Deployment / Handoff

Steve/Codex should make and commit/push the code/SQL file changes, but **must not apply SQL manually to Supabase**. Evan will run any required SQL definition script in the Supabase SQL Editor, following the established project workflow.

Report:
- exact files changed;
- exact SQL file(s) Evan must run, if any;
- tests/build results or environment blockers;
- commit SHA;
- concise live acceptance steps.

Do not mark either roadmap story done. Product Owner will close **Explain queue automation blockers to operators** and **Let Gathering guests say On My Way** after live acceptance.

## Current Slice Status Update

- Targeted implementation bug from commit `54cbf4a` (`waitingCoolingCount` / `waitingCooldownCount` mismatch) is not present in current main; both the calculation and render now use `waitingCoolingCount` in `app/src/pages/admin/AdminQueueDashboard.tsx`.
- No additional product logic changes were made in this pass.

Validation status:
- `npm --prefix app test src/test/queueService.test.ts` ❌ blocked by local environment `EPERM` (`lstat 'C:\\Users\\ebcoo'`), command did not execute to completion.
- `npm --prefix app run build` ❌ blocked by same local environment `EPERM` (`lstat 'C:\\Users\\ebcoo'`).
