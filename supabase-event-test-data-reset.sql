-- qME event test data reset.
-- Run after:
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-guest-session-foundation.sql
-- - supabase-sotc-queue-pilot.sql
-- - supabase-group-order-pilot.sql, if the group order pilot is installed
--
-- Intent:
-- - let event admins reset a rehearsal/test run from the event admin screen
-- - preserve event setup, event features/eCes, queues, orgs, and staff access
-- - remove guest/test-run data that makes the event look already used

create or replace function public.reset_event_test_data(
  p_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  actor_id uuid;
  removed_order_item_count integer := 0;
  removed_mark_count integer := 0;
  removed_designation_count integer := 0;
  removed_credit_count integer := 0;
  removed_ticket_count integer := 0;
  removed_check_in_count integer := 0;
  removed_guest_session_count integer := 0;
begin
  select organization_id
    into target_org_id
  from public.events
  where id = p_event_id;

  if target_org_id is null then
    raise exception 'event not found';
  end if;

  if not public.has_event_role(p_event_id, array['event_admin']) then
    raise exception 'not allowed to reset this event';
  end if;

  if to_regclass('public.event_group_order_items') is not null then
    execute 'delete from public.event_group_order_items where event_id = $1'
      using p_event_id;
    get diagnostics removed_order_item_count = row_count;
  end if;

  delete from public.event_guest_marks
  where event_id = p_event_id;
  get diagnostics removed_mark_count = row_count;

  delete from public.event_guest_designations
  where event_id = p_event_id;
  get diagnostics removed_designation_count = row_count;

  delete from public.event_guest_credits
  where event_id = p_event_id;
  get diagnostics removed_credit_count = row_count;

  delete from public.tickets tickets
  using public.queues queues
  where tickets.queue_id = queues.id
    and queues.event_id = p_event_id;
  get diagnostics removed_ticket_count = row_count;

  delete from public.event_check_ins
  where event_id = p_event_id;
  get diagnostics removed_check_in_count = row_count;

  delete from public.guest_sessions
  where event_id = p_event_id;
  get diagnostics removed_guest_session_count = row_count;

  update public.queues
  set
    now_serving = 1,
    updated_at = now()
  where event_id = p_event_id;

  update public.events
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'test_data_reset_at',
      now()
    ),
    updated_at = now()
  where id = p_event_id;

  actor_id := public.current_admin_principal_id();
  if actor_id is not null then
    insert into public.admin_audit_logs (
      organization_id,
      event_id,
      actor_principal_id,
      action,
      target_type,
      target_id,
      metadata
    )
    values (
      target_org_id,
      p_event_id,
      actor_id,
      'event.test_data_reset',
      'event',
      p_event_id::text,
      jsonb_build_object(
        'removed_order_item_count', removed_order_item_count,
        'removed_mark_count', removed_mark_count,
        'removed_designation_count', removed_designation_count,
        'removed_credit_count', removed_credit_count,
        'removed_ticket_count', removed_ticket_count,
        'removed_check_in_count', removed_check_in_count,
        'removed_guest_session_count', removed_guest_session_count
      )
    );
  end if;
end;
$$;

revoke all on function public.reset_event_test_data(uuid) from public;
grant execute on function public.reset_event_test_data(uuid) to authenticated;
