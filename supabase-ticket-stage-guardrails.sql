-- qME ticket stage guardrails.
-- Run after supabase-sotc-queue-pilot.sql.
--
-- This protects the queue max from older clients or direct updates that mark a
-- released guest "Not here" by moving them straight back into Gathering.

alter table public.tickets
  add column if not exists gathering_snoozed_at timestamptz;

create or replace function public.set_ticket_stage_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_updated_at = now();

    if old.stage = 'released'
      and new.stage = 'standby'
      and new.nearby_confirmed_at is null then
      new.stage = 'waiting';
      new.gathering_snoozed_at = now();
      new.released_at = null;
    end if;

    if new.stage = 'released'
      and old.stage is distinct from 'released'
      and new.nearby_confirmed_at is null then
      raise exception 'Ticket must be marked nearby before release.';
    end if;

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
