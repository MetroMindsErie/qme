-- qME Security Emergency Remediation
-- Date: 2026-07-16
--
-- Run after reviewing supabase-security-emergency-verification.sql output.
-- This closes confirmed legacy/pilot exposure at the table/policy/grant level.
--
-- Also apply the updated function files in this repo:
-- 1. supabase-guest-action-rls-tightening.sql
-- 2. supabase-admin-queue-action-rpcs.sql
--
-- Those function files remove display-name fallback for credit consumption.

begin;

-- 1. Close anonymous direct access to group-order pilot data.
do $$
begin
  if to_regclass('public.event_group_order_items') is not null then
    revoke all on public.event_group_order_items from anon;
    grant select, insert, update, delete on public.event_group_order_items to authenticated;

    alter table public.event_group_order_items enable row level security;

    drop policy if exists "event_group_order_items_all" on public.event_group_order_items;
    drop policy if exists "event_group_order_items_staff_all" on public.event_group_order_items;

    create policy "event_group_order_items_staff_all"
      on public.event_group_order_items
      for all
      to authenticated
      using (public.can_manage_event_guest_action(event_id))
      with check (public.can_manage_event_guest_action(event_id));
  end if;
end;
$$;

-- 2. Close anonymous direct reads/writes to guest credits.
revoke all on public.event_guest_credits from anon;
grant select, insert, update, delete on public.event_guest_credits to authenticated;

alter table public.event_guest_credits enable row level security;

drop policy if exists "event_guest_credits_all" on public.event_guest_credits;
drop policy if exists "event_guest_credits_select_pilot" on public.event_guest_credits;
drop policy if exists "event_guest_credits_select_staff" on public.event_guest_credits;
create policy "event_guest_credits_select_staff"
  on public.event_guest_credits
  for select
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_credits_insert_staff" on public.event_guest_credits;
create policy "event_guest_credits_insert_staff"
  on public.event_guest_credits
  for insert
  to authenticated
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_credits_update_staff" on public.event_guest_credits;
create policy "event_guest_credits_update_staff"
  on public.event_guest_credits
  for update
  to authenticated
  using (public.can_manage_event_guest_action(event_id))
  with check (public.can_manage_event_guest_action(event_id));

drop policy if exists "event_guest_credits_delete_staff" on public.event_guest_credits;
create policy "event_guest_credits_delete_staff"
  on public.event_guest_credits
  for delete
  to authenticated
  using (public.can_manage_event_guest_action(event_id));

-- 3. Lock down the one-time bootstrap escalation helper.
revoke all on function public.grant_qme_superadmin(uuid, text, text) from public;
revoke all on function public.grant_qme_superadmin(uuid, text, text) from anon;
revoke all on function public.grant_qme_superadmin(uuid, text, text) from authenticated;

-- 4. Admin queue completion must not be directly executable by anon.
-- Guest completion remains available through complete_queue_ticket_for_guest,
-- which verifies the guest token and ticket ownership internally.
revoke all on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) from public;
revoke all on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) from anon;
grant execute on function public.admin_complete_queue_ticket(uuid, bigint, text, text, uuid, text, text, jsonb) to authenticated;

commit;
