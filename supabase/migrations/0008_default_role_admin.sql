-- ============================================================================
-- Ishmar Halal Traders Expo — Default new accounts to 'admin', not 'viewer'
-- Run this after 0007. Safe to re-run.
-- ============================================================================

-- New Supabase Auth sign-ups previously landed on 'viewer' (read-only) until
-- someone manually promoted them via SQL — which is why gallery/event saves
-- were silently rejected by Row Level Security. New accounts now start as
-- 'admin', which already has full read/write access to every content table
-- (events, gallery, videos, blog, sponsors, partners, testimonials, media,
-- pages, settings, seo_metadata) — everything except managing other users'
-- roles, which stays restricted to 'super_admin' for security.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$;

-- Optional: promote any existing accounts still stuck on 'viewer' to 'admin'.
-- Comment this out if you have a viewer account you deliberately want kept
-- read-only.
update public.profiles set role = 'admin' where role = 'viewer';
