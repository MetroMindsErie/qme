# Current Work

## Current Slice

Build the next **pre-call i-Pitch guest-experience slice**: add an informational Finalists experience/card and improve shared-device Check-In with a 15-second automatic reset after successful check-in.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

Registration/check-in remains the production must-have. Preserve the accepted Check-In behavior. Further production voting work remains paused until Kelly and Tricia clarify how they want voting handled.

## Live Acceptance Already Completed

Actual production event:
- organization: **University of Akron Research Foundation**
- event: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- date/time: September 3, 2026, 5:00-8:00 PM ET
- location: Missing Falls Brewery, 540 S Main St., Akron, OH 44311
- logo: `/images/i-pitch.png`

Product Owner live acceptance has now confirmed:
- actual i-Pitch walk-up self-registration succeeds and Auto checks in;
- event-configured post-check-in instruction displays correctly: `Please go to the check-in desk to receive your event package.`;
- shared-device mode `/events/ipitch-092026/check-in?mode=shared` works;
- after shared-device check-in, **Next Guest** successfully clears the prior guest and returns to a clean Check-In screen;
- personal-device and shared-device flows both use the same event instruction.

Do not reopen these accepted mechanics except as required for the auto-reset addition below.

## Part A — Shared-Device 15-Second Auto Reset

Improve the accepted shared-device/kiosk success state so an abandoned iPad does not remain on the prior guest's confirmation screen.

Required behavior:
- applies **only** in shared-device mode (`?mode=shared` / supported shared flag);
- after a successful check-in, keep the existing **Next Guest** button for immediate reset;
- also show a clear countdown such as `Next guest in 15 seconds...`;
- after 15 seconds, invoke the **same reset semantics as Next Guest**: clear event check-in local record, event guest-session token, event-scoped local vote-allocation records, in-memory form/search/result state, and return to a clean Check-In start;
- do not create a second/partial reset path; reuse one reset function/behavior so button and timer cannot diverge;
- cancel/cleanup the timer if the success state/component is left before expiry;
- normal personal-device check-in must never auto-clear the guest session;
- 15 seconds is the current product default for this event/slice; do not build a broad timeout-settings system now unless the existing configuration model makes it trivial.

Add focused regression coverage for countdown/expiry and for no auto-reset on personal-device mode.

## Part B — i-Pitch Finalists Informational Experience

The event home should contain an informational card similar in spirit to the SOTC speaker/content cards. This is **content**, not voting.

Product principle:

> The finalists/speakers exist as event content regardless of whether a voting interaction is enabled. Voting is a separate interaction that may reference the same configured choices/content.

Build the smallest reusable informational event feature that lets i-Pitch present the four finalists on the guest event home and open a detail/list view.

### Guest event-home card

Desired concept:
- title: **i-Pitch Finalists**
- concise description: **Meet tonight's four finalists.**
- card is visible independently of voting state;
- card opens a guest-facing Finalists detail/list view.

Do not label the Finalists card as voting and do not require voting to be enabled for the card to exist.

### Finalists content

Use these four finalists and source descriptions supplied by the Product Owner:

**VeeSafe**

`VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.`

**Quantum Fluent**

`Technical leaders and developers often struggle to find content that is both easy to understand and technically useful. Quantum Fluent helps them move forward with clear executive summaries for decision-makers and practical, hands-on technical content for builders.`

**Vettor**

`What if you walked into the dealership already knowing more than the salesperson? Vettor is the AI powered car-buying advocate in your pocket. Snap a photo of any offer and in seconds see every hidden fee, plus a deal score that shows exactly how your price stacks up against what real buyers actually paid. No more guessing. Know the price, skip the haggle, and save thousands.`

**corVita**

`corVita is a medical device startup developing corConnect, a universal adapter designed to improve compatibility between AED and defibrillator electrode pads. By reducing equipment-change delays during cardiac emergencies, corConnect aims to support faster, more seamless continuity of care from EMS arrival through hospital treatment.`

### Content/configuration model

Inspect existing SOTC speakers/resources/event metadata/eCe patterns before creating a new model. Reuse an existing generic content/list pattern if it fits honestly.

Requirements:
- finalists should be configurable event/eCe content, not hard-coded in the React page;
- each finalist needs at minimum name + description;
- allow an optional image/icon/logo reference if the existing model supports it cleanly, but **do not block this slice on finalist images**;
- do not invent URLs, company logos, speaker names, or other data not supplied by Product Owner;
- preserve the supplied full descriptions in configured content; the event-home card itself should stay concise;
- if admin UI already supports creating this content manually, prefer that path and document the exact steps;
- if a small generic admin/config extension is required, keep it bounded and reusable.

The Product Owner should be able to add/configure the Finalists feature on the actual `ipitch-092026` event without running an i-Pitch-specific SQL script if reasonably possible.

## Voting Relationship — Preserve Separation

The existing voting prototype code may remain in the repository, but **do not continue server-side voting implementation in this slice**.

Architectural intent to preserve:
- Finalists = informational content/entities;
- Voting = optional interactive allocation experience;
- event can show Finalists while voting is off/absent;
- voting can later be turned on/off independently;
- where practical, future voting should reference/reuse the same configured finalist choices rather than requiring duplicate hard-coded company data.

Do not add a visible Voting card to the production i-Pitch event merely because the prototype exists. Kelly/Tricia have not yet confirmed the desired voting operating model.

## Preserve Accepted Check-In Work

Do not regress:
- Auto Check-In;
- imported registration lookup;
- unlisted self-registration;
- required email + Confirm email;
- inline email mismatch validation;
- event-configurable post-check-in instruction;
- shared-device Next Guest reset;
- mode-aware Check-In card copy;
- Feature/Features taxonomy;
- Check-In admin History/search/export and registration-source reporting;
- SOTC behavior.

The Eventbrite export is still outstanding. Do not fabricate imported attendees.

## Validation

At minimum:
- focused shared-mode auto-reset tests;
- focused Finalists configuration/rendering/routing tests;
- existing Check-In tests covering shared Next Guest and personal-device preservation;
- TypeScript;
- full test suite where practical;
- production Vite build using the established temporary output directory if needed.

If SQL/schema changes would be required, stop/report the exact need before assuming they should be applied. Prefer existing metadata/eCe extensibility and normal admin configuration.

## Product Owner Acceptance After Deployment

1. Shared mode: check in a test guest and leave the success screen untouched; verify visible countdown and automatic clean reset at ~15 seconds.
2. Shared mode: repeat and press **Next Guest** before expiry; verify immediate clean reset and no later stray timer behavior.
3. Personal mode: verify successful guest remains identified and is not automatically cleared.
4. Through normal admin configuration, add/verify **i-Pitch Finalists** on `ipitch-092026`.
5. Guest event home: verify `i-Pitch Finalists — Meet tonight's four finalists.` appears independently of voting.
6. Open Finalists and verify VeeSafe, Quantum Fluent, Vettor, and corVita with supplied descriptions.
7. Confirm no production voting feature was unintentionally enabled.

## Handoff

Update this file with:
- auto-reset implementation and timer/reset semantics;
- Finalists data/configuration mechanism;
- exact admin steps to add/configure it on the actual event;
- any reuse of existing speaker/content primitives;
- files changed;
- tests/build results;
- SQL/manual production actions, if any;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark i-Pitch readiness done until the real Eventbrite export is imported and production smoke-tested. Do not mark voting production-ready.
