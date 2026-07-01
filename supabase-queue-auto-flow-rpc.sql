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
  blocking_standby_count integer := 0;
  standby_pool_count integer := 0;
  standby_pool_cap integer := 6;
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
  standby_pool_cap := greatest(standby_target, standby_target + max_active + 2);

  select count(*)
  into active_released_count
  from public.tickets
  where queue_id = p_queue_id
    and stage = 'released';

  slots := greatest(0, max_active - active_released_count);

  for ticket_record in
    select id
    from public.tickets
    where queue_id = p_queue_id
      and stage = 'standby'
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
    and (
      nearby_confirmed_at is not null
      or coalesce(stage_updated_at, created_at) >= now() - interval '15 seconds'
    );

  select count(*)
  into standby_pool_count
  from public.tickets
  where queue_id = p_queue_id
    and stage = 'standby';

  for ticket_record in
    select id
    from public.tickets
    where queue_id = p_queue_id
      and coalesce(stage, 'waiting') = 'waiting'
    order by ticket_number nulls last, created_at, id
    limit least(
      greatest(0, standby_target - blocking_standby_count),
      greatest(0, standby_pool_cap - standby_pool_count)
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
