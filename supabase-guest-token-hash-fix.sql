-- qME guest token hash hotfix.
-- Run if guest check-in fails with:
-- "function digest(text, unknown) does not exist"
--
-- This keeps the existing guest-session model, but schema-qualifies
-- pgcrypto because Supabase commonly installs extensions outside `public`
-- while our security-definer functions set search_path = public.

create extension if not exists pgcrypto;

create or replace function public.guest_token_hash(p_guest_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(convert_to(coalesce(p_guest_token, ''), 'UTF8'), 'sha256'), 'hex')
$$;
