# Current Work

## Current Slice

Acceptance testing is stopped on Chiderah Emeakoroha / ticket #133.

## Meaningful Findings

- Admin/server transitions correctly moved the existing ticket through Gathering, Gathering / On My Way, Return to Waiting / cooldown, Gathering / On My Way again, Gathering / Nearby, and Your Turn.
- The Admin Queue reflected those transitions correctly.
- The recovered guest queue page remained Waiting through all Stage/State changes, including when Admin showed Your Turn.
- A shared authoritative guest-ticket lookup fix was implemented, validated, pushed, and deployed.
- **Live verification after deployment still fails:** with Admin showing ticket #133 as `Stage: Gathering / State: On My Way`, the recovered guest queue page still renders `Waiting`. The prior fix therefore did not resolve the authoritative current-state path used by the live guest UI.
- This is now a persistent end-to-end guest state defect, not merely an On My Way label problem and not merely a stale localStorage ticket-id problem.
- Root cause found in the guest ticket page: server-session-only recovery was skipped unless the browser already had a stored ticket id or `join=1`. That allowed the pilot ticket page to render its default Waiting state with `pilotTicket = null`.
- Server-side ticket state must remain authoritative for guest queue and Event Home surfaces.

## Implementation Status

- Shared authoritative guest ticket lookup checks the active server ticket for the guest session before using a stored browser ticket id as a recovery hint.
- Guest ticket recovery stores/uses the authoritative server ticket id/number after lookup.
- Recovered guest queue polling can recover through the shared authoritative lookup if direct ticket fetch fails.
- Event Home queue card enrichment uses the shared authoritative lookup for stored ticket recovery.
- App fix committed/pushed as `dde88b2` and is live in production.
- `AGENTS.md` and shared handoff docs are committed on `main`.
- New local fix: `useQueueTicket` now exposes server-only recovery that adopts an existing authoritative ticket without creating a duplicate.
- New local fix: `GuestQueueTicket` runs server-session recovery for pilot queue ticket pages before join/credit/name gates, so a recovered guest page can set `ticketId`, poll the server ticket, and render the current Stage/State.

## SQL / Deployment State

- No new SQL is currently known to be required for this defect.
- Production is serving the validated deployed bundle containing the authoritative-ticket recovery path.
- The defect reproduced against the deployed production build, so the next work is code/data-path diagnosis rather than deployment verification.
- New fix committed/pushed as `f819563` and production is serving the matching bundle `/assets/index-CyKXMH7N.js`.

## Current Acceptance-Test Position

- **Failed live verification:** Admin = Gathering / On My Way; recovered guest page = Waiting after refresh.
- Earlier live testing also showed the recovered guest page remaining Waiting while Admin moved the same ticket through Nearby and Your Turn.
- Do not continue the acceptance matrix until the guest page renders the actual current server Stage/State for ticket #133.

## Blockers / Decisions

- No Product Owner decision is currently required. Intended behavior is already clear: guest and admin must reflect the same authoritative server-side ticket Stage/State.

## Validation

- Prior implementation validation passed: `npx tsc -b`, queue service tests, and Vite build.
- Prior production bundle verification passed, but live acceptance still fails, so local/unit validation is insufficient for this path.
- New local validation passed: `npx tsc -b`.
- New local validation passed: `npx vitest run src/test/useQueueTicket.test.ts src/test/queueService.test.ts` with 50 passing tests.
- New local validation passed: `npx vite build` after one retry due to a transient local `dist/images` lock. Vite reported the existing large chunk warning.

## Next Action

- Steve: read `AGENTS.md` and this file, then diagnose the live end-to-end guest state path for ticket #133 without routine narration.
- Trace the actual production data returned to the guest after recovery: current guest session -> authoritative ticket lookup/RPC/query -> returned ticket row/fields -> polling/refetch behavior -> Stage/State derivation -> guest render.
- Verify whether the guest is receiving the correct ticket but stale stage data, the wrong ticket/row, or a cached/local state object overriding the fetched server row.
- Fix the shared underlying defect rather than adding another display-specific condition.
- Retest Chiderah / ticket #133 in the recovered guest browser session against production bundle `/assets/index-CyKXMH7N.js`.
