-- qME queue practice reset.
-- Run after:
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-sotc-queue-pilot.sql
--
-- Intent:
-- - make the admin "Reset Practice Run" button clear queue test remnants
-- - remove queue tickets that drive Waiting/Standby/Released/Completed counts
-- - preserve event check-ins and check-in-linked credits, which are event-level

create or replace function public.reset_queue_for_queue(
  p_queue_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event_id uuid;
  target_org_id uuid;
  actor_id uuid;
  removed_ticket_count integer := 0;
begin
  select q.event_id, e.organization_id
    into target_event_id, target_org_id
  from public.queues q
  join public.events e on e.id = q.event_id
  where q.id = p_queue_id;

  if target_event_id is null then
    raise exception 'queue not found';
  end if;

  if not public.can_manage_event_guest_action(target_event_id) then
    raise exception 'not allowed to reset this queue';
  end if;

  create temporary table if not exists pg_temp.reset_queue_ticket_ids (
    id bigint primary key
  ) on commit drop;

  truncate table pg_temp.reset_queue_ticket_ids;

  insert into pg_temp.reset_queue_ticket_ids (id)
  select id
  from public.tickets
  where queue_id = p_queue_id;

  get diagnostics removed_ticket_count = row_count;

  delete from public.event_guest_marks marks
  using pg_temp.reset_queue_ticket_ids target_tickets
  where marks.ticket_id = target_tickets.id;

  delete from public.event_guest_designations designations
  using pg_temp.reset_queue_ticket_ids target_tickets
  where designations.ticket_id = target_tickets.id;

  delete from public.event_guest_credits credits
  using pg_temp.reset_queue_ticket_ids target_tickets
  where credits.ticket_id = target_tickets.id;

  delete from public.tickets tickets
  using pg_temp.reset_queue_ticket_ids target_tickets
  where tickets.id = target_tickets.id;

  update public.queues
  set
    now_serving = 1,
    updated_at = now()
  where id = p_queue_id;

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
      target_event_id,
      actor_id,
      'queue.practice_reset',
      'queue',
      p_queue_id::text,
      jsonb_build_object('removed_ticket_count', removed_ticket_count)
    );
  end if;
end;
$$;

revoke all on function public.reset_queue_for_queue(uuid) from public;
grant execute on function public.reset_queue_for_queue(uuid) to authenticated;
