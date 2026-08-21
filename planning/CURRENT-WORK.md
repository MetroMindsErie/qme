# Current Work

## Current Slice

Roadmap-source maintainability is now the active technical slice. Billy/Product Owner has decided to modularize the roadmap source so routine product-roadmap edits no longer require Steve to mechanically edit the large monolithic `planning/roadmap-data.js`.

Read `AGENTS.md` and `planning/ROADMAP-MODULARIZATION.md` as the authoritative instructions for this slice.

## Why This Slice Is Authorized

- Billy owns roadmap refinement, prioritization, acceptance/closure, and normal roadmap content edits.
- The current `planning/roadmap-data.js` is too large for Billy's GitHub editing path to safely fetch/replace without truncation risk.
- This has created an unnecessary Billy -> Steve handoff for simple roadmap changes.
- GitHub roadmap source and the live Supabase `qme-roadmap` Planning document can also diverge until `npm run planning:seed` is run.
- Product Owner has authorized a bounded technical refactor to make the roadmap modular and the build/seed workflow reliable while preserving the current Planning schema/UI.

## Product Decisions Already Made

The following decisions are explicit and do not require further Product Owner discussion during this slice:

1. `story-guest-session-persistence-diagnostics` is **done**.
   - Normal iPhone Safari persistence passed refresh, tab close/reopen, full browser close/reopen, and repeat QR entry.
   - Safari Private Browsing behaved ephemerally as expected; recovery worked within the private session and was required again in a new private session.
   - Safari Block All Cookies made guest identity unusable and prevented Reconnect from sticking until normal storage was restored.
   - The exact Rock Hall cause remains unknown, but Product Owner has decided not to spend additional Sprint 3 effort exhaustively chasing browser/device permutations because the practical recovery path is now working.

2. Create a **deferred/future** follow-up story for browser persistence edge cases and degraded-storage UX. Full content requirements are in `planning/ROADMAP-MODULARIZATION.md`.

3. Keep `story-storage-health-recovery-contact-prompt` open, but refine its framing to distinguish browser/session viability from recovery identity/contact. Do not implement that story in this slice.

## Existing Technical Facts

- Root `package.json` now includes:
  - `planning:build` -> `node scripts/build-roadmap-data.js`
  - `planning:validate` -> `node scripts/build-roadmap-data.js --validate`
  - `planning:seed` -> `node scripts/build-roadmap-data.js && node scripts/seed-planning-document.js`
- `scripts/seed-planning-document.js` currently requires `../planning/roadmap-data.js` and upserts the full roadmap object into Supabase `planning_documents` id `qme-roadmap`.
- The existing Planning UI and roadmap schema should remain functionally unchanged.

## Implementation Scope

Steve is explicitly authorized to implement the bounded roadmap modularization described in `planning/ROADMAP-MODULARIZATION.md`, including:

- split authoritative roadmap content into smaller Product Owner-editable source modules;
- generate the existing aggregate `planning/roadmap-data.js` deterministically for compatibility;
- add build/validation tooling and package scripts;
- make `planning:seed` build/validate first or otherwise prevent stale aggregate data from being seeded;
- run the existing authorized Planning seed after validation;
- verify the live Planning UI reflects the updated roadmap;
- update this handoff when complete.

Do not redesign the Planning product, roadmap schema, or UI. Do not start any unrelated Sprint 3 story.

## Validation / Acceptance

- Generated aggregate must be functionally equivalent to the current roadmap before the explicitly delegated Product Owner content changes.
- Existing Planning UI must still work.
- No story IDs/order/content may be silently lost during migration.
- Build/validation should detect obvious structural failures such as duplicate story IDs or broken sprint story references where feasible.
- Live Planning should show `story-guest-session-persistence-diagnostics` as **done** after synchronization.
- The deferred browser persistence/degraded-storage story should be visible in the appropriate future/deferred area.
- `story-storage-health-recovery-contact-prompt` remains open with refined framing, not implemented.

## Next Action

Architecture correction completed in this environment:
- Product-owner content is now fully authored only in canonical `planning/roadmap/*.js` modules.
- `scripts/build-roadmap-data.js` now only assembles, validates, and generates the compatibility artifact (no product-specific mutations).
- `planning/roadmap/*` is the authoritative modular source; `planning/roadmap-data.js` is generated from it.
- `npm run planning:validate` and `npm run planning:seed` are currently blocked in this terminal environment because Node cannot start script-based execution due:
  - `Error: EPERM: operation not permitted, lstat 'C:\\Users\\ebcoo'`

Next step in a normal local environment:
1. `npm run planning:validate`
2. `npm run planning:seed`
3. Verify `/planning` reflects:
   - `story-guest-session-persistence-diagnostics` as **done**
   - `story-browser-persistence-edge-cases-degraded-storage` present in the future area
   - refined framing visible on `story-storage-health-recovery-contact-prompt`

Stop only for a genuine architecture/security/product boundary defined in `AGENTS.md` or the design document. Otherwise complete the coherent slice, validate it, synchronize Planning, verify the live result, update `CURRENT-WORK.md`, and return one concise completion summary.
