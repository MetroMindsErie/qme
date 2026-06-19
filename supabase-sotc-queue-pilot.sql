-- qME SOTC queue/adventure pilot.
-- Run after supabase-org-event-foundation.sql and supabase-expie-ece-foundation.sql.
--
-- This keeps the first test narrow:
-- - tickets can carry guest names, queue-stage state, and nearby confirmation
-- - completed scan/code actions leave durable marks on an event guest/ticket
-- - designations and credits are separated for the SOTC check-in model

alter table public.queues
  add column if not exists join_status text not null default 'open'
    check (join_status in ('open', 'paused', 'closed')),
  add column if not exists run_mode text not null default 'manual'
    check (run_mode in ('manual', 'auto')),
  add column if not exists standby_threshold integer not null default 3
    check (standby_threshold >= 0),
  add column if not exists max_active_released integer not null default 1
    check (max_active_released >= 0);

alter table public.tickets
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists stage text not null default 'waiting'
    check (stage in ('waiting', 'standby', 'released', 'completed', 'cancelled', 'left')),
  add column if not exists stage_updated_at timestamptz not null default now(),
  add column if not exists nearby_confirmed_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists completed_at timestamptz;

create index if not exists tickets_queue_stage_idx
  on public.tickets(queue_id, stage, created_at);

create index if not exists tickets_queue_ticket_number_idx
  on public.tickets(queue_id, ticket_number);

create table if not exists public.event_guest_marks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id bigint references public.tickets(id) on delete set null,
  check_in_id uuid references public.event_check_ins(id) on delete set null,
  mark_key text not null,
  mark_value text not null default 'completed',
  source text not null default 'guest',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists event_guest_marks_unique_ticket_mark
  on public.event_guest_marks(ticket_id, mark_key)
  where ticket_id is not null;

create index if not exists event_guest_marks_event_idx
  on public.event_guest_marks(event_id, mark_key, created_at);

create table if not exists public.event_guest_designations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id bigint references public.tickets(id) on delete set null,
  check_in_id uuid references public.event_check_ins(id) on delete set null,
  designation_key text not null,
  source text not null default 'staff',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists event_guest_designations_unique_ticket_key
  on public.event_guest_designations(ticket_id, designation_key)
  where ticket_id is not null;

create table if not exists public.event_guest_credits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id bigint references public.tickets(id) on delete set null,
  check_in_id uuid references public.event_check_ins(id) on delete set null,
  credit_key text not null,
  quantity integer not null default 1,
  used_quantity integer not null default 0,
  source text not null default 'staff',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity >= 0),
  check (used_quantity >= 0),
  check (used_quantity <= quantity)
);

create unique index if not exists event_guest_credits_unique_ticket_key
  on public.event_guest_credits(ticket_id, credit_key)
  where ticket_id is not null;

create or replace function public.set_ticket_stage_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_updated_at = now();
    if new.stage in ('waiting', 'standby') then
      new.nearby_confirmed_at = null;
    end if;
    if new.stage = 'released' and old.stage is distinct from 'released' then
      new.released_at = now();
    end if;
    if new.stage = 'completed' and old.stage is distinct from 'completed' then
      new.completed_at = now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_stage_updated_at on public.tickets;
create trigger tickets_stage_updated_at
before update on public.tickets
for each row
execute function public.set_ticket_stage_updated_at();

grant select, insert, update, delete on public.event_guest_marks to anon, authenticated;
grant select, insert, update, delete on public.event_guest_designations to anon, authenticated;
grant select, insert, update, delete on public.event_guest_credits to anon, authenticated;

alter table public.event_guest_marks enable row level security;
alter table public.event_guest_designations enable row level security;
alter table public.event_guest_credits enable row level security;

drop policy if exists "event_guest_marks_all" on public.event_guest_marks;
create policy "event_guest_marks_all"
  on public.event_guest_marks
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "event_guest_designations_all" on public.event_guest_designations;
create policy "event_guest_designations_all"
  on public.event_guest_designations
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "event_guest_credits_all" on public.event_guest_credits;
create policy "event_guest_credits_all"
  on public.event_guest_credits
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Pilot data cleanup: the first SOTC test queue/eCe reused the headshots
-- placeholder. Rename that event-specific placement to the scan-code adventure
-- we actually want to test.
insert into public.expies (
  organization_id,
  name,
  slug,
  description,
  image_url,
  type,
  default_queue_behavior,
  default_metadata,
  status
)
select
  organizations.id,
  'Scan-Code Adventure',
  'scan-code-adventure',
  'A pilot workflow that releases guests from a queue, sends them to a location, and completes when they scan or enter the station code.',
  '/images/dog-through-hoop.png',
  'queue',
  'standby_gather',
  jsonb_build_object(
    'pilot', true,
    'completion_code', '4729',
    'stage_copy', jsonb_build_object(
      'waiting', jsonb_build_object(
        'title', 'Waiting',
        'detail', 'You are checked in and in line. No action is needed yet.'
      ),
      'standby', jsonb_build_object(
        'title', 'Standby',
        'detail', 'You are almost ready. Please make your way closer to {{location}}.',
        'instruction', 'When you are close to {{location}}, tap I''m Nearby. Keep this page open.'
      ),
      'released', jsonb_build_object(
        'title', 'Your Turn',
        'detail', 'Go to {{location}}. Enter the station code there to complete this step.'
      ),
      'completed', jsonb_build_object(
        'title', 'Completed',
        'detail', 'This step is complete. You can return to the event.'
      )
    )
  ),
  'active'
from public.organizations
where organizations.slug = 'summer-on-the-cuyahoga'
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  default_queue_behavior = excluded.default_queue_behavior,
  default_metadata = excluded.default_metadata,
  status = excluded.status,
  updated_at = now();

update public.queues
set
  name = 'Scan-Code Adventure',
  slug = 'scan-code-adventure',
  description = 'Join the pilot queue, wait for release, then find the station code to complete the adventure.',
  image_url = '/images/dog-through-hoop.png',
  join_status = 'open',
  run_mode = 'manual',
  standby_threshold = 3,
  max_active_released = 1
from public.events
where queues.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and queues.slug = 'professional-headshots'
  and not exists (
    select 1
    from public.queues existing
    where existing.event_id = events.id
      and existing.slug = 'scan-code-adventure'
  );

update public.queues
set
  name = 'Scan-Code Adventure',
  description = 'Join the pilot queue, wait for release, then find the station code to complete the adventure.',
  image_url = '/images/dog-through-hoop.png',
  join_status = 'open',
  run_mode = 'manual',
  standby_threshold = 3,
  max_active_released = 1
from public.events
where queues.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and queues.slug = 'scan-code-adventure';

update public.eces
set
  expie_id = expies.id,
  name = 'Scan-Code Adventure',
  slug = 'scan-code-adventure',
  description = 'Stay nearby while you wait. When it is your turn, go to the posted location and scan or enter the station code.',
  image_url = '/images/dog-through-hoop.png',
  type = 'queue',
  queue_behavior = 'standby_gather',
  location = coalesce(nullif(eces.location, ''), 'Adventure station'),
  metadata = coalesce(eces.metadata, '{}'::jsonb) || jsonb_build_object(
    'pilot', true,
    'completion_code', '4729',
    'stage_copy', jsonb_build_object(
      'waiting', jsonb_build_object(
        'title', 'Waiting',
        'detail', 'You are checked in and in line. No action is needed yet.'
      ),
      'standby', jsonb_build_object(
        'title', 'Standby',
        'detail', 'You are almost ready. Please make your way closer to {{location}}.',
        'instruction', 'When you are close to {{location}}, tap I''m Nearby. Keep this page open.'
      ),
      'released', jsonb_build_object(
        'title', 'Your Turn',
        'detail', 'Go to {{location}}. Enter the station code there to complete this step.'
      ),
      'completed', jsonb_build_object(
        'title', 'Completed',
        'detail', 'This step is complete. You can return to the event.'
      )
    )
  )
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
  and expies.slug = 'scan-code-adventure'
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and eces.slug = 'professional-headshots'
  and not exists (
    select 1
    from public.eces existing
    where existing.event_id = events.id
      and existing.slug = 'scan-code-adventure'
  );

update public.eces
set
  expie_id = expies.id,
  name = 'Scan-Code Adventure',
  description = 'Stay nearby while you wait. When it is your turn, go to the posted location and scan or enter the station code.',
  image_url = '/images/dog-through-hoop.png',
  type = 'queue',
  queue_behavior = 'standby_gather',
  location = coalesce(nullif(eces.location, ''), 'Adventure station'),
  metadata = coalesce(eces.metadata, '{}'::jsonb) || jsonb_build_object(
    'pilot', true,
    'completion_code', '4729',
    'stage_copy', jsonb_build_object(
      'waiting', jsonb_build_object(
        'title', 'Waiting',
        'detail', 'You are checked in and in line. No action is needed yet.'
      ),
      'standby', jsonb_build_object(
        'title', 'Standby',
        'detail', 'You are almost ready. Please make your way closer to {{location}}.',
        'instruction', 'When you are close to {{location}}, tap I''m Nearby. Keep this page open.'
      ),
      'released', jsonb_build_object(
        'title', 'Your Turn',
        'detail', 'Go to {{location}}. Enter the station code there to complete this step.'
      ),
      'completed', jsonb_build_object(
        'title', 'Completed',
        'detail', 'This step is complete. You can return to the event.'
      )
    )
  )
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
  and expies.slug = 'scan-code-adventure'
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and eces.slug = 'scan-code-adventure';
