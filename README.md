# Ishmar Halal Expo — Website

Premium, enterprise-grade website for Ishmar Halal Expo Limited, Africa's halal
trade exhibition organizer. Built with vanilla HTML5, CSS3 and ES6+ JavaScript.
No frameworks, no build step, no page builder.

## Status: Phase 1 (public frontend) + Phase 2 (database) + Phase 3 (admin CMS) complete

The full public-facing site is static, production-ready HTML, deployed on
Vercel at [www.ishmarexpo.com](https://www.ishmarexpo.com) and connected to
a live Supabase project. The contact and newsletter forms persist to the
database. A full admin panel at `/admin/` lets Super Admin / Admin / Editor /
Event Manager / Media Manager / Viewer roles log in and manage every content
table (events, gallery, videos, blog, sponsors, partners, testimonials,
media, contact messages, subscribers, users, SEO settings, site settings) —
see `admin/` below and `supabase/README.md` for how to log in.

**Still ahead:** the public pages (index.html, events.html, gallery.html,
etc.) still show static, hand-written content — editing something in the
admin panel does not yet change what visitors see on the live site. Wiring
the public pages to read from Supabase instead of static HTML is the next
phase — see "What's next" below.

## Structure

```
/
├── index.html              Homepage
├── about.html               Story, vision, mission, values, milestones, leadership
├── services.html             10 service offerings
├── events.html                Upcoming / past / conferences / trade fairs / networking
├── event-detail.html           Flagship event detail template
├── gallery.html                Masonry gallery with filters + lightbox
├── media.html                  Press, videos, interviews, publications, downloads
├── insights.html               Blog / articles listing
├── insights/
│   ├── why-halal-certification-drives-growth.html
│   └── five-export-mistakes.html
├── partners.html
├── sponsors.html
├── contact.html
├── admin/                   Admin CMS (see "Admin CMS" below)
│   ├── index.html              Login
│   ├── dashboard.html          Stat overview + recent activity
│   ├── events.html, gallery.html, videos.html, blog.html,
│   │   sponsors.html, partners.html, testimonials.html, media.html
│   │                          Generic CRUD pages (list + create/edit/delete)
│   ├── messages.html            Contact form submissions (view + status only)
│   ├── subscribers.html          Newsletter signups (view + CSV export)
│   ├── users.html                 Role management (Super Admin only)
│   ├── seo.html                    Per-page SEO overrides
│   └── settings.html                Site identity, contact info, social links
├── supabase/
│   ├── README.md              Setup steps, role model, how to log in to the admin panel
│   └── migrations/            0001_schema · 0002_policies · 0003_storage · 0004_seed ·
│                                0005_profiles_email · 0006_secure_role_updates
├── assets/
│   ├── css/style.css         Full design system (tokens, typography, components)
│   ├── css/admin.css         Admin-only styles (sidebar, tables, modals) — extends style.css
│   ├── js/supabase-client.js Supabase connection (CDN-based, no build step — fill in
│   │                          your Project URL + anon key here)
│   ├── js/main.js            Nav, mega menus, reveal animations, counters, filters,
│   │                          lightbox, form handling (Supabase-backed), FAQ accordion
│   ├── js/admin/auth.js      Session guard + role-based nav visibility + logout,
│   │                          used by every admin page except the login page
│   ├── js/admin/crud.js      Generic config-driven CRUD engine — each admin content
│   │                          page defines list columns + form fields, this renders it
│   ├── images/, icons/, fonts/  (placeholders — see "Images" below)
├── templates/                Authoring fragments used to assemble pages (see below)
├── sitemap.xml
├── robots.txt
└── vercel.json (add when deploying)
```

## Design system

Brand colours, spacing, typography scale and shadows are defined as CSS custom
properties at the top of `assets/css/style.css`. Change a value there and it
propagates across every page — the ten public pages share this one stylesheet.

- Fonts: **Fraunces** (display/headings) + **Inter** (body), loaded from Google Fonts.
- Colours: Gold `#F4B41A`, Rich Black `#111111`, White, Light Gray `#F8F9FA`, Dark Gray `#444444`.

## How pages are assembled

Every page shares an identical header, mega-navigation and footer. Rather than
hand-duplicating that markup (error-prone at this scale), the `templates/`
folder holds the shared fragments plus one head/body fragment per page:

```
templates/partial-header.html       Shared <header> + <main> open tag
templates/partial-footer.html       Shared </main> + <footer> + floating UI + scripts
templates/partial-assets-head.html  Shared favicon/font/stylesheet <head> tags
templates/partial-body-start.html   Loader + skip link
templates/frag-<page>-head.html     Per-page <title>/meta/OG/schema
templates/frag-<page>-body.html     Per-page main content
templates/assemble.sh               Concatenates the above into the final .html file
```

To edit a page: change its `frag-<page>-body.html`, then re-run:

```bash
bash templates/assemble.sh <output-file> <head-fragment> <body-fragment>
# e.g.
bash templates/assemble.sh services.html templates/frag-services-head.html templates/frag-services-body.html
```

To change the nav or footer everywhere: edit `templates/partial-header.html` or
`templates/partial-footer.html`, then re-run `assemble.sh` for every page.

The two pages under `insights/` are one directory deeper, so their header/footer
paths are hand-written with `../` prefixes rather than assembled — there are
only two of them today. If the blog grows, it's worth generating those too.

## Admin CMS

Every admin page except the login screen follows the same shell (sidebar +
topbar) and loads three scripts in order: the Supabase CDN client,
`supabase-client.js`, then `assets/js/admin/auth.js` — which checks for a
session, redirects to `admin/index.html` if there isn't one, loads the
caller's role from `profiles`, and fires an `ishmar-admin-ready` event once
that's done. Content pages listen for that event and hand a small config
object to `initCrudPage()` in `assets/js/admin/crud.js`, which renders the
list, search, create/edit modal (including image upload to Storage) and
delete — see `admin/events.html` for the fullest example of a config.

Three pages don't fit that generic pattern and are hand-built instead:
- `users.html` — gated to `role === 'super_admin'` client-side (RLS enforces
  it server-side regardless); reuses the CRUD engine's class directly rather
  than the full table since only the `role` field is editable.
- `settings.html` — the `settings` table is a small, fixed key/value store
  (`site_identity`, `contact_info`, `social_links`), so this is a bespoke
  form per key rather than a generic list.
- `messages.html` uses the CRUD engine but marks every field `readonly:
  true` except `status`, since messages are viewed/triaged, not authored.

The UI hides what a role can't do (e.g. only Super Admin sees the Users nav
link), but the real enforcement is the RLS policies in
`supabase/migrations/0002_policies.sql` — a disabled button is a UX nicety,
not the security boundary.

## Images

All photography currently points to Unsplash stock URLs (clearly usable for
prototyping, not licensed for production) and a few `dummyimage.com`
placeholder logos for partners/sponsors. Before launch:

1. Replace every `images.unsplash.com` URL with real, licensed photography
   (ideally served from Supabase Storage once Phase 2 is wired in).
2. Replace the `dummyimage.com` partner/sponsor logos with real brand assets.
3. Add a real `assets/images/logo.png` and `assets/images/og-cover.jpg`
   (currently only an inline SVG favicon exists).

## Local preview

No build step is required. Any static file server works:

```bash
python -m http.server 8090
# then open http://localhost:8090
```

## What's next

1. **Dynamic wiring** — the one big remaining piece. The public pages
   (index.html, events.html, gallery.html, insights.html, etc.) still show
   static, hand-written HTML. Editing an event in `/admin/events.html`
   updates the database but not what a visitor sees. Each public page needs
   its static cards/lists replaced with a Supabase `select()` on page load.
2. **`pages` table isn't used yet** — it exists for CMS-editable blocks
   (e.g. the About page story/mission text) but no admin UI or public-page
   wiring reads from it yet.
3. **`settings` values aren't read by the public site yet** — editing
   contact info or social links in `/admin/settings.html` updates the
   database, but the footer/contact page still show the hand-written values
   baked into the HTML.

## Content note

Company name, team names, statistics, testimonials, press mentions and
historical dates throughout this site (e.g. "founded 2017", exhibitor counts,
leadership names) are placeholder content written to demonstrate tone and
structure. Replace with Ishmar's real figures, history and team before launch.
