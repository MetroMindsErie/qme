-- qME guest credit null hotfix.
-- Run if guests without a headshot credit see Headshot Photographer as completed.
--
-- The original RPC could return an empty composite object when no credit row
-- existed. The app now guards against that too, but the database function should
-- return a true null for "no credit".

create or replace function public.get_guest_credit_for_check_in_guest(
  p_check_in_id uuid,
  p_guest_token text,
  p_credit_key text
)
returns public.event_guest_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  check_in_row public.event_check_ins;
  credit_row public.event_guest_credits;
begin
  check_in_row := public.get_event_check_in_for_guest(p_check_in_id, p_guest_token);

  select *
    into credit_row
  from public.event_guest_credits
  where check_in_id = p_check_in_id
    and credit_key = p_credit_key
  limit 1;

  if credit_row.id is null then
    return null;
  end if;

  return credit_row;
end;
$$;

revoke all on function public.get_guest_credit_for_check_in_guest(uuid, text, text) from public;
grant execute on function public.get_guest_credit_for_check_in_guest(uuid, text, text) to anon, authenticated;
