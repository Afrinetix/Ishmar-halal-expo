-- ============================================================================
-- Ishmar Halal Expo — Security fix: prevent self role escalation
-- Run this after 0005. Important: without this, the "update own profile"
-- policy from 0002_policies.sql lets ANY signed-in user set their own
-- role to super_admin, since RLS `using`/`with check` clauses only filter
-- rows, not individual columns. This trigger closes that gap by silently
-- reverting any role change made by someone who isn't already a super_admin.
-- ============================================================================

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.current_role() is distinct from 'super_admin' then
    new.role = old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_change on public.profiles;
create trigger guard_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();
