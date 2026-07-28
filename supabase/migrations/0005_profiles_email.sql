-- ============================================================================
-- Ishmar Halal Expo — Add email to profiles
-- Run this if you already ran 0001-0004 before this file existed.
-- Safe to run more than once.
-- ============================================================================

alter table public.profiles add column if not exists email text;

-- Backfill existing profiles from auth.users (SQL Editor runs as an
-- elevated role, so it can read auth.users directly here).
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is distinct from u.email;

-- Keep new signups in sync going forward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'viewer');
  return new;
end;
$$;
