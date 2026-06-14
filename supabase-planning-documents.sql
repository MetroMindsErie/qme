-- qME planning workspace data store.
-- Run this in the Supabase SQL editor for the qMe MVP project.

create table if not exists public.planning_documents (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.planning_documents enable row level security;

-- No public policies are created on purpose.
-- The deployed /api/planning-data function should read this table with a
-- server-side Supabase service role key, after the planning access code passes.

create or replace function public.set_planning_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planning_documents_updated_at on public.planning_documents;
create trigger planning_documents_updated_at
before update on public.planning_documents
for each row
execute function public.set_planning_documents_updated_at();
