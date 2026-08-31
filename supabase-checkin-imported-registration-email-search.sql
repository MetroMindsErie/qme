-- qME generic Check-In imported-registration email search refinement.
-- Run after:
-- - supabase-sotc-imported-registrations.sql
-- - supabase-sotc-already-checked-in-recovery.sql
--
-- Intent:
-- - let guest imported-registration lookup search by first name, last name, or email
-- - keep phone out of imported lookup because source attendee lists may not include it

create or replace function public.search_event_imported_registrations_for_guest(
  p_event_id uuid,
  p_guest_token text,
  p_query text,
  p_limit integer default 8
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  email_hint text,
  ticket_hint text,
  headshot_entitled boolean,
  already_checked_in boolean,
  requires_email_confirmation boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  search_text text;
  result_limit integer;
begin
  perform public.ensure_guest_session(p_event_id, p_guest_token);

  search_text := lower(trim(coalesce(p_query, '')));
  if length(search_text) < 2 then
    return;
  end if;

  result_limit := least(greatest(coalesce(p_limit, 8), 1), 10);

  return query
  with matches as (
    select
      registrations.*,
      count(*) over (
        partition by
          lower(trim(registrations.first_name)),
          lower(trim(registrations.last_name))
      ) as matching_name_count
    from public.event_imported_registrations registrations
    where registrations.event_id = p_event_id
      and registrations.review_status = 'ready'
      and (
        position(search_text in lower(registrations.first_name)) > 0
        or position(search_text in lower(registrations.last_name)) > 0
        or position(search_text in lower(trim(registrations.first_name || ' ' || registrations.last_name))) > 0
        or position(search_text in lower(registrations.email)) > 0
        or position(search_text in lower(registrations.normalized_email)) > 0
      )
  )
  select
    matches.id,
    matches.first_name,
    matches.last_name,
    public.mask_imported_registration_email(matches.email) as email_hint,
    coalesce(nullif(matches.source_price_tier, ''), nullif(matches.source_ticket_type, '')) as ticket_hint,
    matches.headshot_entitled,
    matches.linked_check_in_id is not null as already_checked_in,
    matches.matching_name_count > 1 as requires_email_confirmation
  from matches
  order by
    matches.linked_check_in_id is not null,
    lower(matches.last_name),
    lower(matches.first_name),
    matches.source_row_number nulls last
  limit result_limit;
end;
$$;

revoke all on function public.search_event_imported_registrations_for_guest(uuid, text, text, integer) from public;
grant execute on function public.search_event_imported_registrations_for_guest(uuid, text, text, integer) to anon, authenticated;
