# qME Security Review - Finding-by-Finding Evidence

Date: 2026-07-17

Purpose: prepare an evidence-based response to Ahmed's remaining security findings after the emergency RLS/RPC hardening work. This document separates live-verified closure from repository-only evidence and safe deferrals. It should not be read as a claim that every finding is fully closed.

## Evidence Terms

- **Live verified**: Evan ran the relevant SQL or smoke test against live Supabase / Vercel and shared the result.
- **Repo evidence**: the repository contains an implemented control, migration, or code change, but live verification still needs to be attached or repeated.
- **Open / required**: should be addressed before relying on the affected path as a real control.
- **Deferred**: intentionally not required for the July SOTC pilot, but documented as security debt or future hardening.

## Executive Status Table

| # | Finding | Status | Evidence |
|---|---|---|---|
| 1 | Flexlink intake auth | Partially remediated; env/deploy verification still required | `api/flexlink-intake.js` uses env-backed scrypt hash, signed v2 HttpOnly cookie, and service-role-only Supabase access. Need confirm Vercel envs and passcode rotation. |
| 2 | Guest check-in ticket type | Repo fixed; pending live SQL/regression | `complete_event_check_in_for_guest` now applies a narrow nonprivileged guest allowlist (`general`, `flowers`), defaults empty input to `general`, rejects privileged/unknown values, and preserves preexisting authoritative classifications. |
| 3 | `event_guest_marks` authorization | Mostly remediated; direct exploit test still useful | Live grants/RLS/function checks show anon direct table access removed and guest mark writes routed through token-scoped RPCs. |
| 4 | Completion upsert overwriting staff intent | Partially remediated | Headshot service-start preserves existing mark source/value on conflict. Generic guest completion still overwrites guest mark on conflict; staff/admin completion intentionally writes admin source. |
| 5 | Revoked guest-session reactivation | Repo fixed; pending live SQL/regression | `ensure_guest_session` no longer reactivates an existing inactive token hash on conflict and raises if the presented token maps to a non-active session. |
| 6 | Guest-token lifecycle | Partially remediated | Tokens are hashed in DB and reset-aware in browser, but no full TTL/forget-me lifecycle yet. |
| 7 | `guest_session_matches` implementation | Implemented with hashed token; minor review remains | Uses `public.guest_token_hash(p_guest_token)` and checks `status = 'active'`. Hash uses `extensions.digest`. |
| 8 | Role helper correctness | Mostly implemented; station-role granularity deferred | `has_event_role`, org role, superadmin helpers check active status. Station Supervisor vs Station Staff remains product-finalization work. |
| 9 | Suspended-admin behavior | Mostly implemented; JWT/session revocation deferred | Role helpers check active principals/roles. Existing Supabase Auth sessions are not forcibly revoked. |
| 10 | `event_check_ins` direct grants/policies | Live verified at RLS/grant level | RLS enabled in live output; no broad permissive policies reported; sensitive actions moved behind RPCs. |
| 11 | Remaining direct-client admin writes | Partially remediated | Check-in and queue operations moved to RPCs. Setup/admin CRUD still has direct table paths and should move behind audited RPCs over time. |
| 12 | Role-write audit surface | Partial | Operational RPCs insert audit logs. Some role/setup writes remain direct/API-service-route based and need audit normalization later. |
| 13 | Rate limiting inventory | Deferred / provider-level needed | Flexlink has best-effort in-memory rate limiting. Auth/admin APIs rely mostly on Supabase/Vercel controls. |
| 14 | Password/admin auth controls | Pilot acceptable; long-term invite flow needed | Admin/staff auth uses Supabase Auth and temporary staff password bridge. This is documented as a pilot bridge. |
| 15 | Browser storage and PII | Partially mitigated; lifecycle work remains | Guest tokens/check-in IDs live in localStorage. Reset marker clears event-local state. No full TTL/minimization policy yet. |
| 16 | Principal email lookup | Repo fixed; pending deploy/smoke | Admin/staff principal lookup now trims/lowercases email and uses exact equality with duplicate-match refusal. Long-term canonical identity should still prefer auth user id. |
| 17 | Build/deployment hygiene | Reviewed; deferred | `npm ci` was tested but not adopted because the local Windows/Dropbox workspace hit dependency file-lock issues. Keep `npm install` for SOTC and revisit after the pilot. |
| 18 | Secret comparisons | Flexlink remediated | Flexlink uses `crypto.timingSafeEqual` for passcode hash and cookie signature checks. |
| 19 | `SECURITY DEFINER` safety | Mostly implemented; inventory should be reviewed periodically | New RPCs use `set search_path = public`. Function EXECUTE grants are now live-verified. |
| 20 | Legacy SQL/redeploy | Improved; still procedural risk | Legacy guest queue RPC EXECUTE revoked live. Old group-order pilot is now marked superseded/security-disabled. |
| 21 | Anomaly detection | Partial | Verification SQL checks data anomalies. No automated alerting yet. |
| 22 | Mobile findings | Deferred | July pilot is web/PWA browser based. Native/mobile-specific findings remain separate. |

## Live Verification Already Collected

The following live evidence has been shared by Evan:

1. Data integrity audit returned zero rows/counts for:
   - `missing_check_in`
   - `event_mismatch`
   - `negative_or_null_quantity`
   - `unusual_quantity_over_25`

2. RLS enabled for:
   - `admin_principals`
   - `event_check_ins`
   - `event_group_order_items`
   - `event_guest_credits`
   - `event_guest_marks`
   - `event_staff_assignments`
   - `organization_memberships`
   - `platform_roles`
   - `tickets`

3. Legacy unscoped queue functions no longer executable by anon or authenticated:
   - `public.next_ticket_for_queue(uuid)`
   - `public.restore_ticket_for_queue(bigint, uuid)`
   - `public.check_in_ticket(bigint)`
   - `public.leave_queue(bigint, text)`

4. Sensitive/admin function grant matrix shows expected status `ok`:
   - `admin_apply_queue_pilot_flow(uuid)`: anon false, authenticated true
   - `admin_complete_event_check_in(uuid,text)`: anon false, authenticated true
   - `admin_complete_queue_ticket(uuid,bigint,text,text,uuid,text,text,jsonb)`: anon false, authenticated true
   - `admin_grant_guest_credit_for_check_in(uuid,text,integer,jsonb)`: anon false, authenticated true
   - `admin_mark_queue_ticket_not_here(bigint)`: anon false, authenticated true
   - `admin_release_queue_ticket(bigint)`: anon false, authenticated true
   - `admin_return_queue_ticket_to_waiting(bigint,text)`: anon false, authenticated true
   - `admin_update_event_check_in_ticket_type(uuid,text)`: anon false, authenticated true
   - `reset_event_test_data(uuid)`: anon false, authenticated true
   - `reset_queue_for_queue(uuid)`: anon false, authenticated true
   - guest-scoped RPCs intentionally executable by anon/authenticated where they require a guest token.

5. Smoke tests passed:
   - Evan superadmin login and operations.
   - Jalani event-admin login and reset.
   - Guest check-in/headshot flow.
   - Headshot admin completion and guest self-completion.
   - Reset test data.
   - Limited staff does not see queue Settings.

## Detailed Finding Responses

### 1. Flexlink Intake Auth

Status: **partially remediated; deployment/env confirmation required.**

Repo evidence:

- `api/flexlink-intake.js` uses `COOKIE_NAME = "flexlink_intake_session_v2"`, which invalidates old cookie-name reuse.
- Passcode validation reads `FLEXLINK_INTAKE_PASSCODE_HASH`.
- Hash format is scrypt: `scrypt$16384$8$1$<saltHex>$<keyHex>`.
- Cookie signing reads `FLEXLINK_INTAKE_SESSION_SECRET`.
- Supabase writes require `SUPABASE_SERVICE_ROLE_KEY`; the previous service-role fallback to anon key has been removed.
- Comparisons use `crypto.timingSafeEqual`.
- Session cookie is `HttpOnly`, `Secure`, and `SameSite=Strict`.
- `docs/security-review-ahmed-2026-07-16.md` documents required envs and rotation.

Still needed:

- Confirm Vercel has the new Flexlink env vars set.
- Rotate the exposed passcode if the old hash was ever committed.
- Confirm old cookie/session does not work after deploy.
- Rate limiting remains best-effort in-memory and should be moved to provider-level controls later.

### 2. Guest Check-In Ticket Type

Status: **repo fixed; pending live SQL/regression.**

Evidence:

- `supabase-guest-action-rls-tightening.sql` defines `complete_event_check_in_for_guest(p_check_in_id, p_guest_token, p_ticket_type text default 'general')`.
- It first verifies guest ownership through `get_event_check_in_for_guest`.
- It only self-completes if event metadata has `check_in.completion_mode = 'auto'`.
- It now resolves guest-controlled ticket type server-side:
  - `null` / empty input becomes `general`
  - only `general` and `flowers` are currently allowed guest self-check-in values
  - privileged or unknown values such as `professional_photo`, `staff`, or random strings raise an exception
  - existing authoritative `event_check_ins.ticket_type` is preserved with `coalesce(ticket_type, resolved_ticket_type)`

Risk:

- This is intentionally narrow for the SOTC pilot.
- Eventbrite-imported or staff-assigned classifications remain authoritative because guest self-check-in cannot overwrite an existing ticket type.
- Future configurable registration outcomes still need grant-policy design before broader self-registration.

Recommended fix:

- Run `supabase-pre-sotc-bounded-security-fixes.sql` against live Supabase.
- Run `supabase-pre-sotc-bounded-security-regression.sql`; expected final row is `pre_sotc_bounded_security_regression_passed`.

### 3. `event_guest_marks` Authorization

Status: **mostly remediated; direct exploit test still useful.**

Evidence:

- Live RLS enabled for `event_guest_marks`.
- Emergency remediation revoked anon direct table access.
- Final function grant matrix leaves guest completion RPCs open to anon only where they require guest token ownership.
- `complete_queue_ticket_for_guest` verifies:
  - ticket belongs to guest session through `get_ticket_for_guest`
  - ticket event matches requested event
  - optional check-in belongs to the same guest session
- `mark_queue_service_started_for_guest` verifies:
  - ticket belongs to guest session
  - event matches
  - ticket stage is `released`
  - optional check-in belongs to guest session

Remaining evidence to collect:

- Explicit PostgREST direct `insert` into `event_guest_marks` as anon should fail.

### 4. Completion Upsert Overwriting Staff Intent

Status: **partially remediated.**

Evidence:

- `mark_queue_service_started_for_guest` uses conflict update that preserves existing `mark_value` and `source`, and merges metadata.
- `admin_complete_queue_ticket` intentionally writes/overwrites admin completion marks with `source = 'admin'`.
- `complete_queue_ticket_for_guest` still uses `on conflict (ticket_id, mark_key) do update set mark_value = excluded.mark_value, source = excluded.source, metadata = excluded.metadata`.

Recommendation:

- For guest completion marks, preserve staff/admin source if a staff-created mark already exists, or split service-start/completion keys so guest and staff cannot overwrite each other's intent.
- Current Headshot prototype is safer because service-start and terminal completion are separate operational concepts.

### 5. Revoked Guest-Session Reactivation

Status: **repo fixed; pending live SQL/regression.**

Evidence:

- `ensure_guest_session` inserts by `(event_id, token_hash)`.
- On conflict it now updates profile fields only when the existing session is still `active`.
- If the presented token maps to a revoked/replaced/non-active session, the function raises `guest session is not active`.

Risk:

- Re-presenting a revoked/replaced token should now fail closed instead of restoring authority.
- The current schema does not have a separate `expired` status/expiry policy; that remains part of the broader guest-token lifecycle work.

Recommended fix:

- Run the bounded regression SQL to verify:
  - active returning session continues to work
  - revoked session fails
  - revoked token remains non-active after retry
  - replaced token fails
  - unrelated new valid token can create a fresh active session

### 6. Guest-Token Lifecycle

Status: **partially remediated.**

Evidence:

- Guest tokens are stored client-side in `localStorage` under event/session keys.
- Database stores `token_hash`, not raw token.
- `guestResetService` clears event check-in, guest session, queue ticket, ticket number, queue guest, and guest queue session keys when reset marker changes.

Remaining gaps:

- No hard TTL/expiry enforcement was verified.
- No user-facing "forget this device" yet.
- Token rotation after sensitive events is not implemented.

July position:

- Acceptable for SOTC pilot if reset and fresh links are used during rehearsal/testing.
- Not final for broader production.

### 7. `guest_session_matches` Implementation

Status: **implemented with one caveat from finding 5.**

Evidence:

- `guest_session_matches(target_guest_session_id, target_event_id, p_guest_token)` checks:
  - session id
  - event id
  - `token_hash = public.guest_token_hash(p_guest_token)`
  - `status = 'active'`
- `guest_token_hash` uses `extensions.digest(..., 'sha256')`, avoiding raw-token storage.

Caveat:

- The matcher is only as strong as the lifecycle policy. If revoked sessions can be reactivated by `ensure_guest_session`, this remains incomplete.

### 8. Role Helper Correctness

Status: **mostly implemented; station granularity remains a product decision.**

Evidence:

- `current_admin_principal_id` requires `auth.uid()` and active principal.
- `is_qme_superadmin` requires active platform role.
- `has_organization_role` checks org membership and includes qME superadmin bypass.
- `has_event_role` checks qME superadmin, org admin/universal staff, and active event staff assignment.
- UI now separates event-admin/full management tabs from limited staff operational access.

Known intentional policy:

- SOTC check-in staff may grant photo credit during the July pilot, based on Tanya's operational guidance. This is not assumed as a platform-wide default.

Still open:

- Station Staff vs Station Supervisor should be finalized after SOTC operational testing.

### 9. Suspended-Admin Behavior

Status: **mostly implemented at authorization-check level; session revocation deferred.**

Evidence:

- Role helper functions check `status = 'active'` on principals, platform roles, organization memberships, and event staff assignments.
- Therefore, a suspended role should lose authorization on the next server-side helper check.

Remaining gap:

- Existing Supabase Auth sessions are not forcibly invalidated in the app. A signed-in user may remain logged in but should fail protected actions once role status is inactive.

Recommended later:

- Add admin UI/testing for suspend/deactivate and confirm protected RPCs fail.
- Consider Supabase Auth session revocation if needed.

### 10. `event_check_ins` Direct Grants/Policies

Status: **live verified at RLS/grant level.**

Evidence:

- Live RLS output shows `event_check_ins` rowsecurity = true.
- Sensitive check-in staff actions are moved behind:
  - `admin_complete_event_check_in`
  - `admin_update_event_check_in_ticket_type`
  - `admin_grant_guest_credit_for_check_in`
- Final function matrix shows these admin functions are not executable by anon and are executable only by authenticated users, with server-side role checks.

Remaining evidence to collect:

- Direct anon PostgREST mutation test should fail and can be captured as final evidence if Ahmed wants proof of exploit closure.

### 11. Remaining Direct-Client Admin Writes

Status: **partially remediated.**

Evidence:

- Sensitive event operations now use RPCs for check-in completion, credit grants, queue release/complete/not-here/return-to-waiting/apply-flow/reset.
- `rg` still finds direct `.insert`, `.update`, `.delete` paths in setup/admin services such as event, queue, eCe, expie, organization, staff assignment, and group-order service code.

Assessment:

- This is acceptable only where RLS and role checks are strong.
- Long term, privileged setup writes should move behind named audited RPCs.

### 12. Role-Write Audit Surface

Status: **partial.**

Evidence:

- Operational RPCs insert `admin_audit_logs` for check-in and queue actions.
- Role/admin creation also goes through server/API paths, but the audit surface is not yet fully normalized.

Recommended later:

- Add explicit audit RPCs for role membership changes, staff assignment changes, and setup writes.

### 13. Rate-Limiting Inventory

Status: **deferred / provider-level needed.**

Evidence:

- Flexlink has best-effort in-memory attempt tracking.
- No broad provider-level rate limiting is documented for auth/admin endpoints.

Recommendation:

- Before external exposure, add Vercel/edge/provider rate limiting for:
  - Flexlink intake
  - admin user create/reset endpoints
  - guest check-in creation
  - queue join/complete guest RPCs if abuse is observed

### 14. Password/Admin Auth Controls

Status: **pilot acceptable; long-term invite/reset flow needed.**

Evidence:

- Admin/staff users are Supabase Auth users.
- Staff creation uses a temporary password bridge.
- Temporary password display is documented as a pilot bridge and is removed/changed to reset-password behavior after first login.

Remaining gaps:

- No mandatory first-login password change yet.
- No MFA.
- No password breach/HIBP check.
- Temporary-password metadata should be replaced by a proper invitation/reset mechanism.

### 15. Browser Storage and PII

Status: **partially mitigated; lifecycle work remains.**

Evidence:

- Guest browser state is stored in `localStorage`:
  - `qme:guestSession:<eventId>`
  - `qme:eventCheckIn:<eventId>`
  - `qme:ticket:<queueId>`
  - `qme:ticketNum:<queueId>`
  - queue notice keys for Not Here / Return to Waiting
- Reset marker flow clears local event/session keys.

Risk:

- Any script running in the origin could read localStorage.
- Shared devices can retain event session until reset/fresh behavior clears it.

Recommendation:

- Minimize stored PII.
- Add expiry/forget controls.
- Keep guest tokens scoped to event and avoid account-level power.

### 16. Principal Email Lookup

Status: **repo fixed; pending deploy/smoke.**

Evidence:

- `api/admin-create-user.js`, `organizationStaffService`, and `adminPrincipalAdminService` now normalize email by trimming and lowercasing.
- They use exact equality lookups rather than wildcard-sensitive `ilike`.
- They limit candidate results and fail if multiple exact matches exist.
- Newly created/updated principal emails are stored lowercased.

Risk:

- Email remains an operational identifier, not the ideal canonical identity.
- `%` and `_` no longer broaden matches through `ilike`.
- Duplicate exact matches fail instead of silently choosing a principal.

Recommended fix:

- Prefer auth user id / principal id for future account identity.
- For multi-email support, introduce account identity records rather than treating email as the permanent identity.

### 17. Build/Deployment Hygiene

Status: **reviewed; deferred.**

Evidence:

- `vercel.json` build command remains `cd app && npm install && npm run build`.
- Root `package.json` delegates build to `npm --prefix app run build`.
- `app/package-lock.json` exists, but local `npm ci` verification was blocked by Windows/Dropbox file-lock behavior in `node_modules`.

Risk:

- `npm install` in deployment is less reproducible than `npm ci` against a committed lockfile.
- Changing the production build command immediately before SOTC is higher risk until the lockfile/build path can be verified in a cleaner environment.

Recommended fix:

- Re-test `npm ci` after SOTC in a clean workspace/CI environment.
- Then update Vercel build command if the clean build succeeds and rollback is straightforward.

### 18. Secret Comparisons

Status: **Flexlink remediated.**

Evidence:

- `api/flexlink-intake.js` uses `crypto.timingSafeEqual` through `timingSafeEqualBuffers`.
- It uses that comparison for both passcode-derived hash checks and signed cookie verification.

Remaining:

- Search did not identify another app-level secret comparison path with the same risk. Supabase Auth handles primary password auth.

### 19. `SECURITY DEFINER` Safety

Status: **mostly implemented; periodic review needed.**

Evidence:

- Security-definer SQL functions in the current hardening pass use `set search_path = public`.
- `guest_token_hash` uses `extensions.digest` for pgcrypto call.
- Final live function grant matrix shows sensitive functions have expected anon/authenticated EXECUTE grants.

Remaining:

- Maintain an inventory of all `SECURITY DEFINER` functions.
- Review owner, grants, input validation, and search path before each production event.

### 20. Legacy SQL/Redeploy

Status: **improved; procedural risk remains.**

Evidence:

- Legacy unscoped RPCs have live EXECUTE grants revoked.
- `supabase-group-order-pilot.sql` is now explicitly marked `SUPERSEDED / SECURITY-DISABLED PILOT`.
- `supabase-security-emergency-verification.sql` now includes group-order anonymous write and permissive policy regression checks.

Remaining:

- Old SQL files can still be manually re-run by mistake. Keep superseded files clearly marked, and prefer a real migration system before broader production use.

### 21. Anomaly Detection

Status: **partial.**

Evidence:

- Verification SQL checks:
  - orphan group-order rows
  - event mismatches
  - invalid quantities
  - unusual quantities
  - guest credit rows missing check-in ownership
- Current live result for the group-order data audit is clean.

Remaining:

- No automated alerts.
- No scheduled audit jobs.
- No dashboard for suspicious activity.

### 22. Mobile Findings

Status: **deferred.**

Evidence:

- July SOTC flow is browser/PWA web, not native mobile.
- Mobile browser UX has been tested heavily during alpha, but native app security concerns are separate.

Recommendation:

- Track native/mobile concerns separately when mobile packaging resumes.

## Pre-July Required Work

Recommended before the July 22 SOTC event:

1. Run `supabase-pre-sotc-bounded-security-fixes.sql` and `supabase-pre-sotc-bounded-security-regression.sql` against live Supabase.
2. Confirm Flexlink envs and passcode rotation if Flexlink remains accessible.
3. Run direct anon PostgREST mutation checks for:
   - `event_check_ins`
   - `event_guest_marks`
   - `event_guest_credits`
   - `event_group_order_items`
4. Run updated `supabase-security-emergency-verification.sql` and attach all result sets, especially:
   - table grants
   - policies
   - function grants
   - group-order regression sections
5. Smoke test guest check-in, Headshot join/nearby/completion, superadmin operations, and Jalani event-admin reset after deploying the bounded pass.

## Pre-SOTC Bounded Pass - 2026-07-17

Files changed:

- `supabase-guest-session-foundation.sql`
- `supabase-guest-action-rls-tightening.sql`
- `supabase-pre-sotc-bounded-security-fixes.sql`
- `supabase-pre-sotc-bounded-security-regression.sql`
- `api/admin-create-user.js`
- `app/src/lib/adminPrincipalAdminService.ts`
- `app/src/lib/organizationStaffService.ts`

Behavior changed:

- Revoked/replaced guest sessions no longer become active again when the same token is re-presented.
- Guest self-check-in ticket type is constrained to the current nonprivileged allowlist (`general`, `flowers`) and cannot overwrite existing authoritative classifications.
- Administrative principal email lookup no longer uses wildcard-sensitive `ilike`; exact normalized email equality is used where email fallback remains necessary.

Regression and build checks run locally:

- `rg` confirmed no remaining `email=ilike` / `.ilike('email'...)` paths in `api` or `app/src`.
- `npx tsc -b` passed in `app`.
- `node --check api\admin-create-user.js` passed.
- `npx vite build --outDir $env:TEMP\qme-vite-build-verify --emptyOutDir true` passed.
- Direct `npx vite build` to the default `dist` folder was blocked by a Windows/Dropbox file lock on the existing `dist/images` folder, not by a TypeScript or app build error.
- `npm ci` was attempted but not adopted because the local workspace hit dependency file-lock issues; build command remains unchanged for SOTC.

Live verification still required:

- Run `supabase-pre-sotc-bounded-security-fixes.sql`.
- Run `supabase-pre-sotc-bounded-security-regression.sql` and confirm `pre_sotc_bounded_security_regression_passed`.
- Re-run the existing emergency verification SQL and attach all result sets.
- Deploy the app commit and smoke test guest, superadmin, and Jalani event-admin flows.

## Safe Deferrals

Safe to defer for July if documented:

- Proper staff invite/reset flow replacing temporary password bridge.
- Station Supervisor vs Station Staff product-finalization.
- Provider-level rate limiting beyond Flexlink best-effort.
- Full guest-token TTL/forget-me lifecycle.
- Setup/admin writes moving fully behind audited RPCs.
- Automated anomaly alerts.
- Native mobile hardening.
- Cookie/Food ordering rebuild.

## Group-Order Security Position

The previous dinner/group-order pilot is now treated as **disabled security debt**, not a partially supported feature.

Actions now in repo:

- `supabase-group-order-pilot.sql` is marked superseded/security-disabled.
- Anonymous table access is revoked in the pilot SQL.
- Policy remains scoped to authenticated event-management checks only.
- `supabase-security-emergency-verification.sql` now includes regression checks for anonymous write grants and permissive group-order policies.
- Planning already marks Cookie/Food ordering blocked until the secure replacement path exists.

Future re-enable requires:

- guest-session-owned order records
- verified event and guest ownership
- narrowly scoped RPCs
- station/event authorization for staff actions
- server-side quantity and state validation
- idempotency and audit logging
- explicit draft/submitted/approved/fulfilled states

## Recommended Response Posture to Ahmed

We can say:

- The emergency issues around broad anon/admin RPC exposure have been materially reduced and live-verified.
- The group-order pilot is disabled and explicitly treated as security debt.
- Several items are intentionally not closed yet: revoked guest-session reactivation, ticket-type validation for self-registration, principal lookup identity hardening, full invite/password lifecycle, direct setup-write RPC migration, and rate limiting.
- The remaining work is now bounded and documented rather than unknown.
