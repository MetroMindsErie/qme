# qME Security Review - Ahmed Remediation Pass

Date: 2026-07-16

This pass verifies Ahmed's findings against the repository and creates bounded emergency fixes. Live production status still requires running the Supabase verification script and applying the remediation/function SQL in Supabase.

## Verification Plan

1. Inspect current source SQL and app code for the five emergency findings.
2. Patch confirmed source-level vulnerabilities without broad architecture changes.
3. Add live Supabase verification SQL for policies, grants, function exposure, and data audit.
4. Add remediation SQL for confirmed table-policy/function-grant closures.
5. Run build/static checks.
6. Apply SQL manually in Supabase and rerun verification before claiming production closure.

## Emergency Matrix

| Finding | Status | Evidence | Fix | Test | Deployment action | Remaining risk |
|---|---|---|---|---|---|---|
| `event_group_order_items` anonymous writes | Confirmed in source; live status requires Supabase verification | `supabase-group-order-pilot.sql` granted `select, insert, update, delete` to `anon` and used `using (true)` / `with check (true)` | Source SQL now revokes anon and uses staff/admin-scoped policy; emergency remediation SQL does the same | Run verification script policy/grant sections; attempt anon and unauthorized authenticated insert/update/delete should fail; keep a regression check for permissive group-order write access | Run `supabase-security-emergency-remediation.sql` | Guest group ordering is disabled security debt until rebuilt through guest-session-owned RPCs |
| `event_guest_credits` anonymous read exposure | Confirmed in older source; live status requires Supabase verification | `supabase-sotc-rls-hardening.sql` had `event_guest_credits_select_pilot using (true)`; newer guest-action SQL scoped staff reads | Emergency remediation SQL drops permissive credit policies and revokes anon direct table access | Run verification script; anon direct select should fail; guest credit RPC should still work | Run remediation SQL; rerun guest credit smoke test | Existing data may have been enumerated before closure |
| Flexlink committed access hash/cookie bearer | Confirmed in source | `api/flexlink-intake.js` committed `ACCESS_HASH` and used it as cookie value; service-role fallback accepted anon key | Removed committed hash, removed anon-key fallback, added env-backed scrypt verifier and signed short-lived v2 cookie | `node --check api/flexlink-intake.js`; forged old cookie should fail after deploy because cookie name changed | Set `FLEXLINK_INTAKE_PASSCODE_HASH` and `FLEXLINK_INTAKE_SESSION_SECRET`; rotate passcode; redeploy | In-memory rate limiting is best-effort in serverless; provider-level rate limiting remains follow-up |
| Credit consumption by guest name | Confirmed in guest/admin SQL source | `complete_queue_ticket_for_guest` and `admin_complete_queue_ticket` matched credits by `metadata->>'guest_name'` when `p_check_in_id` was null | Updated SQL functions now require `p_check_in_id` when consuming credit and only match credits by check-in id | Duplicate-name regression: forged name with no check-in should fail | Apply updated `supabase-guest-action-rls-tightening.sql` and `supabase-admin-queue-action-rpcs.sql` | Must confirm all call sites still pass check-in id for credit-consuming completions |
| `grant_qme_superadmin` bootstrap escalation | Confirmed source risk; live grant status requires Supabase verification | Function is `SECURITY DEFINER`; older foundation SQL granted broad table access and did not revoke public execute | Emergency remediation revokes function execute from public/anon/authenticated | Verification script routine grants should show no anon/auth execute | Run remediation SQL | Bootstrap should only be run by DB owner/service process; future invitation flow needs audit/reauth |

## Manual Secret Rotation

Set these in Vercel before deploying the Flexlink fix:

- `FLEXLINK_INTAKE_PASSCODE_HASH`: scrypt hash in the format `scrypt$16384$8$1$<saltHex>$<keyHex>`
- `FLEXLINK_INTAKE_SESSION_SECRET`: high-entropy random value, at least 32 bytes
- `SUPABASE_SERVICE_ROLE_KEY`: required; the Flexlink API now fails closed without it

Rotate the Flexlink passcode because the old source hash must be treated as compromised. Old cookies are invalidated by the new cookie name `flexlink_intake_session_v2`.

Generate a scrypt hash locally with a one-off script that does not print or commit the passcode itself.

## Notes For Ahmed Follow-Up

- The dynamic admin/staff assignment model is preserved.
- UI visibility remains separate from authorization.
- Group ordering is intentionally locked down rather than rebuilt during this emergency pass. Treat the prior group-order pilot as disabled security debt, not as a partially supported feature.
- Production closure depends on applying SQL and rerunning verification in the deployed Supabase project.
- Station-level privilege refinement is documented in `docs/station-role-visibility-matrix-v1.md`, but it is intentionally not being overbuilt before SOTC asks for distinct Station Staff / Station Supervisor permissions. The current pilot can create named Event Admins easily, and the security boundary still relies on role-checked RPCs/RLS rather than UI hiding alone.

## Group Ordering Re-Enablement Bar

Do not rebuild ordering during the emergency security pass. Preserve existing group-order data for audit unless corruption is confirmed, but clearly mark the old pilot SQL as superseded/dangerous so it cannot be reapplied accidentally.

Future re-enablement requires:

- guest-session-owned order records;
- verified event and guest ownership;
- narrowly scoped RPCs;
- station/event authorization for staff actions;
- server-side quantity and state validation;
- idempotency and audit logging;
- explicit separation between draft, submitted, approved, and fulfilled orders.
