-- qME queue Not Here cooldown split.
-- Run after supabase-sotc-queue-pilot.sql.
--
-- Separates two queue timing concepts:
-- - gathering_stale_after_seconds: when non-nearby Gathering guests stop blocking
-- - not_here_cooldown_seconds: when a Not Here guest may be invited again

alter table public.queues
  add column if not exists not_here_cooldown_seconds integer not null default 300
    check (not_here_cooldown_seconds >= 0);

create or replace function public.run_queue_pilot_flow(
  p_queue_id uuid,
  p_force boolean default false
)
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
  not_here_cooldown_seconds integer := 300;
  blocking_standby_count integer := 0;
  standby_pool_count integer := 0;
  slots integer := 0;
  ticket_record record;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_queue_id::text, 0));

  select *
  into queue_row
  from public.queues
  where id = p_queue_id;

  if queue_row.id is null then
    raise exception 'Queue not found.';
  end if;

  if not p_force and coalesce(queue_row.run_mode, 'manual') <> 'auto' then
    return;
  end if;

  if coalesce(queue_row.join_status, 'open') <> 'open' then
    return;
  end if;

  max_active := greatest(0, coalesce(queue_row.max_active_released, 1));
  standby_target := greatest(0, coalesce(queue_row.standby_threshold, 3));
  gathering_max := greatest(standby_target, coalesce(queue_row.gathering_max, standby_target + max_active + 2));
  stale_after_seconds := greatest(0, coalesce(queue_row.gathering_stale_after_seconds, 15));
  not_here_cooldown_seconds := greatest(0, coalesce(queue_row.not_here_cooldown_seconds, stale_after_seconds, 300));

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
      and (
        gathering_snoozed_at is null
        or gathering_snoozed_at < now() - make_interval(secs => not_here_cooldown_seconds)
      )
    order by
      case when gathering_snoozed_at is null then 0 else 1 end,
      coalesce(stage_updated_at, created_at),
      gathering_snoozed_at nulls first,
      ticket_number nulls last,
      id
    limit least(
      greatest(0, standby_target - blocking_standby_count),
      greatest(0, gathering_max - standby_pool_count)
    )
  loop
    update public.tickets
    set
      stage = 'standby',
      gathering_snoozed_at = null
    where id = ticket_record.id;
  end loop;
end;
$$;

revoke all on function public.run_queue_pilot_flow(uuid, boolean) from public;
