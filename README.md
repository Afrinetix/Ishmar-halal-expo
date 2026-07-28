# Ishmar Halal Traders Expo — Website

Premium, enterprise-grade website for Ishmar Halal Traders Expo Limited,
Kenya's trusted exhibition and business networking company, organizer of
48 successful expos across Nairobi and Mombasa. Built with vanilla HTML5,
CSS3 and ES6+ JavaScript. No frameworks, no build step, no page builder.

## Status: Phase 1 (frontend) + Phase 2 (database) + Phase 3 (admin CMS) + Phase 4 (dynamic wiring) complete

The site is deployed on Vercel at [www.ishmarexpo.com](https://www.ishmarexpo.com)
and connected to a live Supabase project. The admin panel at `/admin/` lets
Super Admin / Admin / Editor / Event Manager / Media Manager / Viewer roles
manage every content table, and — as of Phase 4 — **those edits now show up
on the live site**: `assets/js/public-data.js` fetches Events, Gallery,
Blog Posts, Testimonials, Partners/Sponsors logos, Press and Videos from
Supabase on page load and swaps them into the same markup the static
fallback content uses, so nothing ever renders empty and no design/layout
changed. Contact info and social links set in `/admin/settings.html`
propagate into the footer and WhatsApp button on every page. See "Dynamic
wiring" below for exactly how, and `supabase/README.md` for how to log in
and which migrations to run.

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
│                                0005_profiles_email · 0006_secure_role_updates ·
│                                0007_content_refresh (48-expo milestone, Nairobi + Mombasa)
├── assets/
│   ├── css/style.css         Full design system (tokens, typography, components)
│   ├── css/admin.css         Admin-only styles (sidebar, tables, modals) — extends style.css
│   ├── js/supabase-client.js Supabase connection (CDN-based, no build step — fill in
│   │                          your Project URL + anon key here)
│   ├── js/public-data.js     Fetches Events/Gallery/Blog/Testimonials/Partners/Media from
│   │                          Supabase and renders them into existing page markup (see
│   │                          "Dynamic wiring" below)
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

## Dynamic wiring

Every dynamic container has a stable `id` (e.g. `#dyn-featured-events`,
`#dyn-events-upcoming`, `#dyn-gallery-grid`, `#dyn-blog-grid`,
`#dyn-testimonials`, `#dyn-partners-logos`, `#dyn-partners-institutional`,
`#dyn-partners-finance`, `#dyn-press-list`, `#dyn-video-grid`,
`#dyn-latest-news`) already sitting on top of the same static example
content used during Phase 1. On `DOMContentLoaded`, `public-data.js`:

1. Checks each id exists on the current page (most pages only have a few).
2. Queries the matching Supabase table.
3. **Only replaces `innerHTML` if the query returned rows** — an empty
   table leaves the static fallback exactly as it was, so a page never
   renders empty just because nothing's been added in the admin yet.
4. Renders using the exact CSS classes the static markup already used
   (`.card`, `.masonry__item`, `.testimonial-card`, etc.), so no layout or
   animation changed — `[data-reveal-group]` fade-ins still work because
   only the *children* of an already-observed container are replaced, never
   the container itself.

`event-detail.html` reads `?slug=` from the URL and overwrites the
in-page text (title, dates, venue, visitor/exhibitor counts) if a matching
event is found; without a slug or a match it just shows its static
flagship-event content. `insights/post.html` is a new generic template for
blog posts created in the admin that don't have a hand-written file like
`insights/five-export-mistakes.html` — it renders entirely from `?slug=`.

Two small fixes in `main.js` were required for this to work: the filter-bar
click handler now re-queries the DOM instead of caching a stale item list,
and the lightbox uses event delegation instead of per-element listeners —
both so content injected *after* page load still works with the existing
filter/lightbox features.

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

1. **Run `supabase/migrations/0007_content_refresh.sql`** (and 0005/0006 if
   you haven't already) — it updates the event rows and settings seeded
   earlier so the live database matches the current company profile: the
   48-expo milestone, the Nairobi + Mombasa event split, and the full legal
   name in `site_identity`.
2. **`pages` table isn't used yet** — it exists for CMS-editable long-form
   blocks (e.g. the About page story/mission text) but no admin UI or
   public-page wiring reads from it yet; those sections are still static
   HTML, edited by changing the file directly.
3. **Interviews and Downloads on `media.html` are still static** — Press
   and Videos are wired to Supabase; the Interviews and Downloads sections
   were left as-is to keep this pass focused.
4. **Nairobi vs. Mombasa office fields on `contact.html` are still
   static** — `public-data.js` updates the single site-wide footer address
   from Website Settings, but the two office cards on the Contact page
   itself aren't yet bound to the `mombasa_phone`/`mombasa_address` fields
   added to `contact_info` in Phase 4.

## Content note

Team names, some statistics and historical milestone dates are placeholder
content written to demonstrate tone and structure (e.g. specific founding
year, individual leadership names, exact visitor/exhibitor counts). The
company profile itself — name, vision, mission, values, the 48-expo
milestone, and Nairobi/Mombasa as operating locations — reflects the brief
provided for Ishmar Halal Traders Expo Limited. Replace any remaining
placeholder specifics with the company's real figures before launch.
