-- ============================================================================
-- Ishmar Halal Expo — Storage buckets
-- Run this third, after 0002_policies.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Buckets (all public-read so images/videos render on the public site;
-- writes are restricted to authenticated staff by the policies below)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('gallery', 'gallery', true),
  ('events', 'events', true),
  ('videos', 'videos', true),
  ('documents', 'documents', true),
  ('logos', 'logos', true),
  ('team', 'team', true),
  ('blog', 'blog', true),
  ('media', 'media', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Public read access to every file in every bucket above
-- ----------------------------------------------------------------------------
create policy "public_read_site_buckets"
  on storage.objects for select
  using (bucket_id in ('gallery', 'events', 'videos', 'documents', 'logos', 'team', 'blog', 'media'));

-- ----------------------------------------------------------------------------
-- Authenticated staff can upload / replace / delete files.
-- Any signed-in admin-panel user (any role) may upload; fine-grained
-- per-bucket restriction can be tightened later if needed.
-- ----------------------------------------------------------------------------
create policy "staff_upload_site_buckets"
  on storage.objects for insert
  with check (
    bucket_id in ('gallery', 'events', 'videos', 'documents', 'logos', 'team', 'blog', 'media')
    and public.is_staff()
  );

create policy "staff_update_site_buckets"
  on storage.objects for update
  using (
    bucket_id in ('gallery', 'events', 'videos', 'documents', 'logos', 'team', 'blog', 'media')
    and public.is_staff()
  );

create policy "staff_delete_site_buckets"
  on storage.objects for delete
  using (
    bucket_id in ('gallery', 'events', 'videos', 'documents', 'logos', 'team', 'blog', 'media')
    and public.is_staff()
  );
