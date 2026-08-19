# AGENTS.md

## Operating Style

- Keep routine narration minimal. Share only consequential findings, blockers, validation results, and user-requested status.
- Stay on the current defect or slice unless the Product Owner redirects the work.
- Prefer the smallest safe change that preserves existing product behavior.
- Use targeted investigation and targeted validation while implementing. Run full TypeScript/Vite validation only after the coherent fix is complete.

## Product Authority

- The roadmap is the Product Owner source of truth. Do not silently change product direction, acceptance criteria, terminology, or workflow rules.
- Do not make silent product, security, or architecture decisions. Stop and present a short decision packet when the path requires Product Owner judgment.
- Server-side participation is authoritative. Browser storage may cache identifiers and recovery hints, but it must never determine the current queue Stage or State.
- Admin and guest surfaces must derive queue participation from the same server-side ticket truth.

## Stop vs. Continue

- Continue through normal implementation uncertainty, test failures, and local debugging when the intended product behavior is clear.
- Stop only for consequential unresolved product, security, or architecture decisions, missing credentials/access that block the slice, or conflicting acceptance criteria.
- When stopping, provide options, a recommendation, and why Product Owner input is needed.

## Validation and Deployment

- Use focused checks during development.
- Before considering a defect resolved, run the relevant targeted tests plus the full local TypeScript/Vite validation.
- Do not deploy without explicit instruction.
- Do not present a fix as production-ready if local validation did not run or failed.
