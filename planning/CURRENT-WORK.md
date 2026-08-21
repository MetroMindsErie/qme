# Current Work

## Current Slice

Sprint 3 guest-session persistence diagnostics are active. Recovery, queue Stage/State visibility, and authorized overrides are already accepted/closed. Current work is product/browser discovery, not implementation.

## Product Outcome Already Accepted

- `story-already-checked-in-recovery` = done.
- `story-admin-guest-search-state-reconciliation` = done.
- `story-authorized-queue-state-overrides` = done.
- `story-guest-session-persistence-diagnostics` remains current.
- `story-storage-health-recovery-contact-prompt` remains current/open and should be refined only after persistence findings are sufficiently understood.

## Live Persistence Testing — Hannah Oswick

### Normal iPhone Safari

- Normal page refresh retained Hannah's recognized guest identity.
- Closing the qME tab and reopening the event retained Hannah's identity.
- Fully closing Safari and reopening retained Hannah's identity.
- Closing Safari and later scanning the SOTC QR reopened the same Safari context and retained Hannah's identity.
- These results suggest ordinary Safari persistence and repeat QR entry work under the tested normal configuration.

### Safari Private Browsing

- A fresh Private Browsing context started at Check-In and did not recognize Hannah, as expected for an ephemeral/private storage context.
- Hannah could find the existing registration and successfully use Reconnect to My Event within that private session.
- After closing the private session and opening a new Private Browsing session, Hannah was no longer recognized and qME returned to Check-In.
- Treat this as expected private/ephemeral-browser behavior requiring recovery, not evidence that normal Safari persistence is broken.

### Safari Block All Cookies

- Starting from a recognized Hannah session, turning **Block All Cookies ON** caused the existing qME browser context to lose usable guest identity and return to Check-In.
- While Block All Cookies remained ON, the event view also degraded to the Check-In-only experience; closing Safari and rescanning the SOTC QR reopened the same tab/context but still showed Check-In-only.
- With Block All Cookies ON, qME could still find Hannah's existing registration and offer **Reconnect to My Event**, but selecting Reconnect appeared to reload and could not establish a usable recovered guest session.
- After turning Block All Cookies OFF, fully closing Safari, and rescanning the QR, the broader SOTC event companion content returned, but Hannah was still unidentified and remained in Check-In.
- With Block All Cookies OFF again, Hannah successfully used Reconnect to My Event and existing participation was restored.

## Important Unresolved Question

The Block All Cookies test reproduces loss of guest identity, but it is **more severe than the original Rock Hall reports** because qME cannot establish/persist the recovered guest session while all cookies/storage are blocked.

The Rock Hall pattern we are still trying to explain is subtler:

> Guest successfully checks in and uses qME during a normal-looking session, but later returns/rescans and qME no longer recognizes that browser.

We have **not yet identified which actual browser setting, privacy configuration, storage eviction behavior, extension/content blocker, QR/browser context, or other mechanism would allow the session to work initially but fail to persist later.** Do not claim Block All Cookies explains what happened at Rock Hall.

Private Browsing is one known mechanism that permits a usable session and later discards it, but we do not know whether affected Rock Hall guests were using Private Browsing.

## External Browser Research Context

- Apple documents Private Browsing as an ephemeral/private context; browser state is not intended to persist like normal browsing.
- Apple warns that blocking all cookies can prevent sign-in and site functionality, consistent with the Hannah reconnect failure while Block All Cookies was enabled.
- WebKit has documented privacy/storage policies and historical storage-lifetime behavior that make browser persistence a real product dependency, but no current evidence yet identifies the exact Rock Hall mechanism.

## Roadmap Refinement Decision — Billy / Product Owner

`story-guest-session-persistence-diagnostics` stays **current**. Refine its product intent around the remaining question rather than mechanically exhausting every browser permutation.

The story should preserve these accepted findings:

1. Normal iPhone Safari persistence passed refresh, tab close/reopen, full Safari close/reopen, and repeat QR entry in the tested configuration.
2. Private Browsing is intentionally ephemeral; recovery works within a private session, but a new private session requires recovery again.
3. Block All Cookies can make qME lose guest identity and prevents successful recovery from sticking while the restriction remains enabled; recovery succeeds again after normal storage is restored.
4. These findings prove browser storage availability materially affects qME identity persistence, but **do not yet explain the original SOTC pattern of a session that worked and later disappeared under apparently normal use.**
5. Remaining diagnostic work should focus specifically on plausible conditions that allow initial use but later discard/evict qME identity, rather than repeating already-understood destructive-storage tests.

Refine the story's acceptance focus to:

- identify/test a small number of plausible iPhone/Safari conditions that can support an initial qME session but later lose first-party browser identity;
- distinguish expected ephemeral/privacy behavior from a qME defect;
- document what qME can detect/prevent versus what must be handled through recovery UX;
- stop once the remaining SOTC pattern is reasonably explained or evidence shows it cannot be reproduced reliably; exhaustive browser permutation testing is not required.

`story-storage-health-recovery-contact-prompt` should remain open. The Block All Cookies test gives it a concrete future failure case: qME should eventually avoid a silent reconnect/reload loop when required browser storage is unavailable. Do not implement that story yet while persistence discovery is still active.

## Code / SQL / Deployment State

- No new application code or SQL is requested from this diagnostic checkpoint.
- Accepted recovery and queue fixes remain deployed and live-tested.
- Planning synchronization for the previously closed stories was completed before this diagnostic session.

## Next Action

Billy/Product Owner should continue the persistence investigation before handing implementation work to Steve.

Steve should not begin implementation from this file. If Steve is later asked to proceed, the first delegated task may be a mechanical roadmap synchronization of Billy's persistence-story refinement, followed by stop/no implementation unless Billy explicitly authorizes a technical story.
