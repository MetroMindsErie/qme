# Current Work

## Current Slice

Finish Sprint 3 story `story-explain-queue-automation-blockers` — **Explain queue automation blockers to operators** — with a small admin summary visibility change based on 2026-08-25 live acceptance testing.

Read `AGENTS.md` first. Implementation is authorized. Keep this slice tightly bounded to the headline queue summary cards and directly related wording/tests. Do not redesign queue flow, change queue automation semantics, change guest flow, change roadmap status, deploy SQL, or alter production data.

Current implementation status:
- Added Waiting/Gathering headline subcounts in `app/src/pages/admin/AdminQueueDashboard.tsx`:
  - Waiting shows `N COOLING` when cooldown count is non-zero.
  - Gathering shows compact non-zero `OMW`, `NRBY`, and `STALE` subcounts computed with the same stale-window semantics used by auto-flow (nearby and current On My Way excluded from stale).
- Validation results:
  - `npm --prefix app test src/test/queueService.test.ts` — blocked in this environment with `EPERM: operation not permitted, lstat 'C:\\Users\\ebcoo'`.
  - `npm --prefix app run build` — blocked in this environment with `EPERM: operation not permitted, lstat 'C:\\Users\\ebcoo'`.
- Fix applied:
  - corrected Waiting render variable typo from `waitingCooldownCount` to `waitingCoolingCount` in `app/src/pages/admin/AdminQueueDashboard.tsx`.
- Next: rerun targeted tests and full build in an environment without the EPERM restriction.

## Product Decision / Accepted Flow Behavior

Live SOTC acceptance on 2026-08-25 confirmed:
- stale Gathering guests no longer starve replenishment;
- stale guests remain recoverable in Gathering rather than being punished with automatic Return to Waiting/cooldown;
- fresh Gathering guests count toward effective Target during the configured stale window;
- Auto assist replenishes effective Gathering without Apply Flow;
- Manual mode does not auto-replenish; Apply Flow runs the flow once;
- Nearby is the normal callable signal for Your Turn;
- guest/admin state remained synchronized through Gathering -> Nearby -> Your Turn -> Completed;
- Return to Waiting and explicit Not Here both produced Waiting + Cooling Down, with remaining cooldown visible to operators; after cooldown, guests returned to ordinary Waiting for flow;
- the 60-second accelerated stale test caused repeated replacement waves as expected because unattended test guests repeatedly became stale; with the realistic 300-second setting, a replacement wave remained fresh and Auto did not continue inviting during the observation window.

`Gathering Max` remains in the current configuration model and may be >= Target, but stale guests do not consume effective automation capacity. Do not change Target/Max semantics in this slice.

## Final Visibility Gap

The headline cards currently show raw totals such as `25 GATHERING` and already show Nearby underneath. Because raw Gathering can include many stale/recoverable guests, operators need a compact explanation directly in the summary rather than inferring effective readiness from individual rows.

### Required summary display

Keep the existing large headline totals. Add compact operational subcounts where non-zero/relevant:

- **WAITING**: show `N COOLING` for guests currently in Cooling Down.
- **GATHERING**: show compact subcounts for:
  - `N OMW` — current On My Way;
  - `N NRBY` — current Nearby;
  - `N STALE` — Gathering guests whose configured stale window has elapsed and who are not currently Nearby.

Use concise separators/layout appropriate to the existing card width, e.g. `2 OMW · 1 NRBY · 15 STALE`. Do not add a new panel or generalized diagnostics UI.

Zero values may be omitted where that improves readability; preserve enough context that the existing Nearby visibility is not lost when zero. Follow existing UI conventions and keep mobile layout readable.

The stale calculation shown to operators must use the same effective timing semantics as the queue flow logic so the summary does not disagree with automation.

## Related Findings — Not In This Slice

- Guest-facing **On My Way** is not currently selectable even though On My Way exists in data/admin/progress UI. A separate roadmap story now tracks that work.
- Reconnect confirmation copy and immediate Back-to-Event refresh are tracked separately and do not block this story.
- Do not implement either of those here.

## Acceptance

Validate that:
- Waiting headline correctly shows active Cooling Down count.
- Gathering headline preserves raw Gathering total while showing OMW / NRBY / STALE operational subcounts.
- A stale Gathering guest remains included in the raw Gathering total and STALE subcount but does not become Nearby/OMW merely from display logic.
- Nearby/OMW are not double-counted as stale under the effective flow semantics.
- Existing headline counts, responsive/mobile layout, admin search, and queue controls remain intact.
- Existing targeted tests and full app build pass.

Do not change roadmap story status. Stop after implementation/validation and report the exact UI behavior for Product Owner acceptance.
