# Current Work

## Current Slice

Acceptance testing is stopped on Chiderah Emeakoroha / ticket #133.

## Meaningful Findings

- Admin/server transitions correctly moved the existing ticket through Gathering, Gathering / On My Way, Return to Waiting / cooldown, Gathering / On My Way again, Gathering / Nearby, and Your Turn.
- The Admin Queue reflected those transitions correctly.
- The recovered guest queue page remained Waiting through all Stage/State changes, including when Admin showed Your Turn.
- The defect is in recovered guest state retrieval/refresh, not only missing On My Way presentation.
- Server-side ticket state must be authoritative for guest queue and Event Home surfaces.

## Implementation Status

- Added a shared authoritative guest ticket lookup path that checks the active server ticket for the guest session before using a stored browser ticket id as a recovery hint.
- Updated guest ticket recovery to store and use the authoritative server ticket id/number after lookup.
- Updated the recovered guest queue polling path to recover through the shared authoritative lookup if direct ticket fetch fails.
- Updated Event Home queue card enrichment to use the shared authoritative lookup for stored ticket recovery.
- App fix committed and pushed to `main` as `dde88b2`.
- `AGENTS.md` and `planning/CURRENT-WORK.md` committed and pushed to `main` as `ae3a624`.

## SQL / Deployment State

- No SQL changes in this slice.
- App fix pushed to `main`; deployment should proceed through the normal git-triggered hosting path.
- Documentation files were pushed in a separate docs commit.

## Current Acceptance-Test Position

- Expected after local validation: a recovered guest with ticket #133 at Your Turn renders Your Turn after refresh.
- Expected after local validation: recovered Gathering / On My Way, Nearby, and Waiting/cooldown states render from server ticket truth.
- Event Home card should report the same authoritative state label.

## Blockers / Decisions

- None currently.

## Validation

- `npx tsc -b` passed.
- `npx vitest run src/test/queueService.test.ts` passed after re-running outside the sandbox because Node hit `EPERM` resolving `C:\Users\ebcoo`.
- `npx vite build` passed. Vite reported the existing large chunk warning.
- Production `https://www.qme.lol` is serving `/assets/index-CiKo40Gx.js`, the built asset from the validated app fix.

## Next Action

- In the recovered guest browser session, refresh Chiderah / ticket #133 and confirm it renders the server ticket state rather than Waiting.
