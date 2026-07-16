-- qME admin/staff RPC hardening verification.
-- Run after the current admin/queue/check-in hardening scripts.
--
-- Expected shape:
-- - legacy guest queue RPCs should show anon/authenticated execute = false.
-- - admin/staff RPCs should not be executable by anon.
-- - admin/staff RPCs may be executable by authenticated, but must enforce roles
--   inside the security-definer function.

with function_checks(signature, expected_anon, expected_authenticated) as (
  values
    ('public.grant_qme_superadmin(uuid,text,text)', false, false),
    ('public.next_ticket_for_queue(uuid)', false, false),
    ('public.restore_ticket_for_queue(bigint,uuid)', false, false),
    ('public.check_in_ticket(bigint)', false, false),
    ('public.leave_queue(bigint,text)', false, false),
    ('public.reset_queue_for_queue(uuid)', false, true),
    ('public.reset_event_test_data(uuid)', false, true),
    ('public.admin_complete_event_check_in(uuid,text)', false, true),
    ('public.admin_update_event_check_in_ticket_type(uuid,text)', false, true),
    ('public.admin_grant_guest_credit_for_check_in(uuid,text,integer,jsonb)', false, true),
    ('public.admin_release_queue_ticket(bigint)', false, true),
    ('public.admin_mark_queue_ticket_not_here(bigint)', false, true),
    ('public.admin_return_queue_ticket_to_waiting(bigint,text)', false, true),
    ('public.admin_complete_queue_ticket(uuid,bigint,text,text,uuid,text,text,jsonb)', false, true),
    ('public.admin_apply_queue_pilot_flow(uuid)', false, true),
    ('public.complete_queue_ticket_for_guest(uuid,bigint,text,text,text,uuid,text,text,jsonb)', true, true),
    ('public.get_guest_credit_for_check_in_guest(uuid,text,text)', true, true)
),
resolved as (
  select
    signature,
    expected_anon,
    expected_authenticated,
    to_regprocedure(signature) as routine
  from function_checks
)
select
  signature,
  routine is not null as exists,
  case
    when routine is null then null
    else has_function_privilege('anon', routine, 'execute')
  end as anon_can_execute,
  expected_anon,
  case
    when routine is null then null
    else has_function_privilege('authenticated', routine, 'execute')
  end as authenticated_can_execute,
  expected_authenticated,
  case
    when routine is null then 'missing function'
    when has_function_privilege('anon', routine, 'execute') is distinct from expected_anon then 'anon mismatch'
    when has_function_privilege('authenticated', routine, 'execute') is distinct from expected_authenticated then 'authenticated mismatch'
    else 'ok'
  end as status
from resolved
order by status desc, signature;
