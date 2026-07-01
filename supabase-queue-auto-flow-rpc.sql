-- qME SOTC queue auto-flow RPC.
-- Run after supabase-sotc-queue-pilot.sql.
--
-- Moves queue advancement out of the admin browser so auto-assist queues can
-- advance when guests join or mark nearby, even if no staff queue screen is open.

create or replace function public.apply_queue_pilot_flow(p_queue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  queue_row public.queues;
  active_released_count integer := 0;
  max_active integer := 1;
  standby_target integer := 3;
  gathering_max integer := 6;
  stale_after_seconds integer := 15;
  blocking_standby_count integer := 0;
  standby_pool_count integer := 0;
  slots integer := 0;
  ticket_record record;
begin
  select *
  into queue_row
  from public.queues
  where id = p_queue_id;

  if queue_row.id is null then
    raise exception 'Queue not found.';
  end if;

  if coalesce(queue_row.run_mode, 'manual') <> 'auto' then
    return;
  end if;

  if coalesce(queue_row.join_status, 'open') <> 'open' then
    return;
  end if;

  max_active := greatest(0, coalesce(queue_row.max_active_released, 1));
  standby_target := greatest(0, coalesce(queue_row.standby_threshold, 3));
  gathering_max := greatest(standby_target, coalesce(queue_row.gathering_max, standby_target + max_active + 2));
  stale_after_seconds := greatest(0, coalesce(queue_row.gathering_stale_after_seconds, 15));

  select count(*)
  into active_released_count
  from public.tickets
  where queue_id = p_queue_id
    and stage = 'released'
    and coalesce(status, '') not in ('left', 'served');

  slots := greatest(0, max_active - active_released_count);

  for ticket_record in
    select id
    from public.tickets
    where queue_id = p_queue_id
      and stage = 'standby'
      and coalesce(status, '') not in ('left', 'served')
      and nearby_confirmed_at is not null
    order by ticket_number nulls last, created_at, id
    limit slots
  loop
    update public.tickets
    set stage = 'released'
    where id = ticket_record.id;
  end loop;

  select count(*)
  into blocking_standby_count
  from public.tickets
  where queue_id = p_queue_id
    and stage = 'standby'
    and coalesce(status, '') not in ('left', 'served')
    and (
      nearby_confirmed_at is not null
      or (
        stale_after_seconds > 0
        and coalesce(stage_updated_at, created_at) >= now() - make_interval(secs => stale_after_seconds)
      )
    );

  select count(*)
  into standby_pool_count
  from public.tickets
  where queue_id = p_queue_id
    and stage = 'standby'
    and coalesce(status, '') not in ('left', 'served');

  for ticket_record in
    select id
    from public.tickets
    where queue_id = p_queue_id
      and coalesce(stage, 'waiting') = 'waiting'
      and coalesce(status, '') not in ('left', 'served')
    order by coalesce(stage_updated_at, created_at), ticket_number nulls last, id
    limit least(
      greatest(0, standby_target - blocking_standby_count),
      greatest(0, gathering_max - standby_pool_count)
    )
  loop
    update public.tickets
    set stage = 'standby'
    where id = ticket_record.id;
  end loop;
end;
$$;

revoke all on function public.apply_queue_pilot_flow(uuid) from public;
grant execute on function public.apply_queue_pilot_flow(uuid) to anon, authenticated;

create or replace function public.active_ticket_count_for_queue(p_queue_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.tickets
  where queue_id = p_queue_id
    and coalesce(stage, 'waiting') not in ('completed', 'cancelled', 'left')
    and coalesce(status, 'waiting') not in ('left', 'served');
$$;

revoke all on function public.active_ticket_count_for_queue(uuid) from public;
grant execute on function public.active_ticket_count_for_queue(uuid) to anon, authenticated;

create or replace function public.queue_stage_summary(p_queue_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with scoped as (
    select
      coalesce(stage, 'waiting') as stage,
      coalesce(status, 'waiting') as status,
      nearby_confirmed_at
    from public.tickets
    where queue_id = p_queue_id
  )
  select jsonb_build_object(
    'waiting', count(*) filter (
      where stage = 'waiting'
        and status not in ('left', 'served')
    ),
    'gathering', count(*) filter (
      where stage = 'standby'
        and nearby_confirmed_at is null
        and status not in ('left', 'served')
    ),
    'nearby', count(*) filter (
      where stage = 'standby'
        and nearby_confirmed_at is not null
        and status not in ('left', 'served')
    ),
    'released', count(*) filter (
      where stage = 'released'
        and status not in ('left', 'served')
    ),
    'completed', count(*) filter (
      where stage = 'completed'
    )
  )
  from scoped;
$$;

revoke all on function public.queue_stage_summary(uuid) from public;
grant execute on function public.queue_stage_summary(uuid) to anon, authenticated;
