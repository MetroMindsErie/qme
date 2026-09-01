# Current Work

## Current Slice

Finish the **pre-call i-Pitch Check-In operating experience** based on live Product Owner testing of the actual production event. Registration/check-in is the production must-have. Pause further voting implementation until Kelly and Tricia clarify their desired event operations.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

## Live Production Context

The Product Owner manually created the real organization and event through qME admin rather than using the prepared setup SQL. This is an important Sprint 4 result: the normal product configuration path works once organization creation is available.

Organization:
- **University of Akron Research Foundation**

Event:
- name: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- date: September 3, 2026
- time: 5:00-8:00 PM ET
- location: **Missing Falls Brewery, 540 S Main St., Akron, OH 44311**
- event logo currently uses `/images/i-pitch.png`
- event status: Active

The Product Owner also added/pushed event image assets under `app/public/images`, including the i-Pitch logo/banner and UARF logo. Do not replace or rename these in this slice unless required for a bug fix.

The prepared `supabase-ipitch-2026-event-setup.sql` is now a fallback/reference only. **Do not run it against production**; the actual event uses slug `ipitch-092026` and was created through qME admin.

Actual production Check-In settings were visually verified:
- Auto check-in;
- completed check-in required before event features;
- imported registration lookup enabled;
- unlisted self-registration enabled;
- email required for self-registration.

Actual guest URL `/events/ipitch-092026` renders correctly. Actual guest Check-In renders imported lookup + self-registration. A live walk-up test guest successfully self-registered and Auto checked in on the actual i-Pitch event.

The real Eventbrite export has not yet been received. Do not invent/fake imported attendees. Final readiness still requires import + smoke test when Kelly/Tricia supply it.

## Product Clarification Before Kelly/Tricia Call

We do **not yet know the final post-arrival operating process**. For now the known instruction after a successful check-in, whether the guest uses their own phone or a shared iPad, is:

> **Please go to the check-in desk to receive your event package.**

Do not tell the guest to vote, explore the event, proceed inside, or take another action that Kelly/Tricia have not confirmed.

Voting remains an experimental concept/prototype. Kelly/Tricia have said they do not want the physical balls, but we do not yet know how they want voting handled. Do not make the pre-call work primarily about voting.

## Required Cleanup 1 — Event-Configurable Post-Check-In Instruction

Live i-Pitch self-registration currently succeeds with generic text similar to:

`Thanks, Joe! You are checked in. Please return to the event page for next steps.`

That is not appropriate for the known i-Pitch operating instruction.

Implement the smallest reusable event-level configuration for the post-check-in instruction.

Required behavior:
- Event admin can configure post-check-in instruction text through the normal Event Create/Edit flow.
- The instruction is used after a successful imported-registration check-in and successful self-registration/Auto check-in.
- Preserve a sensible generic fallback for existing events with no configured instruction; do not require data migration merely to preserve current behavior.
- Configure/enable i-Pitch to display: `Please go to the check-in desk to receive your event package.` through the admin-editable field or provide the Product Owner the exact field/value to enter after deployment.
- Do not hard-code i-Pitch or UARF names into shared Check-In code.

For i-Pitch, the success experience should read naturally as something equivalent to:

`Thanks, Joe! You are checked in.`
`Please go to the check-in desk to receive your event package.`

## Required Cleanup 2 — Shared-Device / iPad Check-In

The event may use a host/registration iPad so a guest can check in **without having their own phone or scanning a QR code**. The final host-vs-guest operating model will be clarified with Kelly/Tricia, but qME needs a safe shared-device path.

Implement the smallest safe reusable shared-device/kiosk Check-In mode using the existing Check-In experience rather than creating a separate i-Pitch registration system.

Required behavior:
- A shared device can be placed directly at an event's Check-In flow.
- Guest can search an imported registration and check in using the same accepted flow.
- If not listed and event configuration allows it, guest can self-register and check in using the same accepted fallback.
- After success, show the same event-configured post-check-in instruction used on a personal phone.
- Provide a clear **Next Guest** action.
- `Next Guest` must clear/reset the prior guest's local qME guest identity/session for this shared-device flow and return to a clean Check-In starting state.
- Guest B must not see, inherit, reconnect to, or act as Guest A.
- Do not require an automatic timed reset for this first slice; explicit Next Guest is sufficient and safer for the Thursday event.
- Do not change normal personal-device behavior merely because shared-device mode exists.
- Keep the mode reusable/configurable rather than hard-coded to i-Pitch.

Device locking is **not** a qME browser feature for this slice. The iPad can use Guided Access operationally to keep the device in the browser/qME screen. Do not build custom OS/browser locking.

## Required Cleanup 3 — Check-In Card Copy Must Match Check-In Mode

Actual i-Pitch guest event page currently shows Check-In card copy:

`Enter your name when you arrive so the event team can confirm your check-in.`

That is misleading because i-Pitch is configured for Auto Check-In with imported lookup and self-registration.

Make the Check-In card description reflect the configured behavior. For an i-Pitch-style Auto/imported/self-registration flow, use concise copy equivalent to:

`Find your registration and check in when you arrive. If you're not on the list, you can register here.`

Do not regress Staff Check-In events; their copy can still explain that staff confirms the check-in. Prefer configuration/mode-aware reusable copy rather than an i-Pitch special case.

## Required Cleanup 4 — Remove Misleading `Sessions` Taxonomy From Guest Event Summary

The actual i-Pitch guest event page shows `1 Sessions` even though the only current event feature is Check-In. This is leftover taxonomy and is misleading.

Make the smallest safe correction:
- do not label Check-In as a `Session`;
- prefer a neutral event-feature/experience count if the count is genuinely useful, or omit the count when it adds little value;
- do not undertake the broader Experience Model redesign in this pre-call slice.

## Preserve Accepted Behavior

Do not regress:
- actual `ipitch-092026` event setup;
- Auto Check-In;
- imported registration search by first name, last name, or email;
- unlisted self-registration;
- required email + Confirm email;
- inline email mismatch validation;
- successful self-registration and Auto completion;
- Check-In History/search/export and `registration_source` reporting;
- SOTC Check-In behavior;
- the existing voting prototype code, even though further voting work is paused.

Recovery phone remains a parked product question. Do not remove/redesign it in this slice.

## Validation

At minimum:
- focused tests for configurable post-check-in instruction;
- focused tests proving shared-device Next Guest clears prior guest identity/state and starts clean;
- tests for mode-aware Check-In card copy;
- relevant guest-event summary/taxonomy test;
- TypeScript;
- full test suite where practical;
- production Vite build using the established temporary output directory if needed.

If any SQL/schema change is required, prepare the exact SQL and report it clearly. Do not assume Product Owner has applied it until confirmed.

## Product Owner Acceptance After Deployment

1. Edit actual i-Pitch event and set/verify post-check-in instruction.
2. Fresh personal-device walk-up: self-register -> Auto check-in -> verify desk/package instruction.
3. Shared-device mode: Guest A self-register/check in -> verify instruction -> Next Guest -> verify clean Check-In screen -> Guest B begins with no Guest A identity/state.
4. Guest event home: verify Auto Check-In card copy no longer says event team will confirm.
5. Verify misleading `Sessions` count is removed/reworded.
6. When Eventbrite export arrives, import it and smoke-test a real imported attendee separately.

## Handoff

Update this file with:
- exact configuration/storage mechanism used for post-check-in instruction;
- exact shared-device entry URL/mode and reset semantics;
- copy/taxonomy changes;
- files changed;
- tests/build results;
- SQL/manual production actions, if any;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark i-Pitch readiness done until the real Eventbrite export is imported and production smoke-tested. Do not mark voting production-ready.
