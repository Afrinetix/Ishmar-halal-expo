-- ============================================================================
-- Ishmar Halal Expo — Row Level Security
-- Run this second, after 0001_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------------------------

-- Returns the calling user's role, or null if they have no profile
-- (i.e. an anonymous site visitor). security definer so it can read
-- profiles even though profiles itself is locked down by RLS below.
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- True for anyone with an admin-panel account, regardless of which role.
create or replace function public.is_staff()
returns boolean
language sql stable
as $$
  select public.current_role() is not null;
$$;

-- True if the caller's role is one of the given roles.
create or replace function public.has_role(variadic roles public.user_role[])
returns boolean
language sql stable
as $$
  select public.current_role() = any(roles);
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.gallery enable row level security;
alter table public.videos enable row level security;
alter table public.blog_posts enable row level security;
alter table public.sponsors enable row level security;
alter table public.partners enable row level security;
alter table public.testimonials enable row level security;
alter table public.media enable row level security;
alter table public.contact_messages enable row level security;
alter table public.subscribers enable row level security;
alter table public.pages enable row level security;
alter table public.settings enable row level security;
alter table public.seo_metadata enable row level security;

-- ----------------------------------------------------------------------------
-- profiles — users can see/update their own row; Super Admin manages everyone
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_super_admin"
  on public.profiles for select
  using (id = auth.uid() or public.has_role('super_admin'));

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_super_admin"
  on public.profiles for update
  using (public.has_role('super_admin'));

create policy "profiles_delete_super_admin"
  on public.profiles for delete
  using (public.has_role('super_admin'));

-- ----------------------------------------------------------------------------
-- events — public read; Event Manager/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "events_public_select" on public.events for select using (true);

create policy "events_staff_insert" on public.events for insert
  with check (public.has_role('event_manager', 'admin', 'super_admin'));
create policy "events_staff_update" on public.events for update
  using (public.has_role('event_manager', 'admin', 'super_admin'));
create policy "events_staff_delete" on public.events for delete
  using (public.has_role('event_manager', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- registrations — anyone can submit; staff can read/manage
-- ----------------------------------------------------------------------------
create policy "registrations_public_insert" on public.registrations for insert
  with check (true);
create policy "registrations_staff_select" on public.registrations for select
  using (public.has_role('event_manager', 'admin', 'super_admin', 'viewer'));
create policy "registrations_staff_update" on public.registrations for update
  using (public.has_role('event_manager', 'admin', 'super_admin'));
create policy "registrations_staff_delete" on public.registrations for delete
  using (public.has_role('event_manager', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- gallery — public read; Media Manager/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "gallery_public_select" on public.gallery for select using (true);
create policy "gallery_staff_insert" on public.gallery for insert
  with check (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "gallery_staff_update" on public.gallery for update
  using (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "gallery_staff_delete" on public.gallery for delete
  using (public.has_role('media_manager', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- videos — public read; Media Manager/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "videos_public_select" on public.videos for select using (true);
create policy "videos_staff_insert" on public.videos for insert
  with check (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "videos_staff_update" on public.videos for update
  using (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "videos_staff_delete" on public.videos for delete
  using (public.has_role('media_manager', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- blog_posts — public read only published; Editor/Admin/Super Admin write
-- and can also read drafts
-- ----------------------------------------------------------------------------
create policy "blog_posts_public_select" on public.blog_posts for select
  using (status = 'published' or public.is_staff());
create policy "blog_posts_staff_insert" on public.blog_posts for insert
  with check (public.has_role('editor', 'admin', 'super_admin'));
create policy "blog_posts_staff_update" on public.blog_posts for update
  using (public.has_role('editor', 'admin', 'super_admin'));
create policy "blog_posts_staff_delete" on public.blog_posts for delete
  using (public.has_role('editor', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- sponsors / partners / testimonials — public read active rows;
-- Admin/Super Admin write (relationship-sensitive, kept out of Editor's hands)
-- ----------------------------------------------------------------------------
create policy "sponsors_public_select" on public.sponsors for select
  using (is_active or public.is_staff());
create policy "sponsors_staff_write_insert" on public.sponsors for insert
  with check (public.has_role('admin', 'super_admin'));
create policy "sponsors_staff_write_update" on public.sponsors for update
  using (public.has_role('admin', 'super_admin'));
create policy "sponsors_staff_write_delete" on public.sponsors for delete
  using (public.has_role('admin', 'super_admin'));

create policy "partners_public_select" on public.partners for select
  using (is_active or public.is_staff());
create policy "partners_staff_write_insert" on public.partners for insert
  with check (public.has_role('admin', 'super_admin'));
create policy "partners_staff_write_update" on public.partners for update
  using (public.has_role('admin', 'super_admin'));
create policy "partners_staff_write_delete" on public.partners for delete
  using (public.has_role('admin', 'super_admin'));

create policy "testimonials_public_select" on public.testimonials for select
  using (true);
create policy "testimonials_staff_insert" on public.testimonials for insert
  with check (public.has_role('admin', 'super_admin', 'media_manager'));
create policy "testimonials_staff_update" on public.testimonials for update
  using (public.has_role('admin', 'super_admin', 'media_manager'));
create policy "testimonials_staff_delete" on public.testimonials for delete
  using (public.has_role('admin', 'super_admin', 'media_manager'));

-- ----------------------------------------------------------------------------
-- media (press/interviews/publications/downloads) — public read;
-- Media Manager/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "media_public_select" on public.media for select using (true);
create policy "media_staff_insert" on public.media for insert
  with check (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "media_staff_update" on public.media for update
  using (public.has_role('media_manager', 'admin', 'super_admin'));
create policy "media_staff_delete" on public.media for delete
  using (public.has_role('media_manager', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- contact_messages — anyone can submit; staff can read/manage
-- ----------------------------------------------------------------------------
create policy "contact_messages_public_insert" on public.contact_messages for insert
  with check (true);
create policy "contact_messages_staff_select" on public.contact_messages for select
  using (public.has_role('admin', 'super_admin', 'viewer'));
create policy "contact_messages_staff_update" on public.contact_messages for update
  using (public.has_role('admin', 'super_admin'));
create policy "contact_messages_staff_delete" on public.contact_messages for delete
  using (public.has_role('admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- subscribers — anyone can subscribe; staff can read/manage
-- ----------------------------------------------------------------------------
create policy "subscribers_public_insert" on public.subscribers for insert
  with check (true);
create policy "subscribers_staff_select" on public.subscribers for select
  using (public.has_role('admin', 'super_admin', 'viewer'));
create policy "subscribers_staff_delete" on public.subscribers for delete
  using (public.has_role('admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- pages — public read; Editor/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "pages_public_select" on public.pages for select using (true);
create policy "pages_staff_insert" on public.pages for insert
  with check (public.has_role('editor', 'admin', 'super_admin'));
create policy "pages_staff_update" on public.pages for update
  using (public.has_role('editor', 'admin', 'super_admin'));
create policy "pages_staff_delete" on public.pages for delete
  using (public.has_role('editor', 'admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- settings — public read; Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "settings_public_select" on public.settings for select using (true);
create policy "settings_staff_insert" on public.settings for insert
  with check (public.has_role('admin', 'super_admin'));
create policy "settings_staff_update" on public.settings for update
  using (public.has_role('admin', 'super_admin'));
create policy "settings_staff_delete" on public.settings for delete
  using (public.has_role('admin', 'super_admin'));

-- ----------------------------------------------------------------------------
-- seo_metadata — public read; Editor/Admin/Super Admin write
-- ----------------------------------------------------------------------------
create policy "seo_metadata_public_select" on public.seo_metadata for select using (true);
create policy "seo_metadata_staff_insert" on public.seo_metadata for insert
  with check (public.has_role('editor', 'admin', 'super_admin'));
create policy "seo_metadata_staff_update" on public.seo_metadata for update
  using (public.has_role('editor', 'admin', 'super_admin'));
create policy "seo_metadata_staff_delete" on public.seo_metadata for delete
  using (public.has_role('editor', 'admin', 'super_admin'));
