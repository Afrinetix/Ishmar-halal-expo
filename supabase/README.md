# Supabase setup — Ishmar Halal Expo

## 1. Run the migrations

Open your Supabase project -> **SQL Editor** -> **New query**, and run these
four files **in order** (each depends on the one before it):

1. `migrations/0001_schema.sql` — enums, tables, indexes, triggers
2. `migrations/0002_policies.sql` — Row Level Security for every table
3. `migrations/0003_storage.sql` — storage buckets (`gallery`, `events`,
   `videos`, `documents`, `logos`, `team`, `blog`, `media`) + upload rules
4. `migrations/0004_seed.sql` — optional but recommended: seeds real rows
   matching the placeholder content already on the site, so both the public
   pages and the future admin CMS have something to show immediately

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
   `public.profiles` with `role = 'viewer'` (see the `handle_new_user`
   trigger in `0001_schema.sql`).
2. Promote that user to Super Admin by running in the SQL Editor:
   ```sql
   update public.profiles set role = 'super_admin' where id =
     (select id from auth.users where email = 'you@ishmarexpo.com');
   ```
3. From then on, that Super Admin can manage other users' roles once the
   admin CMS (`admin/`) is built — see the main project README for what's
   still ahead.

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
