-- qME guest queue legacy RPC lockdown.
-- Run after supabase-guest-session-foundation.sql and supabase-guest-action-rls-tightening.sql.
--
-- Guest queue actions should use token-scoped overloads. These older
-- signatures do not carry guest ownership proof and should not be callable
-- directly by anon/authenticated clients.

do $$
begin
  if to_regprocedure('public.next_ticket_for_queue(uuid)') is not null then
    revoke all on function public.next_ticket_for_queue(uuid) from anon, authenticated;
  end if;

  if to_regprocedure('public.restore_ticket_for_queue(bigint, uuid)') is not null then
    revoke all on function public.restore_ticket_for_queue(bigint, uuid) from anon, authenticated;
  end if;

  if to_regprocedure('public.check_in_ticket(bigint)') is not null then
    revoke all on function public.check_in_ticket(bigint) from anon, authenticated;
  end if;

  if to_regprocedure('public.leave_queue(bigint, text)') is not null then
    revoke all on function public.leave_queue(bigint, text) from anon, authenticated;
  end if;
end;
$$;

-- Verification: these legacy signatures should all report false.
select
  legacy_signature,
  has_function_privilege('anon', legacy_function, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', legacy_function, 'execute') as authenticated_can_execute
from (
  values
    ('public.next_ticket_for_queue(uuid)'),
    ('public.restore_ticket_for_queue(bigint, uuid)'),
    ('public.check_in_ticket(bigint)'),
    ('public.leave_queue(bigint, text)')
) as legacy_functions(legacy_signature)
cross join lateral to_regprocedure(legacy_signature) as legacy_function
where legacy_function is not null;
