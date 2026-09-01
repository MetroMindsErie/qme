# Current Work

## Current Slice

Prepare the actual i-Pitch event for continued Product Owner testing over the next two days while waiting on Tricia's answer about multi-ticket Eventbrite orders.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

## Settled i-Pitch Operating Model

Actual event:
- organization: **University of Akron Research Foundation**
- event: **i-Pitch - September, 2026**
- slug: `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET
- Missing Falls Brewery, 540 S Main St., Akron, OH 44311
- logo: `/images/i-pitch.png`

Check-In operations agreed with Kelly/Tricia:
- guests should primarily check in on **their own phones** using the event QR;
- if a guest is not on the imported registration list, they may self-register on their phone using name + email and check in;
- the shared iPad at the front check-in desk is backup for guests who prefer not to use their phone;
- there is also a back entrance with an intern assisting and directing guests onward;
- after check-in, guests go to the **check-in desk by the front entrance** and receive the evening's event package;
- the Product Owner has updated the event Post-Check-In Instruction to the agreed wording: `Please go to the check-in desk by the front entrance to receive your evening's event package.`;
- Tricia's preferred role is to see the checked-in state and hand the guest their package, not perform routine data entry;
- physical balls remain the production voting method for Thursday; digital voting is not in production scope for i-Pitch.

Existing accepted shared-device behavior remains:
- `/events/ipitch-092026/check-in?mode=shared`;
- no hamburger/menu in shared mode;
- **Next Guest** reset;
- 15-second auto-reset using the same reset semantics;
- personal-device sessions are preserved.

## Part A — Generalize/Admin-Expose Event Test Data Reset

The Product Owner needs to repeatedly test i-Pitch over the next couple of days without rebuilding event configuration.

Inspect the existing SOTC/reset behavior first and reuse/generalize it rather than creating an i-Pitch-only reset.

Required behavior:
- Event Admin/Superadmin only;
- clear/reset event participation/test state needed for another clean test run;
- reset check-in state for imported registrations but **preserve the imported registration list**;
- remove/clear self-registered test participation records for the event as appropriate so repeated walk-up/self-registration tests can start clean;
- preserve event configuration, organization assignment, event metadata, Check-In configuration, content eCes, Finalists, Agenda/Judges content, and other setup;
- preserve source/provenance fields on imported registrations;
- do not delete the event or imported Eventbrite registration list;
- if any voting data exists only in browser localStorage, do not pretend an admin reset cleared server-side voting that does not exist; document any client-side limitation separately;
- provide a clear confirmation/warning before destructive reset and a clear success result after completion.

The goal is a reusable **Reset Test/Event Participation Data** control, not an i-Pitch special case.

## Part B — Finish Event Companion Content Using Existing Content-List Experience

Do not create new code if the existing reusable `content_list` eCe can represent these honestly. Prefer normal admin configuration and document exact steps.

The supplied i-Pitch brochure confirms these event contents:

### Agenda

Create/configure an informational **Agenda** experience with:
- `5:00 PM | Doors Open & Network`
- `5:30 PM | Let's Begin!`
- `7:20 PM | Award Announcements`
- `8:00 PM | See you next I-Pitch!`

Suggested event-home card:
- Name: `Agenda`
- Description: `Tonight's i-Pitch schedule.`
- Detail title: `Agenda`
- Type: Info
- Active

### Meet the Judges

Create/configure an informational **Meet the Judges** experience with:
- `Tammy Deblock | CEO - Aropha, Inc`
- `Gary Wakeford | CEO - Sonostick`
- `Sergio Robles PhD. | Past NSF I-Corps Instructor`

Do **not** expose brochure email addresses unless Product Owner later asks for them.

Suggested event-home card:
- Name: `Meet the Judges`
- Description: `Meet tonight's i-Pitch judges.`
- Detail title: `Meet the Judges`
- Type: Info
- Active

### Existing i-Pitch Finalists

Keep the already built/configurable **i-Pitch Finalists** informational experience independent of voting.

Do not resume production voting work. If useful for Sprint 4 testing, the existing voting eCe/prototype may remain configured **Inactive** so Product Owner can deliberately activate/deactivate it for controlled testing later, but do not make it visible in the production i-Pitch guest experience for Thursday.

## Part C — Eventbrite Import: Inspect Only, Do Not Implement Multi-Ticket Behavior Yet

The Product Owner now has the first Eventbrite CSV export. It includes an **Order ID** and a **Tickets** quantity. Some orders have quantity greater than 1 while only the purchaser's name appears in the current export.

The Product Owner has asked Tricia how they operationally handle multi-ticket orders. **Wait for that answer before deciding how one order with quantity > 1 maps to qME attendee/check-in records.**

For now:
- inspect the existing imported-registration schema/service and document how `Order ID` could be stored as external/source provenance;
- do not import this production CSV yet;
- do not invent guest names for additional tickets;
- do not reconcile Eventbrite imports against qME self-registered guests;
- do not build identity-merging logic;
- repeated future Eventbrite imports should eventually skip already-imported Eventbrite registrations rather than duplicate them, but hold implementation details until the multi-ticket rule is confirmed;
- self-registered qME guests do not have an Eventbrite Order ID; preserve that distinction rather than fabricating an Eventbrite-like value.

When Tricia answers, update CURRENT-WORK with the exact multi-ticket business rule before implementing the production import.

## Preserve Accepted Check-In Behavior

Do not regress:
- Auto Check-In;
- imported-registration lookup;
- self-registration fallback;
- required email + Confirm email;
- inline email mismatch validation;
- event-configurable post-check-in instruction;
- checked-in event-home card using the same instruction;
- shared-device no-menu mode;
- Next Guest + 15-second reset;
- mode-aware Check-In card copy;
- Feature/Features taxonomy;
- History/search/export and `registration_source` visibility;
- SOTC behavior.

## Validation

At minimum:
- focused tests for event-admin reset permissions and reset semantics;
- prove imported registration definitions remain while check-in state resets;
- prove event metadata/eCes/configuration remain;
- prove self-registered test participation is cleared according to the chosen reusable reset semantics;
- verify Agenda/Judges can be configured/rendered through the existing content-list path without schema changes;
- TypeScript;
- full test suite where practical;
- production Vite build using the established temporary output directory if needed.

If reset requires SQL/schema/RPC work, prepare the exact SQL and report it clearly. Do not apply production SQL without explicit Product Owner instruction.

## Product Owner Acceptance After Deployment

1. Use/reset actual `ipitch-092026` test data and verify event setup remains intact.
2. Confirm imported registration records, when present later, remain available but return to not-checked-in state after reset.
3. Confirm self-registered test guests are cleared according to the documented reset semantics.
4. Add/verify **Agenda** on the actual event through normal admin configuration.
5. Add/verify **Meet the Judges** through normal admin configuration.
6. Confirm Finalists remains informational and visible independent of voting.
7. Confirm digital voting is not visible in production i-Pitch unless explicitly activated for controlled testing.
8. Do not import the production Eventbrite CSV until Tricia answers the multi-ticket question and Product Owner approves the mapping.

## Handoff

Update this file with:
- exact reset implementation and what is preserved/cleared;
- permissions/confirmation behavior;
- exact Agenda/Judges admin configuration steps if any manual setup remains;
- Eventbrite schema/import observations, especially Order ID storage and any constraints discovered;
- files changed;
- tests/build results;
- SQL/manual actions, if any;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark i-Pitch readiness done until the production Eventbrite import rule is settled, the real list is imported, and the production guest flow is smoke-tested.
