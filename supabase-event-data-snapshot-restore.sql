-- qME event data snapshot restore.
-- Run after supabase-sotc-production-archive-baseline.sql.
--
-- This installs a reusable, superadmin-only restore function for same-event
-- event_data_snapshots payloads. It does not execute a restore by itself.

create or replace function public.restore_event_dataset_snapshot(
  p_target_event_id uuid,
  p_snapshot_key text,
  p_safety_snapshot_key text,
  p_preserve_current_queue_config boolean default true,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event public.events%rowtype;
  snapshot_row public.event_data_snapshots%rowtype;
  snapshot_payload jsonb;
  snapshot_event_id uuid;
  snapshot_event_slug text;
  safety_snapshot_id uuid;
  actor_id uuid;
  removed_group_order_item_count integer := 0;
  removed_mark_count integer := 0;
  removed_designation_count integer := 0;
  removed_credit_count integer := 0;
  removed_ticket_count integer := 0;
  removed_check_in_count integer := 0;
  removed_guest_session_count integer := 0;
  removed_imported_registration_count integer := 0;
  removed_import_batch_count integer := 0;
  removed_staff_assignment_count integer := 0;
  removed_ece_count integer := 0;
  removed_queue_count integer := 0;
  restored_group_order_item_count integer := 0;
  restored_mark_count integer := 0;
  restored_designation_count integer := 0;
  restored_credit_count integer := 0;
  restored_ticket_count integer := 0;
  restored_check_in_count integer := 0;
  restored_guest_session_count integer := 0;
  restored_imported_registration_count integer := 0;
  restored_import_batch_count integer := 0;
  restored_staff_assignment_count integer := 0;
  restored_ece_count integer := 0;
  restored_queue_count integer := 0;
  restored_expie_count integer := 0;
  preserved_queue_config_count integer := 0;
  ticket_sequence_name text;
begin
  if not public.is_qme_superadmin() then
    raise exception 'only qMe superadmin can restore event snapshots';
  end if;

  if nullif(trim(coalesce(p_snapshot_key, '')), '') is null then
    raise exception 'snapshot key is required';
  end if;

  if nullif(trim(coalesce(p_safety_snapshot_key, '')), '') is null then
    raise exception 'safety snapshot key is required';
  end if;

  select *
    into target_event
  from public.events
  where id = p_target_event_id;

  if target_event.id is null then
    raise exception 'target event not found';
  end if;

  if public.event_is_archive_locked(p_target_event_id) then
    raise exception 'target event is archive locked and cannot be restored';
  end if;

  select *
    into snapshot_row
  from public.event_data_snapshots
  where snapshot_key = trim(p_snapshot_key);

  if snapshot_row.id is null then
    raise exception 'snapshot not found: %', p_snapshot_key;
  end if;

  if snapshot_row.snapshot_type <> 'internal_baseline' then
    raise exception 'snapshot must be an internal_baseline, got %', snapshot_row.snapshot_type;
  end if;

  if exists (
    select 1
    from public.event_data_snapshots
    where snapshot_key = trim(p_safety_snapshot_key)
  ) then
    raise exception 'safety snapshot key already exists: %', p_safety_snapshot_key;
  end if;

  snapshot_payload := snapshot_row.payload;
  snapshot_event_id := nullif(snapshot_payload->>'source_event_id', '')::uuid;
  snapshot_event_slug := snapshot_payload->'event'->>'slug';

  if coalesce((snapshot_payload->>'schema_version')::integer, 0) <> 1 then
    raise exception 'unsupported snapshot schema version';
  end if;

  if snapshot_row.source_event_id <> p_target_event_id
    or snapshot_event_id <> p_target_event_id
    or nullif(snapshot_payload->'event'->>'id', '')::uuid <> p_target_event_id then
    raise exception 'snapshot source event does not match target event';
  end if;

  if snapshot_event_slug is distinct from target_event.slug then
    raise exception 'snapshot event slug % does not match target event slug %', snapshot_event_slug, target_event.slug;
  end if;

  safety_snapshot_id := public.create_event_dataset_snapshot(
    p_target_event_id,
    trim(p_safety_snapshot_key),
    'pre_reset',
    coalesce(nullif(trim(p_notes), ''), 'Safety snapshot before event_data_snapshots restore.')
  );

  drop table if exists pg_temp.restore_snapshot_event;
  drop table if exists pg_temp.restore_snapshot_expies;
  drop table if exists pg_temp.restore_snapshot_eces;
  drop table if exists pg_temp.restore_snapshot_queues;
  drop table if exists pg_temp.restore_snapshot_event_import_batches;
  drop table if exists pg_temp.restore_snapshot_event_imported_registrations;
  drop table if exists pg_temp.restore_snapshot_guest_sessions;
  drop table if exists pg_temp.restore_snapshot_event_check_ins;
  drop table if exists pg_temp.restore_snapshot_tickets;
  drop table if exists pg_temp.restore_snapshot_event_guest_marks;
  drop table if exists pg_temp.restore_snapshot_event_guest_designations;
  drop table if exists pg_temp.restore_snapshot_event_guest_credits;
  drop table if exists pg_temp.restore_snapshot_event_staff_assignments;
  drop table if exists pg_temp.restore_current_queue_config;
  drop table if exists pg_temp.restore_target_queue_ids;
  drop table if exists pg_temp.restore_target_check_in_ids;
  drop table if exists pg_temp.restore_target_guest_session_ids;
  drop table if exists pg_temp.restore_target_ticket_ids;

  create temporary table restore_snapshot_event on commit drop as
  select *
  from jsonb_populate_record(null::public.events, snapshot_payload->'event');

  create temporary table restore_snapshot_expies on commit drop as
  select *
  from jsonb_populate_recordset(null::public.expies, coalesce(snapshot_payload->'expies_for_event_eces', '[]'::jsonb));

  create temporary table restore_snapshot_eces on commit drop as
  select *
  from jsonb_populate_recordset(null::public.eces, coalesce(snapshot_payload->'eces', '[]'::jsonb));

  create temporary table restore_snapshot_queues on commit drop as
  select *
  from jsonb_populate_recordset(null::public.queues, coalesce(snapshot_payload->'queues', '[]'::jsonb));

  create temporary table restore_snapshot_event_import_batches on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_import_batches, coalesce(snapshot_payload->'event_import_batches', '[]'::jsonb));

  create temporary table restore_snapshot_event_imported_registrations on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_imported_registrations, coalesce(snapshot_payload->'event_imported_registrations', '[]'::jsonb));

  create temporary table restore_snapshot_guest_sessions on commit drop as
  select *
  from jsonb_populate_recordset(null::public.guest_sessions, coalesce(snapshot_payload->'guest_sessions', '[]'::jsonb));

  create temporary table restore_snapshot_event_check_ins on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_check_ins, coalesce(snapshot_payload->'event_check_ins', '[]'::jsonb));

  create temporary table restore_snapshot_tickets on commit drop as
  select *
  from jsonb_populate_recordset(null::public.tickets, coalesce(snapshot_payload->'tickets', '[]'::jsonb));

  create temporary table restore_snapshot_event_guest_marks on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_guest_marks, coalesce(snapshot_payload->'event_guest_marks', '[]'::jsonb));

  create temporary table restore_snapshot_event_guest_designations on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_guest_designations, coalesce(snapshot_payload->'event_guest_designations', '[]'::jsonb));

  create temporary table restore_snapshot_event_guest_credits on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_guest_credits, coalesce(snapshot_payload->'event_guest_credits', '[]'::jsonb));

  create temporary table restore_snapshot_event_staff_assignments on commit drop as
  select *
  from jsonb_populate_recordset(null::public.event_staff_assignments, coalesce(snapshot_payload->'event_staff_assignments', '[]'::jsonb));

  create temporary table restore_current_queue_config on commit drop as
  select
    id,
    join_status,
    run_mode,
    standby_threshold,
    gathering_max,
    gathering_stale_after_seconds,
    not_here_cooldown_seconds,
    max_active_released
  from public.queues
  where event_id = p_target_event_id;

  create temporary table restore_target_queue_ids on commit drop as
  select id
  from public.queues
  where event_id = p_target_event_id;

  create temporary table restore_target_check_in_ids on commit drop as
  select id
  from public.event_check_ins
  where event_id = p_target_event_id;

  create temporary table restore_target_guest_session_ids on commit drop as
  select id
  from public.guest_sessions
  where event_id = p_target_event_id;

  create temporary table restore_target_ticket_ids on commit drop as
  select tickets.id
  from public.tickets tickets
  where tickets.queue_id in (select id from restore_target_queue_ids)
     or tickets.guest_session_id in (select id from restore_target_guest_session_ids);

  if exists (select 1 from restore_snapshot_event where id <> p_target_event_id) then
    raise exception 'snapshot event row does not match target event';
  end if;

  if exists (select 1 from restore_snapshot_queues where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_eces where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_import_batches where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_imported_registrations where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_guest_sessions where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_check_ins where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_guest_marks where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_guest_designations where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_guest_credits where event_id <> p_target_event_id)
    or exists (select 1 from restore_snapshot_event_staff_assignments where event_id <> p_target_event_id) then
    raise exception 'snapshot contains event-scoped rows outside target event';
  end if;

  if exists (
    select 1
    from restore_snapshot_tickets tickets
    where tickets.queue_id not in (select id from restore_snapshot_queues)
      and (
        tickets.guest_session_id is null
        or tickets.guest_session_id not in (select id from restore_snapshot_guest_sessions)
      )
  ) then
    raise exception 'snapshot contains tickets outside target event queues/sessions';
  end if;

  if to_regclass('public.event_group_order_items') is not null then
    execute 'drop table if exists pg_temp.restore_snapshot_event_group_order_items';
    execute
      'create temporary table restore_snapshot_event_group_order_items on commit drop as
       select *
       from jsonb_populate_recordset(null::public.event_group_order_items, $1)'
      using coalesce(snapshot_payload->'event_group_order_items', '[]'::jsonb);

    execute
      'select count(*) from restore_snapshot_event_group_order_items where event_id <> $1'
      into restored_group_order_item_count
      using p_target_event_id;

    if restored_group_order_item_count > 0 then
      raise exception 'snapshot contains group-order rows outside target event';
    end if;
    restored_group_order_item_count := 0;
  end if;

  if to_regclass('public.event_group_order_items') is not null then
    execute 'delete from public.event_group_order_items where event_id = $1'
      using p_target_event_id;
    get diagnostics removed_group_order_item_count = row_count;
  end if;

  delete from public.event_guest_marks
  where event_id = p_target_event_id
     or ticket_id in (select id from restore_target_ticket_ids)
     or check_in_id in (select id from restore_target_check_in_ids);
  get diagnostics removed_mark_count = row_count;

  delete from public.event_guest_designations
  where event_id = p_target_event_id
     or ticket_id in (select id from restore_target_ticket_ids)
     or check_in_id in (select id from restore_target_check_in_ids);
  get diagnostics removed_designation_count = row_count;

  delete from public.event_guest_credits
  where event_id = p_target_event_id
     or ticket_id in (select id from restore_target_ticket_ids)
     or check_in_id in (select id from restore_target_check_in_ids);
  get diagnostics removed_credit_count = row_count;

  delete from public.tickets tickets
  using restore_target_ticket_ids target_tickets
  where tickets.id = target_tickets.id;
  get diagnostics removed_ticket_count = row_count;

  delete from public.event_imported_registrations
  where event_id = p_target_event_id;
  get diagnostics removed_imported_registration_count = row_count;

  delete from public.event_check_ins
  where id in (select id from restore_target_check_in_ids);
  get diagnostics removed_check_in_count = row_count;

  delete from public.guest_sessions
  where id in (select id from restore_target_guest_session_ids);
  get diagnostics removed_guest_session_count = row_count;

  delete from public.event_import_batches
  where event_id = p_target_event_id;
  get diagnostics removed_import_batch_count = row_count;

  delete from public.event_staff_assignments
  where event_id = p_target_event_id;
  get diagnostics removed_staff_assignment_count = row_count;

  delete from public.eces
  where event_id = p_target_event_id;
  get diagnostics removed_ece_count = row_count;

  delete from public.queues
  where event_id = p_target_event_id;
  get diagnostics removed_queue_count = row_count;

  update public.events events
  set
    organization_id = restored.organization_id,
    name = restored.name,
    slug = restored.slug,
    description = restored.description,
    location = restored.location,
    image_url = restored.image_url,
    event_date = restored.event_date,
    start_time = restored.start_time,
    end_time = restored.end_time,
    timezone = restored.timezone,
    status = restored.status,
    metadata = restored.metadata,
    created_at = restored.created_at,
    updated_at = restored.updated_at
  from restore_snapshot_event restored
  where events.id = p_target_event_id;

  insert into public.expies
  select *
  from restore_snapshot_expies
  on conflict (id) do nothing;
  get diagnostics restored_expie_count = row_count;

  insert into public.queues
  select *
  from restore_snapshot_queues;
  get diagnostics restored_queue_count = row_count;

  if p_preserve_current_queue_config then
    update public.queues queues
    set
      join_status = current_config.join_status,
      run_mode = current_config.run_mode,
      standby_threshold = current_config.standby_threshold,
      gathering_max = current_config.gathering_max,
      gathering_stale_after_seconds = current_config.gathering_stale_after_seconds,
      not_here_cooldown_seconds = current_config.not_here_cooldown_seconds,
      max_active_released = current_config.max_active_released,
      updated_at = now()
    from restore_current_queue_config current_config
    where queues.id = current_config.id
      and queues.event_id = p_target_event_id;
    get diagnostics preserved_queue_config_count = row_count;
  end if;

  insert into public.eces
  select *
  from restore_snapshot_eces;
  get diagnostics restored_ece_count = row_count;

  insert into public.event_staff_assignments
  select *
  from restore_snapshot_event_staff_assignments;
  get diagnostics restored_staff_assignment_count = row_count;

  insert into public.event_import_batches
  select *
  from restore_snapshot_event_import_batches;
  get diagnostics restored_import_batch_count = row_count;

  insert into public.guest_sessions
  select *
  from restore_snapshot_guest_sessions;
  get diagnostics restored_guest_session_count = row_count;

  insert into public.event_check_ins
  select *
  from restore_snapshot_event_check_ins;
  get diagnostics restored_check_in_count = row_count;

  insert into public.event_imported_registrations
  select *
  from restore_snapshot_event_imported_registrations;
  get diagnostics restored_imported_registration_count = row_count;

  insert into public.tickets
  select *
  from restore_snapshot_tickets;
  get diagnostics restored_ticket_count = row_count;

  insert into public.event_guest_designations
  select *
  from restore_snapshot_event_guest_designations;
  get diagnostics restored_designation_count = row_count;

  insert into public.event_guest_credits
  select *
  from restore_snapshot_event_guest_credits;
  get diagnostics restored_credit_count = row_count;

  insert into public.event_guest_marks
  select *
  from restore_snapshot_event_guest_marks;
  get diagnostics restored_mark_count = row_count;

  if to_regclass('public.event_group_order_items') is not null then
    execute
      'insert into public.event_group_order_items
       select *
       from restore_snapshot_event_group_order_items';
    get diagnostics restored_group_order_item_count = row_count;
  end if;

  ticket_sequence_name := pg_get_serial_sequence('public.tickets', 'id');
  if ticket_sequence_name is not null then
    execute format(
      'select setval(%L, greatest((select coalesce(max(id), 0) from public.tickets), 1), true)',
      ticket_sequence_name
    );
  end if;

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
      target_event.organization_id,
      p_target_event_id,
      actor_id,
      'event.dataset_snapshot_restored',
      'event_data_snapshot',
      snapshot_row.id::text,
      jsonb_build_object(
        'snapshot_key', snapshot_row.snapshot_key,
        'safety_snapshot_id', safety_snapshot_id,
        'safety_snapshot_key', trim(p_safety_snapshot_key),
        'preserve_current_queue_config', p_preserve_current_queue_config,
        'notes', coalesce(p_notes, '')
      )
    );
  end if;

  return jsonb_build_object(
    'restored_from_snapshot_key', snapshot_row.snapshot_key,
    'safety_snapshot_id', safety_snapshot_id,
    'safety_snapshot_key', trim(p_safety_snapshot_key),
    'target_event_id', p_target_event_id,
    'target_event_slug', target_event.slug,
    'preserve_current_queue_config', p_preserve_current_queue_config,
    'preserved_queue_config_count', preserved_queue_config_count,
    'removed_counts', jsonb_build_object(
      'event_group_order_items', removed_group_order_item_count,
      'event_guest_marks', removed_mark_count,
      'event_guest_designations', removed_designation_count,
      'event_guest_credits', removed_credit_count,
      'tickets', removed_ticket_count,
      'event_check_ins', removed_check_in_count,
      'guest_sessions', removed_guest_session_count,
      'event_imported_registrations', removed_imported_registration_count,
      'event_import_batches', removed_import_batch_count,
      'event_staff_assignments', removed_staff_assignment_count,
      'eces', removed_ece_count,
      'queues', removed_queue_count
    ),
    'restored_counts', jsonb_build_object(
      'expies_inserted_if_missing', restored_expie_count,
      'queues', restored_queue_count,
      'eces', restored_ece_count,
      'event_staff_assignments', restored_staff_assignment_count,
      'event_import_batches', restored_import_batch_count,
      'guest_sessions', restored_guest_session_count,
      'event_check_ins', restored_check_in_count,
      'event_imported_registrations', restored_imported_registration_count,
      'tickets', restored_ticket_count,
      'event_guest_designations', restored_designation_count,
      'event_guest_credits', restored_credit_count,
      'event_guest_marks', restored_mark_count,
      'event_group_order_items', restored_group_order_item_count
    )
  );
end;
$$;

revoke all on function public.restore_event_dataset_snapshot(uuid, text, text, boolean, text) from public;
revoke all on function public.restore_event_dataset_snapshot(uuid, text, text, boolean, text) from anon;
grant execute on function public.restore_event_dataset_snapshot(uuid, text, text, boolean, text) to authenticated;

comment on function public.restore_event_dataset_snapshot(uuid, text, text, boolean, text) is
  'Superadmin-only same-event restore from event_data_snapshots. Creates a safety snapshot before replacing target event operational data.';
