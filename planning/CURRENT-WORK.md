# Current Work

## Current Slice

Inspection/design verification for Sprint 3 story `story-explain-queue-automation-blockers` — **Explain queue automation blockers to operators**.

Read `AGENTS.md` first. Do not implement yet. The prior gap review exposed a more fundamental queue-flow policy issue that must be verified against current implementation before coding blocker messages.

## Product Decision / Working Flow Model

Core principle: **silent invitations must not starve the service line.** qME should keep the service supplied with meaningfully engaged guests rather than treating every ticket whose Stage is Gathering as equivalent operational capacity.

### Gathering Target

`Gathering Target` should represent the desired number of meaningfully engaged guests feeding the service.

Count toward effective Gathering Target:
- `Gathering` + `Nearby` — strongest readiness signal; callable for normal Your Turn progression.
- `Gathering` + `On My Way` — active commitment and countable for now; future event evidence may refine this.
- newly invited `Gathering` with no response — count only during a defined response grace period.

Do not count toward effective Gathering Target:
- unconfirmed Gathering guests after their response grace period expires;
- `On My Way` guests after a separate/later stale threshold if they never become Nearby.

### Stale Behavior

A guest who fails to respond should not automatically be punished with Return to Waiting/cooldown. After the applicable response window, keep the guest in Gathering but treat them as stale so they no longer consume effective Gathering Target. They retain original queue position/history and may recover by later marking On My Way or Nearby.

Cooldown / Return to Waiting should remain for explicit Not Here or other policy-driven unavailability, not mere silence.

### Auto vs Manual

- **Auto mode:** qME should automatically replenish effective Gathering when it falls below Target. No operator Apply Flow action should be required for normal replenishment.
- **Manual mode:** qME does not replenish automatically. `Apply Flow` means run the same flow algorithm once now. If nothing moves, operator feedback should explain why.

### Nearby

Nearby is the key callable readiness signal and we likely want more than one Nearby guest when possible, but qME cannot force guests to mark Nearby. Do not invent a separate Nearby-driven invitation algorithm yet. Observe Nearby separately from On My Way and learn from event behavior.

### Gathering Max

Product Owner questions whether a user-facing Gathering Max is needed at all. If stale/unresponsive guests stop counting toward Target, qME should continue inviting until effective Gathering Target is met. If protection against runaway outstanding invitations is technically necessary, prefer an internal/system safety ceiling rather than making Target and Max competing operator settings. Do not assume Target and Max should remain equal.

## Prior Gap Review

1. Cooling Down + remaining time — **Satisfied**.
2. Gathering full explanation — **Partial**, but do not implement messaging until the effective-Gathering capacity model above is resolved.
3. Auto/manual explanation — **Partial**; product intent is now clarified above.
4. Credit/eligibility blocker explanation — **Missing**.
5. Apply Flow no-movement feedback — **Missing**, but relevant primarily to Manual mode after the underlying flow algorithm is correct.
6. Not Here recovery policy — **Satisfied**.

## Required Inspection Before Implementation

Inspect current queue flow code/RPCs and report concisely:

1. Exactly how current automation calculates Gathering occupancy/Target today.
2. Whether `Gathering Target` and `Gathering Max` are currently coupled or forced equal anywhere in UI, service, RPC, or database logic.
3. How current stale-Gathering behavior works: thresholds, state/status changes, whether stale guests continue counting toward capacity, and whether they are returned to Waiting/cooldown.
4. Whether `On My Way` exists end-to-end in the current guest/admin/server flow and how it currently affects automation/capacity.
5. What triggers Auto mode replenishment today and whether it automatically re-runs when effective conditions change or only on specific actions/timers.
6. The smallest technical delta required to implement the Product Decision / Working Flow Model above.

Do not code, change roadmap status/content, deploy, or seed Planning. Do not narrate routine investigation. Return one concise inspection report and stop for Product Owner review.
