# Supabase setup — Ishmar Halal Expo

## 1. Run the migrations

Open your Supabase project -> **SQL Editor** -> **New query**, and run these
files **in order** (each depends on the one before it):

1. `migrations/0001_schema.sql` — enums, tables, indexes, triggers
2. `migrations/0002_policies.sql` — Row Level Security for every table
3. `migrations/0003_storage.sql` — storage buckets (`gallery`, `events`,
   `videos`, `documents`, `logos`, `team`, `blog`, `media`) + upload rules
4. `migrations/0004_seed.sql` — optional but recommended: seeds real rows
   matching the placeholder content already on the site, so both the public
   pages and the future admin CMS have something to show immediately
5. `migrations/0005_profiles_email.sql` — adds an `email` column to
   `profiles` (used by the admin Users page) and backfills it from
   `auth.users`. **Required if you ran 0001-0004 before this file existed.**
6. `migrations/0006_secure_role_updates.sql` — **security fix, run this even
   if you think you don't need it.** Without it, the "update own profile"
   policy from step 2 lets any signed-in user set their *own* role to
   `super_admin`, since RLS row policies don't restrict individual columns.
   This adds a trigger that silently blocks anyone but an existing
   Super Admin from changing the `role` column.
7. `migrations/0007_content_refresh.sql` — updates the event rows and
   settings seeded by 0004 so they match the current company profile: the
   48-expo milestone, the Nairobi + Mombasa event split, and the full legal
   name (Ishmar Halal Traders Expo Limited) in `site_identity`. Safe to
   re-run; uses `on conflict ... do update`.
8. `migrations/0008_default_role_admin.sql` — new sign-ups now default to
   `admin` instead of `viewer`. `viewer` is read-only, which is why saves
   (e.g. adding a gallery photo) were silently rejected for any account
   that hadn't been manually promoted. This also upgrades any existing
   `viewer` accounts to `admin`.

Paste each file's contents into a new query and click **Run**. If a step
fails partway, fix the error and re-run just that file — every statement
uses `if not exists` / `on conflict do nothing` where it matters, so
re-running is safe.

## 2. Connect the site to your project

In [assets/js/supabase-client.js](../assets/js/supabase-client.js), replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

with the values from **Project Settings -> API** in your Supabase dashboard:
- **Project URL** -> `SUPABASE_URL`
- **anon / public** key -> `SUPABASE_ANON_KEY`

Never put the `service_role` key here or anywhere in this repo — it bypasses
every RLS rule below and must stay server-side only (Supabase dashboard,
or a future serverless function).

Until these two values are filled in, the contact and newsletter forms on
the live site fall back to a client-only "thanks, we got it" message and
don't persist anywhere — see `submitContact` / `submitNewsletter` in
[assets/js/main.js](../assets/js/main.js).

## 3. Create your first admin user

The public site has no sign-up page by design — admin accounts are created
directly in Supabase:

1. Dashboard -> **Authentication** -> **Users** -> **Add user** (set an email
   and password, or send a magic link). This automatically creates a row in
   `public.profiles` with `role = 'admin'` (see the `handle_new_user`
   trigger, updated in `0008_default_role_admin.sql`) — enough to manage
   every content table right away, with no manual SQL step required.
2. If you specifically need that account to manage *other users'* roles
   too (the Users page in the admin panel), promote it to Super Admin:
   ```sql
   update public.profiles set role = 'super_admin' where id =
     (select id from auth.users where email = 'you@ishmarexpo.com');
   ```
   This is the one thing `admin` deliberately can't do — it's kept to a
   smaller set of trusted accounts so any signed-in admin can't grant
   themselves (or anyone else) elevated access.

## 4. Log in to the admin panel

Go to `/admin/` (or `/admin/index.html`) on your deployed site and sign in
with the account from step 3. The dashboard and all 13 content sections
(Events, Gallery, Videos, Blog, Sponsors, Partners, Testimonials, Media,
Messages, Subscribers, Users, SEO Settings, Website Settings) are behind
that login. Edits made there now appear on the live public site — see
"Dynamic wiring" in the main project README for how that works and what's
still static.

## Roles at a glance

| Role | Can write |
|---|---|
| `super_admin` | Everything, including other users' roles |
| `admin` | All content tables (not other users' roles) |
| `editor` | `blog_posts`, `pages`, `seo_metadata` |
| `event_manager` | `events`, `registrations` |
| `media_manager` | `gallery`, `videos`, `media`, `testimonials` |
| `viewer` | Read-only on admin-facing data (`registrations`, `contact_messages`, `subscribers`, draft posts) |

The public (anonymous) site visitor can always read published content, and
can only *insert* into `registrations`, `contact_messages` and `subscribers`
— never read other people's submissions. Full rules are in
`migrations/0002_policies.sql`.

## Tables

`profiles` (roles, extends `auth.users`), `events`, `registrations`,
`gallery`, `videos`, `blog_posts`, `sponsors`, `partners`, `testimonials`,
`media`, `contact_messages`, `subscribers`, `pages`, `settings`,
`seo_metadata`.
