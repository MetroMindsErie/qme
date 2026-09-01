# Current Work

## Current Slice

Prepare a **real i-Pitch September 3 event in qME** for Product Owner review with Kelly and Tricia, while beginning a bounded **digital voting prototype** that demonstrates qME as an interactive event platform beyond registration.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

The Product Owner has a call with Kelly and Tricia today, two days before the event. Prioritize something real and demonstrable. **Registration/check-in is the production must-have and must not be endangered by voting work.**

## Product Direction

qME is evolving from a product focused on avoiding physical lines into a platform focused on **removing friction throughout the guest's event journey**. Queueing remains an important capability, but is not the definition of an Experience.

For this immediate slice, do not attempt to implement the broader Experience Model. Use i-Pitch to prove two concrete experience shapes:
1. registration/check-in — already generically accepted;
2. interactive voting — a bounded prototype using reusable credit/allocation concepts where practical.

## Part A — Create / Configure the Actual i-Pitch Event

Create or prepare the production event through existing qME event/admin mechanisms. Do not hard-code i-Pitch behavior into shared code.

Known event information:
- Event: i-Pitch
- Date: September 3, 2026
- Time: 5:00-8:00 PM
- Location: Missing Falls Brewery, Akron
- Current production commitment: registration/check-in

Configure Check-In using the already accepted generic behavior:
- Check-In Mode = Auto;
- imported-registration lookup enabled;
- unlisted self-registration fallback enabled;
- email required for self-registration;
- completed check-in required for participation.

The actual Eventbrite attendee export has **not yet been received**. Do not invent its schema or fake a production import. Prepare the event so the real export can be mapped/imported quickly when Kelly/Tricia provide it.

Use appropriate i-Pitch guest-facing branding/copy without inventing organizer claims. If an image/logo is not already available in repo/event data, use an existing neutral qME/event treatment rather than blocking setup.

Before handoff, report:
- whether the event was created/configured and its slug/link;
- any fields/configuration still requiring Product Owner entry;
- the exact existing import workflow to use when the Eventbrite export arrives;
- how to generate/use the guest QR/direct link;
- any SQL/manual production action required.

## Part B — Bounded i-Pitch Digital Voting Prototype

Inspect existing credits, Passport/Scan Code Adventure, guest actions, event metadata/configuration, and admin patterns first. Reuse existing primitives where sensible; do not distort the architecture merely to ship a demo.

### Event voting concept

The physical i-Pitch activity uses balls to vote for speakers/companies. The digital prototype should preserve that mental model while implementing it as a configurable interactive allocation activity.

Each eligible **checked-in guest receives 2 vote credits / digital balls**.

For this event, the four configured choices are:

1. **VeeSafe**
   `VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.`

2. **Quantum Fluent**
   `Technical leaders and developers often struggle to find content that is both easy to understand and technically useful. Quantum Fluent helps them move forward with clear executive summaries for decision-makers and practical, hands-on technical content for builders.`

3. **Vettor**
   `What if you walked into the dealership already knowing more than the salesperson? Vettor is the AI powered car-buying advocate in your pocket. Snap a photo of any offer and in seconds see every hidden fee, plus a deal score that shows exactly how your price stacks up against what real buyers actually paid. No more guessing. Know the price, skip the haggle, and save thousands.`

4. **corVita**
   `corVita is a medical device startup developing corConnect, a universal adapter designed to improve compatibility between AED and defibrillator electrode pads. By reducing equipment-change delays during cardiac emergencies, corConnect aims to support faster, more seamless continuity of care from EMS arrival through hospital treatment.`

### Voting behavior for i-Pitch

- eligibility: checked-in guest;
- allocation: 2 total votes/balls per eligible guest;
- guest may allocate both votes to one competitor or split 1 + 1;
- voting may be open from the beginning of the event;
- while voting is open, guest can change/reallocate their own votes;
- once voting is closed, allocations lock;
- guest can always see their own current allocation;
- aggregate totals are **not visible to guests while hidden**;
- voting state and results visibility are separate controls;
- admin can switch aggregate results from Hidden to Visible;
- desired reveal metaphor: **four glass cylinders of balls**, one for each competitor; before reveal do not leak aggregate totals, after reveal visualize aggregate balls/totals across the four cylinders.

Treat the glass-cylinder visualization as an important prototype goal, but do not sacrifice data correctness, eligibility, allocation limits, or registration stability for visual polish.

### Admin controls / visibility

At minimum inspect/prototype:
- voting Open / Closed;
- results Hidden / Visible;
- aggregate totals visible to authorized admin even when hidden from guests;
- four configured choices and descriptions;
- ability to verify an individual guest cannot exceed 2 total allocated votes.

Do not add SMS, external identity, payment, prizes, or unrelated features.

### Architecture guardrail

Do not hard-code a one-off `VeeSafe/Quantum Fluent/Vettor/corVita` voting engine if a small reusable model is practical. The underlying concept should be recognizable as:

> Allocate N event-issued credits among configured choices; optionally allow reallocation while activity is open; independently control aggregate-result visibility.

The i-Pitch rendering may use digital balls/glass cylinders. A future activity could render the same allocation primitive differently.

If implementing the reusable primitive safely requires more work than is appropriate before today's call, build the smallest honest prototype and document what is prototype-only versus reusable. **Do not jeopardize Check-In.**

## Live Acceptance / Demo Target

For today's Kelly/Tricia call, optimize for demonstrating:
1. the actual i-Pitch event in qME;
2. the accepted guest registration/check-in flow, with the explanation that their Eventbrite list will populate lookup once supplied;
3. if feasible in the available time, a guest-facing i-Pitch voting prototype showing the four competitors and two digital votes/balls;
4. an admin concept/control for opening/closing voting and hiding/revealing results.

Production registration is required. Voting can remain explicitly experimental until Product Owner acceptance.

## Broader Sprint 4 Thinking — Do Not Implement in This Slice

Preserve these principles for later Experience Model work:
- qME removes friction across the guest journey; queues are one orchestration strategy, not the product definition;
- Check-In can itself be a queue/service flow when staff action is required even when self-service can collapse the physical wait;
- party size is first-class demand information: one waiting party may represent one or many people;
- service time, party size/load, active service capacity, and resource compatibility can improve wait prediction beyond raw line length;
- an Experience may combine eligibility, capacity, admission/commitment, service/participation, interaction, completion, recovery/exception handling, and guest guidance;
- Scan Code Adventure is a placeholder/example for interactive activities, not a queue;
- credits are reusable event-issued entitlements: vote credits, drink credits, headshot credits, tasting credits, etc.;
- food/bar can eventually support guest ordering, host receipt/confirmation/editing, internal fulfillment, Ready notification, credits, and demand/service-time estimation without requiring qME to replace the establishment's internal POS/process;
- restaurant/table wait management should consider party size and table/resource compatibility; advance reservations are a future consideration and **not to be acted upon now**;
- Perfect Phit-style tag matching may later connect guest interests/goals with tagged booths, speakers, people, products, and activities;
- future journey orchestration can combine interests/goals, matching, guest history, current location, maps/travel time, schedule, waits, service times, commitments, and remaining event time to recommend what the guest should do next;
- digital waits may eventually be dynamically/spontaneously enabled for booths/services when demand develops rather than requiring every experience to be defined as a queue in advance;
- host-side matching/priority is a separate policy question: matching information may be useful to hosts, but opaque 'interesting guest jumps the line' behavior must not become the default.

## Handoff

Update this file with:
- actual i-Pitch event setup status and link/slug;
- voting implementation/prototype status;
- exact files changed;
- what was reused versus newly introduced;
- tests/build results;
- SQL/manual actions, if any;
- commit SHA;
- concise demo steps for Product Owner before the Kelly/Tricia call.

Do not mark the i-Pitch readiness story done until the real Eventbrite export is imported and the production guest flow is smoke-tested. Do not mark voting production-ready until Product Owner live acceptance.
