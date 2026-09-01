# Current Work

## Current Slice

Improve reusable Event Feature management and guest presentation based on live i-Pitch configuration work, while continuing the reusable admin test-data reset. Do **not** implement the production Eventbrite import until Tricia answers the multi-ticket business-rule question.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

## Settled i-Pitch Operations

Actual event:
- organization: University of Akron Research Foundation
- event: i-Pitch - September, 2026
- slug: `ipitch-092026`
- September 3, 2026, 5:00-8:00 PM ET
- Missing Falls Brewery, 540 S Main St., Akron, OH 44311

Event-day operating model:
- guests primarily check in on their own phones via event QR;
- if not on the imported list, they may self-register on their phone with name + email;
- shared iPad at front desk is backup for guests who prefer not to use their phone;
- back entrance has an intern assisting/directing guests;
- after check-in, guest goes to the check-in desk by the front entrance and receives the evening's event package;
- approved event Post-Check-In Instruction is: `Please go to the check-in desk by the front entrance to receive your evening's event package.`;
- physical balls remain the production voting method Thursday.

Existing accepted Check-In behavior must not regress.

## Part A — Reusable Event Admin Test-Data Reset

Continue/finish the reusable reset described previously. Inspect/reuse the existing SOTC reset behavior rather than creating an i-Pitch special case.

Required:
- Event Admin/Superadmin only;
- confirmation before destructive reset;
- reset event participation/check-in test state;
- preserve event, organization, metadata, Check-In settings, eCes/content/configuration;
- preserve imported registration definitions/list but return their check-in state to clean/not checked in;
- clear/remove self-registered test participation records as appropriate for a fresh test;
- clear other server-side event participation test data only where the existing model safely supports it;
- document browser-local-only prototype state separately rather than pretending server reset controls it.

The Product Owner needs to test repeatedly over the next two days without rebuilding i-Pitch.

## Part B — Event Feature Admin Management Gaps

Live configuration exposed that Event Admin can create an eCe but cannot conveniently manage it afterward.

### Edit existing Event Feature

On Admin Event, add an **Edit** action for existing eCes/features. It should reopen the existing eCe form and allow authorized admin to change the existing supported fields, including where applicable:
- name;
- description;
- status;
- sort/order;
- location;
- image/icon URL;
- Guest Detail List/content-list configuration;
- guest presentation configuration introduced below.

Do not require delete/recreate merely to change content or presentation.

### Reorder Event Features

The data model already has `sort`. Expose a simple usable reorder mechanism on the Admin Event feature list.

For this bounded slice, **Up / Down controls are sufficient**; do not spend time on drag-and-drop unless trivial.

Reordering should update persisted sort/order and immediately affect guest event-home order.

Current intended i-Pitch top-level order is approximately:
1. Event Check-In
2. Agenda
3. i-Pitch Finalists
4. Meet the Judges

Do not hard-code those names/order globally.

## Part C — Guest Presentation: Collections and Child Cards

The first `content_list` implementation uses one top-level card followed by a detail/list page. Live Product Owner review refined the desired model.

### Agenda

Agenda is short, immediately useful content. It should be able to render **expanded directly on the event home** without requiring an extra `Open` click.

Agenda source content from the supplied brochure:
- 5:00 PM — Doors Open & Network
- 5:30 PM — Let's Begin!
- 7:20 PM — Award Announcements
- 8:00 PM — See you next I-Pitch!

### Finalists / speakers

The Product Owner does **not** want the four finalists hidden behind one generic Finalists detail page.

Desired reusable presentation:
- a collection/section heading such as **i-Pitch Finalists**;
- individual compact child cards/rows for each configured finalist directly on the event home;
- each child can be clicked/opened for its own detail view;
- child supports name, short summary, full description/detail, and optional image/icon/logo;
- do not hard-code finalist names in React; use configured collection items.

For i-Pitch the children are:
- Quantum Fluent
- VeeSafe
- Vettor
- corVita

Use the full descriptions already captured in previous CURRENT-WORK handoffs / configured content. A concise child-card summary may be configured separately if the model needs it; do not silently rewrite source content into permanent data without making it editable.

### Judges

`Meet the Judges` may use the same reusable collection/child-card pattern:
- Tammy Deblock — CEO, Aropha, Inc
- Gary Wakeford — CEO, Sonostick
- Sergio Robles PhD. — Past NSF I-Corps Instructor

Do not expose brochure email addresses unless Product Owner explicitly requests it.

### Presentation modes

Extend the reusable content/collection experience so Event Admin can choose an appropriate guest presentation rather than forcing every list through the same drill-down card.

The underlying concept should support at least:
- **Expanded list on event home** — appropriate for Agenda;
- **Child cards on event home + child detail** — appropriate for Finalists/Judges;
- preserve existing **single card -> detail list** behavior for content that still wants it.

Keep this generic and configuration-driven. Do not create `if event === ipitch` rendering branches.

## Part D — Future Vote Interaction Attached to Finalist Child

Physical balls remain the real i-Pitch voting system Thursday. **Do not make digital voting production scope for this event.**

However, refine the existing prototype/model so future voting naturally attaches to each finalist child/detail rather than requiring a duplicate list of finalists in a separate voting destination.

Product model:
- Finalist = content/entity;
- Vote = optional interaction available on that entity when voting is enabled/open;
- checked-in eligible guest receives **2 vote credits**;
- UI says **`2 votes remaining`**, then `1 vote remaining`, then `0 votes remaining`;
- a guest with `0 votes remaining` cannot cast another vote;
- for this first model, a cast vote is **committed/permanent** rather than reallocatable;
- do not permanently consume a vote on a single accidental tap: require an explicit confirmation step such as `Give Vettor a vote?` -> `Confirm Vote`;
- after confirmation, one vote credit is consumed;
- show a clear `Your vote` / check state on a finalist that received the guest's vote;
- both votes may go to the same finalist unless/until a future experience config says otherwise;
- when voting is closed/disabled, informational finalist content remains fully available but vote controls are absent/disabled as appropriate.

Architecture direction for later configurability:
- allocation policy may eventually support `Committed when cast` versus `Reallocatable until voting closes`;
- **for now use committed when cast + confirmation**;
- do not build a broad policy engine in this slice.

Important: because physical balls are production voting Thursday, keep any digital voting eCe/interaction **Inactive/not visible** on production i-Pitch unless Product Owner explicitly activates it for controlled testing. Do not imply that this prototype replaces the event's physical voting.

## Part E — Eventbrite Import: Continue to Hold

The first Eventbrite CSV is available and includes Order ID and Tickets quantity. Some orders have quantity > 1 while the current export provides only the purchaser name.

Product Owner has asked Tricia how they handle these multi-ticket orders operationally. Wait for the answer.

Until then:
- do not import the production CSV;
- do not decide one Order ID = one attendee;
- do not invent names for additional tickets;
- do not reconcile imported Eventbrite rows against qME self-registration;
- self-registered guests have no Eventbrite Order ID; preserve that distinction;
- inspect/document existing schema/service support for external Order ID/source provenance if useful, but do not implement speculative multi-ticket mapping.

## Preserve Accepted Behavior

Do not regress:
- Auto Check-In;
- imported-registration lookup;
- self-registration fallback;
- required email + Confirm email;
- inline mismatch validation;
- configured post-check-in instruction on success and checked-in card;
- shared-device no-menu mode;
- Next Guest + 15-second reset;
- personal-device session preservation;
- mode-aware Check-In copy;
- History/search/export and registration-source visibility;
- SOTC behavior;
- existing content-list routes/configurations unless intentionally migrated compatibly.

## Validation

At minimum:
- tests for Edit Event Feature permissions and persistence;
- tests for reorder persistence and guest order;
- tests for each guest content presentation mode;
- child-card -> child-detail routing/configuration tests;
- tests ensuring inactive/closed voting does not interfere with informational finalist content;
- focused vote-credit/confirmation/0-remaining behavior tests if voting prototype is changed in this slice;
- reset permission/semantics tests;
- TypeScript;
- full test suite where practical;
- production Vite build.

If schema/RPC changes are required, prepare exact SQL and report it. Do not apply production SQL without explicit Product Owner instruction.

## Product Owner Acceptance

1. Admin Event: edit an existing i-Pitch feature without recreating it.
2. Reorder Agenda/Finalists/Judges and verify guest home changes order.
3. Set Agenda to expanded-on-home and verify its four times appear without an Open click.
4. Set Finalists to child-card presentation and verify four individual finalist cards appear under the collection heading.
5. Open an individual finalist and verify full details.
6. Verify optional icon/image can be edited after creation.
7. Configure Judges similarly if desired.
8. Verify digital vote interaction remains inactive/not visible in production i-Pitch.
9. In controlled testing only, if voting interaction is enabled, verify 2 -> 1 -> 0 votes remaining, confirmation before commitment, and no vote possible at 0.
10. Verify reusable event reset permits another clean i-Pitch test without deleting configuration/import definitions.

## Handoff

Update this file with:
- Event Feature edit/reorder implementation;
- content collection/presentation configuration model;
- child-detail routing/model;
- any voting-prototype refinement and what remains browser-local/prototype-only;
- reset implementation/status;
- Eventbrite inspection notes only, pending Tricia;
- files changed;
- tests/build results;
- SQL/manual actions, if any;
- commit SHA;
- concise Product Owner acceptance steps.

Do not mark i-Pitch readiness done until the Eventbrite multi-ticket rule is settled, the production list is imported, and production guest flow is smoke-tested.
