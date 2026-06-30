-- qME guest token hash hotfix.
-- Run if guest check-in fails with:
-- "function digest(text, unknown) does not exist"
--
-- This keeps the existing guest-session model, but uses pgcrypto's bytea
-- digest signature so token hashing works consistently in Supabase.

create extension if not exists pgcrypto;

create or replace function public.guest_token_hash(p_guest_token text)
returns text
language sql
immutable
as $$
  select encode(digest(convert_to(coalesce(p_guest_token, ''), 'UTF8'), 'sha256'), 'hex')
$$;
