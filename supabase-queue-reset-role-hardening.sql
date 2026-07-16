-- qME queue reset role hardening.
-- Run after:
-- - supabase-admin-role-foundation.sql
-- - supabase-sotc-rls-hardening.sql
-- - supabase-queue-practice-reset.sql
--
-- This keeps the legacy queue-level reset available for event admins, org admins,
-- and qME superadmins, but removes reset authority from station/service staff.

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

  if not public.has_event_role(target_event_id, array['event_admin']) then
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
revoke all on function public.reset_queue_for_queue(uuid) from anon;
grant execute on function public.reset_queue_for_queue(uuid) to authenticated;

select
  'public.reset_queue_for_queue(uuid)' as signature,
  has_function_privilege('anon', 'public.reset_queue_for_queue(uuid)', 'execute') as anon_can_execute,
  has_function_privilege('authenticated', 'public.reset_queue_for_queue(uuid)', 'execute') as authenticated_can_execute;
