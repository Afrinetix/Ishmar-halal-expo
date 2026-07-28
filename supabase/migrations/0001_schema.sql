-- ============================================================================
-- Ishmar Halal Expo — Database Schema
-- Run this first in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enum types
-- ----------------------------------------------------------------------------
create type public.user_role as enum (
  'super_admin', 'admin', 'editor', 'event_manager', 'media_manager', 'viewer'
);

create type public.event_category as enum (
  'trade_fair', 'conference', 'networking', 'corporate'
);

create type public.event_status as enum (
  'upcoming', 'past', 'cancelled', 'postponed'
);

create type public.media_kind as enum ('image', 'video');

create type public.sponsor_tier as enum ('bronze', 'silver', 'gold', 'platinum');

create type public.partner_type as enum ('government', 'finance', 'trade', 'venue', 'other');

create type public.press_type as enum ('press', 'interview', 'publication', 'download');

create type public.publish_status as enum ('draft', 'published', 'archived');

create type public.registration_role as enum ('visitor', 'exhibitor', 'sponsor', 'speaker');

create type public.registration_status as enum ('new', 'confirmed', 'cancelled');

create type public.message_status as enum ('new', 'read', 'archived');

-- ----------------------------------------------------------------------------
-- profiles  (extends auth.users — this is the "users" table from the spec;
-- Supabase already owns auth.users, so admin roles live in a linked profile)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
-- New users default to 'viewer' — promote the first admin manually (see README).
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category public.event_category not null,
  status public.event_status not null default 'upcoming',
  summary text,
  description text,
  start_date date not null,
  end_date date,
  venue_name text,
  venue_address text,
  city text default 'Nairobi',
  country text default 'Kenya',
  cover_image_url text,
  expected_visitors integer,
  exhibitor_count integer,
  agenda jsonb not null default '[]'::jsonb,
  speakers jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_status_idx on public.events(status);
create index events_start_date_idx on public.events(start_date);

-- ----------------------------------------------------------------------------
-- registrations  (event sign-ups: visitors, exhibitors, sponsors, speakers)
-- ----------------------------------------------------------------------------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  role_type public.registration_role not null default 'visitor',
  message text,
  status public.registration_status not null default 'new',
  created_at timestamptz not null default now()
);
create index registrations_event_idx on public.registrations(event_id);

-- ----------------------------------------------------------------------------
-- gallery  (photos)
-- ----------------------------------------------------------------------------
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  thumbnail_url text,
  category text,
  event_id uuid references public.events(id) on delete set null,
  year integer,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_event_idx on public.gallery(event_id);

-- ----------------------------------------------------------------------------
-- videos
-- ----------------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  category text,
  event_id uuid references public.events(id) on delete set null,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index videos_event_idx on public.videos(event_id);

-- ----------------------------------------------------------------------------
-- blog_posts  (Insights articles)
-- ----------------------------------------------------------------------------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  category text,
  tags text[] not null default '{}',
  author_name text,
  author_title text,
  author_avatar_url text,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_status_idx on public.blog_posts(status);
create index blog_posts_published_idx on public.blog_posts(published_at desc);

-- ----------------------------------------------------------------------------
-- sponsors
-- ----------------------------------------------------------------------------
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier public.sponsor_tier,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- partners
-- ----------------------------------------------------------------------------
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  partner_type public.partner_type not null default 'other',
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- testimonials
-- ----------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_title text,
  author_company text,
  author_avatar_url text,
  quote text not null,
  rating smallint check (rating between 1 and 5) default 5,
  event_id uuid references public.events(id) on delete set null,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- media  (press coverage, interviews, publications, downloads)
-- ----------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type public.press_type not null,
  source_name text,
  file_url text,
  external_url text,
  description text,
  published_date date,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- contact_messages  (contact form submissions)
-- ----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  topic text,
  message text not null,
  status public.message_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- subscribers  (newsletter signups — supports the newsletter forms on-site)
-- ----------------------------------------------------------------------------
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source_page text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- pages  (CMS-editable content blocks for static pages, e.g. About)
-- ----------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- settings  (site-wide key/value settings: contact info, socials, etc.)
-- ----------------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- seo_metadata  (per-page SEO overrides, editable without touching code)
-- ----------------------------------------------------------------------------
create table public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  page_path text not null unique,
  title text,
  description text,
  og_image_url text,
  canonical_url text,
  robots text default 'index, follow',
  schema_json jsonb,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at auto-touch trigger, applied to every table that has the column
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_events before update on public.events
  for each row execute function public.touch_updated_at();
create trigger touch_blog_posts before update on public.blog_posts
  for each row execute function public.touch_updated_at();
create trigger touch_pages before update on public.pages
  for each row execute function public.touch_updated_at();
create trigger touch_settings before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger touch_seo_metadata before update on public.seo_metadata
  for each row execute function public.touch_updated_at();
