# Roadmap Modularization

## Why this exists

Billy owns product-roadmap refinement, prioritization, and story status. The current monolithic `planning/roadmap-data.js` has become too large for Billy's GitHub editing path to safely fetch and replace without truncation risk. That forces unnecessary handoffs to Steve for mechanical roadmap edits.

This technical slice should remove that bottleneck without redesigning the Planning product.

## Product / Ownership Goal

After this work:

- Billy can directly edit a small roadmap source file for the relevant sprint/theme/story without Steve.
- Steve is not required for routine roadmap status, notes, acceptance-criteria, prioritization, or story-addition changes.
- The Planning UI continues to consume the same effective roadmap schema and behavior it uses today.
- The live `qme-roadmap` planning document is synchronized from the authoritative roadmap source through a reliable, explicit mechanism.

## Current State

- `planning/roadmap-data.js` is the large aggregate roadmap source.
- Root `package.json` defines `npm run planning:seed`.
- `scripts/seed-planning-document.js` currently `require()`s `../planning/roadmap-data.js` and upserts the complete object to Supabase `planning_documents` with id `qme-roadmap`.
- GitHub source and live Planning can diverge until `planning:seed` is run; this has already caused visible stale story statuses.

## Desired Architecture

Keep the existing aggregate shape for compatibility, but make it generated from smaller Product Owner-editable modules.

Preferred shape (adjust names only if the existing code strongly favors another small-module organization):

```text
planning/
  roadmap/
    meta.js
    sprint-3.js
    next.js
    soon.js
    future.js
    completed.js
  roadmap-data.js          # generated aggregate / compatibility artifact
  ROADMAP-MODULARIZATION.md
  CURRENT-WORK.md
scripts/
  build-roadmap-data.js
  seed-planning-document.js
```

If splitting by sprint still leaves a source file too large, split Sprint 3 by theme, for example:

```text
planning/roadmap/sprint-3/
  archive-reports.js
  guest-session-recovery.js
  recall-operator-controls.js
```

The guiding requirement is not a particular folder naming scheme. It is that Billy can fetch and safely edit the relevant source unit directly without retrieving/replacing the entire roadmap.

## Compatibility Requirements

- Preserve current story IDs, sprint IDs, epic/theme IDs, status vocabulary, acceptance criteria, notes, and ordering unless the Product Owner explicitly changes them.
- Do not redesign the roadmap schema or Planning UI as part of this slice.
- Preserve `require('../planning/roadmap-data.js')` compatibility for existing scripts unless changing the consumer is clearly simpler and equally safe.
- Generated `planning/roadmap-data.js` must be deterministic and reviewable.
- Avoid hand-maintained duplicate roadmap content. One set of modular source files should be authoritative; the aggregate is generated.
- Add a validation/build command that fails on duplicate story IDs, missing story references from sprint lists, or malformed aggregate structure if feasible without broad tooling work.

## Build / Seed Workflow

A preferred workflow is:

1. Edit modular roadmap source.
2. Run a roadmap build command that regenerates `planning/roadmap-data.js` deterministically.
3. Validate the generated roadmap.
4. Run `planning:seed` to synchronize the live `qme-roadmap` document when authorized.
5. Verify the live Planning UI reflects the committed source.

Update root `package.json` with clear scripts, for example:

- `planning:build`
- `planning:validate` (or validation folded into build)
- `planning:seed`

`planning:seed` should build/validate first or otherwise fail safely if the aggregate is stale.

## Automation Boundary

Do not introduce secret-bearing GitHub Actions or automatic production writes unless Product Owner explicitly authorizes that deployment model. For this slice, it is sufficient to make synchronization reliable and one-command from the existing authorized local/Steve environment.

A later automation can make roadmap commits automatically synchronize Planning if we decide the credential/deployment model is appropriate.

## Acceptance Criteria

- The monolithic roadmap is split into smaller authoritative source modules appropriate for direct Billy edits.
- `planning/roadmap-data.js` becomes a generated compatibility artifact rather than the normal hand-edited source.
- Generated aggregate is functionally equivalent to the pre-modularization roadmap before any Product Owner content changes.
- Existing Planning UI works without product-visible regression.
- Existing `planning:seed` path continues to synchronize the `qme-roadmap` Supabase document, with build/validation integrated so stale aggregate data is not accidentally seeded.
- There is a concise documented command sequence for Billy/Steve handoff and local verification.
- Steve verifies a seed and live Planning render after modularization.
- No unrelated product stories or roadmap content are changed during the architecture migration, except the explicitly delegated persistence-story disposition below.

## Explicit Product Roadmap Changes Delegated With This Slice

Billy has already made these Product Owner decisions; Steve may apply them mechanically while migrating the roadmap source:

1. `story-guest-session-persistence-diagnostics` -> `done`.
   - Completion notes should preserve that normal iPhone Safari passed refresh, tab close/reopen, full browser close/reopen, and repeat QR entry.
   - Safari Private Browsing was confirmed intentionally ephemeral; recovery worked inside the private session, and a new private session required recovery again.
   - Safari Block All Cookies made guest identity unusable and prevented Reconnect from sticking until storage was restored.
   - The exact Rock Hall cause remains unknown. Product Owner explicitly decided not to continue spending Sprint 3 effort chasing every browser/device configuration because recovery now mitigates the practical failure.

2. Add a deferred/future story: `story-browser-persistence-edge-cases-degraded-storage` (name may be adjusted only for repository naming consistency), titled approximately **Browser persistence edge cases and degraded-storage UX**.
   Preserve for later investigation:
   - what browser/device/privacy/storage conditions allow an initially usable qME session but later discard guest identity;
   - Android/Chrome or other browser testing if future evidence warrants it;
   - browser-managed storage eviction/pressure and content-blocker/privacy-extension behavior;
   - whether the SOTC-era qME storage implementation contributed;
   - why Safari with Block All Cookies reduced the event view to Check-In-only instead of the broader event companion;
   - why Reconnect could be offered while storage was blocked but only reloaded/failed to establish a usable session;
   - whether qME should provide an explicit degraded/stateless mode or storage-specific guidance in the future.

3. Keep `story-storage-health-recovery-contact-prompt` open, but refine its notes/product framing:
   - distinguish **session viability** (can this browser maintain required qME state?) from **recovery identity/contact** (how can we identify the guest again later?);
   - optional phone/email does not solve a browser that cannot persist the session;
   - intervention should preferably be targeted to a detected risky/unusable storage condition rather than burdening every guest;
   - do not implement this story as part of the roadmap modularization slice.

## Stop Conditions

Steve should stop for Product Owner input if preserving compatibility would require a meaningful Planning schema redesign, a secret-bearing deployment architecture, or a product-content decision not explicitly delegated above.

Routine module boundaries, build-script implementation, validation mechanics, and migration/refactoring choices are Steve implementation decisions and do not require interruption.
