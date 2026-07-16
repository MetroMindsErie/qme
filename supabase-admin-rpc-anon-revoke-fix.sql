-- qME admin RPC anon revoke fix.
-- Run after the admin queue/check-in/reset RPC scripts.
--
-- The admin RPCs are intentionally executable by authenticated users because
-- they enforce event/org/station roles inside SECURITY DEFINER functions.
-- They should not be executable by anon.

revoke all on function public.admin_apply_queue_pilot_flow(uuid) from anon;
revoke all on function public.admin_complete_event_check_in(uuid, text) from anon;
revoke all on function public.admin_grant_guest_credit_for_check_in(uuid, text, integer, jsonb) from anon;
revoke all on function public.admin_mark_queue_ticket_not_here(bigint) from anon;
revoke all on function public.admin_release_queue_ticket(bigint) from anon;
revoke all on function public.admin_return_queue_ticket_to_waiting(bigint, text) from anon;
revoke all on function public.admin_update_event_check_in_ticket_type(uuid, text) from anon;
revoke all on function public.reset_event_test_data(uuid) from anon;

-- Include this even though the latest verification already passed, so future
-- drift is corrected consistently if an older script is rerun.
revoke all on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) from anon;

grant execute on function public.admin_apply_queue_pilot_flow(uuid) to authenticated;
grant execute on function public.admin_complete_event_check_in(uuid, text) to authenticated;
grant execute on function public.admin_grant_guest_credit_for_check_in(uuid, text, integer, jsonb) to authenticated;
grant execute on function public.admin_mark_queue_ticket_not_here(bigint) to authenticated;
grant execute on function public.admin_release_queue_ticket(bigint) to authenticated;
grant execute on function public.admin_return_queue_ticket_to_waiting(bigint, text) to authenticated;
grant execute on function public.admin_update_event_check_in_ticket_type(uuid, text) to authenticated;
grant execute on function public.reset_event_test_data(uuid) to authenticated;
grant execute on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) to authenticated;

select
  routine::text as signature,
  has_function_privilege('anon', routine, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', routine, 'execute') as authenticated_can_execute
from (
  values
    ('public.admin_apply_queue_pilot_flow(uuid)'::regprocedure),
    ('public.admin_complete_event_check_in(uuid,text)'::regprocedure),
    ('public.admin_grant_guest_credit_for_check_in(uuid,text,integer,jsonb)'::regprocedure),
    ('public.admin_mark_queue_ticket_not_here(bigint)'::regprocedure),
    ('public.admin_release_queue_ticket(bigint)'::regprocedure),
    ('public.admin_return_queue_ticket_to_waiting(bigint,text)'::regprocedure),
    ('public.admin_update_event_check_in_ticket_type(uuid,text)'::regprocedure),
    ('public.reset_event_test_data(uuid)'::regprocedure),
    ('public.admin_complete_queue_ticket(uuid,bigint,text,text,uuid,text,text,jsonb)'::regprocedure)
) as checked(routine)
order by routine::text;
