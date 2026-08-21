# Current Work

## Current Slice

Inspection-only gap review for Sprint 3 story `story-explain-queue-automation-blockers` — **Explain queue automation blockers to operators**.

Read `AGENTS.md` first. This slice is investigation only. Do not implement, change roadmap product content/status, deploy, or seed Planning.

## Product Intent

When queue automation does not move a guest, operators should be able to understand why rather than infer whether qME is stuck. The story remains `current` while this gap review is performed.

## Acceptance Criteria To Audit

1. Queue admin surfaces show when a guest is Cooling Down and, where practical, the remaining time.
2. Queue admin surfaces explain when Gathering is full.
3. Queue admin surfaces explain when Auto Flow is paused or manual.
4. Queue admin surfaces explain when a guest is waiting for a required credit or eligibility condition.
5. Apply Flow feedback reports when no movement happened and why.
6. Not Here recovery follows the policy: cooldown, return to active Waiting, then normal progression by original queue order with no extra punishment.

## Known Context

Recent Sprint 3 work added/accepted Stage + State visibility, admin guest search/status/timing/history, authorized queue-state overrides, and server-truth reconciliation between admin and guest surfaces. Product Owner suspects much of this blocker-explanation story may already be satisfied. Do not assume that means every criterion passes; inspect current code/behavior against the six criteria.

## Required Output

For each acceptance criterion, report exactly one of:
- **Satisfied** — identify the current implementation/surface and concise evidence.
- **Partial** — identify what exists and the specific missing behavior.
- **Missing** — identify the actual gap.

Then provide one concise recommended smallest implementation slice, if any, needed to close the story.

Do not code. Do not make Product Owner decisions. Do not broaden scope. Do not narrate routine investigation. Return one concise final gap report when inspection is complete.
