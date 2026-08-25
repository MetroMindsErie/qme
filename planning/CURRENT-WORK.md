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
- when that On My Way window expires, the guest stops consuming effective capacity but remains Stage = Gathering and retains the On My Way timestamp/history; silence/staleness does not Return them to Waiting or trigger cooldown;
- **expired OMW is no longer the guest's current State**. Current guest/admin/main-event displays must fall back to ordinary Gathering/stale semantics rather than continuing to say `On My Way` indefinitely;
- **On My Way is not callable** and must not progress normally to Your Turn until Nearby;
- Nearby remains the only normal callable/release-ready state and is not made stale by the Gathering/OMW stale mechanism;
- a guest may move On My Way -> Nearby without losing queue position/history;
- stale/silent Gathering remains recoverable and does not automatically Return to Waiting or incur cooldown.

Operational/current-state semantics must agree everywhere:
- a **fresh/current** On My Way guest appears as State = On My Way, is shown in the `OMW` headline subcount, and may be shown as `inQ - On My Way` on the event card;
- once that On My Way freshness window expires, the guest appears in `STALE` rather than `OMW` for headline purposes, current State falls back to Gathering/no special readiness state, and the event card must no longer say `inQ - On My Way`;
- preserve `on_my_way_at` and/or history so staff can still tell the guest previously said On My Way; do not erase history just to fix current-state display;
- Nearby must remain current/callable and must not be treated as stale by this mechanism.

Example with Gathering stale = 300 seconds: invited at 6:00, guest taps On My Way at 6:04 -> the OMW freshness window runs from approximately 6:04 to 6:09, not from the original 6:00 invitation. After ~6:09 the guest is still Gathering but is no longer currently On My Way.

Do **not** invent another operator setting now. A distinct/longer OMW duration can be considered later from event evidence.

## Acceptance Finding That Triggered This Slice

Live testing with Target = 7 exposed the original mismatch:
- headline correctly showed `1 OMW · 1 NRBY · 23 STALE`;
- Apply Flow released the Nearby guest to Your Turn;
- flow then invited **7** Waiting guests rather than accounting for the existing On My Way commitment;
- result was `4 Waiting / 31 Gathering / 1 Your Turn` rather than replenishing around On My Way as effective capacity.

That capacity mismatch was fixed and live acceptance later confirmed the correct result with `1 OMW · 2 NRBY · 4 STALE`: one Nearby released, one Nearby remained, the fresh OMW counted, and exactly 5 Waiting guests were invited.

A second live acceptance defect was then found: after an OMW freshness timeout, the headline correctly moved the guest from `OMW` to `STALE`, but individual admin/guest/current event-card displays could still say `On My Way`. Fix current-state derivation so freshness governs all current displays, not only capacity/headline math.

## Required Implementation

1. **Queue flow / SQL**
   - Preserve the production SQL behavior where a fresh On My Way ticket counts toward both effective Target occupancy and effective Max occupancy based on freshness from `on_my_way_at`.
   - On My Way remains non-release-ready; only Nearby can be released normally.
   - After the OMW freshness window expires, the ticket stops blocking effective capacity but remains Gathering/recoverable.
   - Keep stale tickets in Gathering; do not Return to Waiting merely because the timer expires.
   - Keep Not Here cooldown behavior unchanged.

2. **Guest action and copy**
   - Preserve the explicit guest-facing **I'm On My Way** action while the guest is Gathering and has not yet marked Nearby.
   - After fresh On My Way, guest/admin show Stage = Gathering / State = On My Way, and guest can still mark Nearby.
   - **Use this exact approved Gathering status instruction:** `Let us know when you're heading over by tapping I'm On My Way. When you arrive at the station, tap I'm Nearby.`
   - Remove the redundant instruction block immediately above the buttons (`When you arrive at the Headshot station, tap I'm Nearby. Keep this page open.` or equivalent Nearby-only repetition). After Location, proceed directly to the two action buttons when both actions are available.
   - Do not substitute alternate wording such as `Tap I'm On My Way to let us know you're heading over...`; use the approved copy above.

3. **Current-state derivation / display consistency**
   - Update any helpers/components that derive current On My Way state so **freshness is part of the definition of current OMW**.
   - A stale OMW ticket remains Gathering but current display must no longer say `On My Way` on:
     - admin guest row/card state;
     - guest queue status/progress state;
     - main event/experience card (`inQ - ...`);
     - any other current-state surface using the same helper.
   - Historical timestamps/records may continue to show that OMW happened.
   - Headline semantics remain: fresh OMW -> `OMW`; expired OMW -> `STALE`; never both.

4. **Admin/headline consistency**
   - Preserve Waiting `N COOLING` and Gathering `N OMW · N NRBY · N STALE` behavior already accepted.
   - Nearby and fresh OMW are not double-counted as stale.

## Already Accepted — Do Not Rework

Live acceptance already passed:
- stale Gathering does not starve replenishment;
- Manual vs Auto behavior;
- Nearby -> Your Turn via Apply Flow in Manual;
- admin/guest synchronization through completion;
- Return to Waiting and Not Here cooldown behavior;
- cooldown visibility and expiry back to ordinary Waiting;
- fresh OMW counts toward effective Target/Max;
- OMW -> Nearby transition;
- OMW freshness expiration moves headline OMW -> STALE while raw Gathering remains unchanged;
- headline `COOLING`, `NRBY`, `STALE`, and `OMW` arithmetic.

Do not reopen those behaviors except as regression checks needed for these final display/copy fixes.

## Validation

Validate at minimum:
- Gathering screen uses the exact approved status copy above;
- redundant Nearby-only instruction above the buttons is removed;
- fresh OMW still displays as On My Way on guest/admin/event card;
- after the configured stale duration from `on_my_way_at`, the same guest remains Gathering but no longer displays current State = On My Way on guest/admin/event card;
- stale OMW still appears in `STALE`, not `OMW`, in the headline and is not double-counted;
- OMW -> Nearby still works;
- Nearby remains callable and not stale;
- existing queue service tests and full app build pass where environment permits;
- Vercel/deployment compile status is clean after push.

## Deployment / Handoff

This final pass should be app/UI/current-state derivation only unless inspection proves a DB definition change is genuinely required. If no SQL behavior changes are needed, explicitly report **no SQL to run**. Do not apply SQL to Supabase.

Report:
- exact files changed;
- whether any SQL must be rerun (expected: none unless code inspection proves otherwise);
- tests/build results or environment blockers;
- commit SHA;
- concise live acceptance steps.

Do not mark either roadmap story done. Product Owner will close **Explain queue automation blockers to operators** and **Let Gathering guests say On My Way** after final live acceptance.

## Current Slice Status Update

- On My Way implementation committed in `2964600`; required SQL definitions were manually applied to production Supabase.
- Live capacity acceptance passed with fresh OMW counted correctly against Target/Max.
- Live OMW -> Nearby acceptance passed.
- Live 60-second stale test passed for headline/capacity semantics: OMW dropped out, STALE increased, raw Gathering stayed unchanged.
- Final app-only acceptance fixes implemented:
  1. Gathering guest copy now uses the exact approved wording, and the redundant instruction block above the buttons was removed.
  2. current On My Way display now requires freshness on the guest ticket surface, admin row/card state, and main event card; expired OMW falls back to Gathering/stale current-state semantics while preserving OMW timestamp history.
- Validation passed locally: `npx tsc -b`, `npx vite build`, and `npm run test -- src/test/queueService.test.ts`.
- No SQL changes were made for this final fix; no Supabase SQL rerun is expected.
