# Current Work

## Current Slice

Add a **small reusable guest-event theming layer** so the qME guest experience can visually inherit event branding without becoming a one-off custom site per event.

Read `AGENTS.md` first. Implementation, validation, CURRENT-WORK update, commit, and push to `main` are authorized for this bounded slice. Normal automated deployment from `main` is expected; do not perform a separate/manual deployment unless explicitly requested.

This work follows successful production acceptance of the i-Pitch untouched Eventbrite import and party-size guest flow. Preserve all accepted registration/check-in behavior.

## Product Principle

> **qME owns the UX; the event supplies the skin.**

Do not hard-code `ipitch` CSS/branches. Add a bounded configuration-driven theme capability that can be reused by SOTC, i-Pitch, and future events.

The goal is not a full white-label/theme-builder system tonight. The goal is to make the guest event companion feel visibly connected to the event's own visual identity using a few safe event-level branding controls.

## i-Pitch Visual Direction

The supplied i-Pitch/UARF program and the approved QR check-in sign establish the visual direction:
- i-Pitch logo already configured;
- strong white base;
- purple accent;
- bright blue accent;
- orange/yellow highlight;
- clean, bold section hierarchy;
- keep qME semantic colors for states such as CHECKED IN / success rather than recoloring status meaning arbitrarily.

The current guest page is functionally accepted but still reads mostly as generic qME with an i-Pitch logo. The desired result should feel more like the i-Pitch program/sign while preserving qME layout, accessibility, and interaction patterns.

## Part A — Event Theme Metadata

Inspect the existing event metadata/config helpers before adding a new structure. Prefer existing metadata JSON; no schema migration should be needed unless there is a compelling existing constraint.

Add/read a small event-theme configuration supporting at minimum, where safe:
- primary accent color;
- secondary accent color;
- highlight/accent color;
- optional header/banner/decorative image URL;
- existing event/logo image remains the primary logo mechanism rather than duplicating logo configuration.

If naming needs to differ to fit existing config conventions, keep it generic and document it.

Theme configuration must be optional. Events without theme metadata must render exactly/safely with the existing qME default styling.

Validate color strings before applying them. Invalid/missing theme data must fall back safely rather than breaking rendering.

## Part B — Admin Configuration

Expose the bounded theme controls somewhere natural in existing Event Admin/Edit Event setup rather than requiring SQL or direct metadata editing.

Keep the form simple. Suggested section name:
- `Guest Event Theme`

Suggested fields:
- Primary Accent
- Secondary Accent
- Highlight
- Optional Header/Banner Image URL

Do not build a color-picker design system if plain validated color inputs are faster/safer. A small preview/swatches are optional only if trivial.

Existing Event logo/image configuration remains separate and should continue to work.

## Part C — Apply Theme to Guest Event Companion

Apply event theme only to restrained guest-facing decorative/accent surfaces where it improves identity without changing semantic meaning.

Priorities:

### 1. Guest event header

Make the top of `/events/:eventSlug` visibly event-branded using the configured accents and optional decorative/header asset while preserving:
- event logo;
- event name;
- location/date/time/status information;
- responsive mobile layout;
- readable contrast.

A subtle accent band/rule/background treatment inspired by the i-Pitch sign/program is preferred over a heavy hero redesign.

### 2. Section/content accents

Allow Agenda, Finalists, Judges, and other Event Feature sections/cards to pick up restrained theme accents, for example:
- section heading rule/accent block;
- small border/highlight treatment;
- non-semantic link/action accent.

Do not make every card a different color or reduce readability.

### 3. Ordinary interactive accents

Where qME currently uses generic decorative/action accent colors, allow the event primary accent to influence appropriate guest links/buttons **only where this does not conflict with semantic states**.

Preserve semantic/status meanings:
- checked-in/success green remains semantic;
- destructive/error red remains semantic;
- warning states remain meaningful;
- do not recolor status badges merely for branding.

## Part D — Configure Actual i-Pitch Theme

After implementation, provide exact normal-admin steps to configure i-Pitch using colors visually aligned with the supplied program/sign.

Do not require exact color matching if the source artwork does not expose canonical hex values. Reasonable approximations are acceptable, but document them as chosen theme values rather than claiming they are official UARF brand standards.

Current visual target from the sign/program is approximately:
- purple primary;
- bright blue secondary;
- orange/yellow highlight.

The Product Owner should be able to adjust the values after deployment through admin without code.

Do not add a new bespoke i-Pitch artwork file unless an already-available approved image can be reused cleanly. The existing i-Pitch logo and current event assets are sufficient for this slice.

## Preserve Production-Accepted i-Pitch Behavior

Do not regress:
- untouched Eventbrite CSV recognition/preview/import;
- imported 50 registrations / 66 guests represented model;
- Order ID repeat-import safety;
- party-size check-in copy;
- `Total guests: N` on success and event-home checked-in card;
- separate Checked In vs Guests Represented admin counts;
- Auto Check-In;
- self-registration;
- shared iPad no-menu mode;
- Next Guest + 15-second reset;
- post-check-in front-entrance/package instruction;
- Agenda expanded on home;
- Finalists child cards summary -> full detail;
- Judges child-card content;
- reusable reset;
- SOTC behavior;
- digital voting inactive/not visible for Thursday.

## Validation

At minimum:
- event with no theme metadata renders existing/default guest UI without errors;
- valid theme metadata applies only to intended decorative/accent surfaces;
- invalid color input safely falls back/rejects;
- admin theme fields persist/reload correctly;
- guest header remains readable/mobile-safe;
- Check-In semantic success/error/status colors are not accidentally overwritten;
- Agenda/Finalists/Judges content behavior/routing remains unchanged;
- TypeScript;
- focused tests;
- full test suite where practical;
- production Vite build.

## Product Owner Acceptance

1. Open Edit Event / event setup for `ipitch-092026` and configure the new guest theme through normal admin UI.
2. Use a purple primary, bright-blue secondary, and orange/yellow highlight aligned with the i-Pitch sign/program.
3. Open guest event home on phone-sized viewport.
4. Verify top/header feels visibly i-Pitch-branded while remaining recognizably qME.
5. Verify Agenda / Finalists / Judges receive restrained coordinated accents rather than a broad redesign.
6. Verify CHECKED IN remains semantic green and errors/statuses retain their intended meaning.
7. Verify Check-In, child details, Agenda and party-size behavior all still work.
8. Verify an unthemed event still renders the prior/default qME look.

## Backlog — Do Not Implement in This Slice

Keep these previously discovered future items in planning, but do not expand scope tonight:
- structured Event Content Item editor replacing pipe-delimited `Name | Summary | Full Detail | Image URL` editing;
- generalized Import Registrations profiles / manual source mapping beyond known formats;
- richer event-brand design system/white-labeling;
- item-level tags/links/interactions;
- digital voting production hardening.

## Handoff

Update this FILE (`planning/CURRENT-WORK.md`) with:
- theme metadata/config shape;
- exact admin fields/path;
- guest surfaces affected;
- fallback/default behavior;
- exact i-Pitch theme values recommended/configured;
- files changed;
- tests/build results;
- any manual production configuration steps;
- commit SHA;
- concise Product Owner acceptance steps.

Do not alter or reset the already imported production Eventbrite registration list as part of theming work.
