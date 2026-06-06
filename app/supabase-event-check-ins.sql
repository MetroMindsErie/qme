-- Event-level named check-ins for qME alpha testing.
-- Run this in the Supabase SQL editor before using /events/:slug/check-in.

create table if not exists public.event_check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  code text,
  ticket_type text check (ticket_type in ('general', 'flowers')),
  status text not null default 'waiting'
    check (status in ('waiting', 'called', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_check_ins_event_status_idx
  on public.event_check_ins(event_id, status, created_at);

alter table public.event_check_ins
  add column if not exists ticket_type text
  check (ticket_type in ('general', 'flowers'));

alter table public.event_check_ins enable row level security;

drop policy if exists "event_check_ins_select_all" on public.event_check_ins;
create policy "event_check_ins_select_all"
  on public.event_check_ins
  for select
  using (true);

drop policy if exists "event_check_ins_insert_all" on public.event_check_ins;
create policy "event_check_ins_insert_all"
  on public.event_check_ins
  for insert
  with check (true);

drop policy if exists "event_check_ins_update_all" on public.event_check_ins;
create policy "event_check_ins_update_all"
  on public.event_check_ins
  for update
  using (true)
  with check (true);

create or replace function public.set_event_check_ins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_check_ins_updated_at on public.event_check_ins;
create trigger event_check_ins_updated_at
before update on public.event_check_ins
for each row
execute function public.set_event_check_ins_updated_at();
