# Ishmar Halal Expo — Website

Premium, enterprise-grade website for Ishmar Halal Expo Limited, Africa's halal
trade exhibition organizer. Built with vanilla HTML5, CSS3 and ES6+ JavaScript.
No frameworks, no build step, no page builder.

## Status: Phase 1 (public frontend) + Phase 2 (database) complete

The full public-facing site is static, production-ready HTML, deployed on
Vercel at [www.ishmarexpo.com](https://www.ishmarexpo.com). The Supabase
schema, RLS policies and storage buckets are written and ready to run (see
`supabase/README.md`), and the contact + newsletter forms are wired to post
to it once credentials are added to `assets/js/supabase-client.js`. The
admin CMS and dynamic content wiring for the rest of the site are still
ahead — see "What's next" below.

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
├── admin/                   Reserved for the future CMS (Phase 3)
├── supabase/
│   ├── README.md              Setup steps, role model, how to promote your first admin
│   └── migrations/            0001_schema · 0002_policies · 0003_storage · 0004_seed
├── assets/
│   ├── css/style.css         Full design system (tokens, typography, components)
│   ├── js/supabase-client.js Supabase connection (CDN-based, no build step — fill in
│   │                          your Project URL + anon key here)
│   ├── js/main.js            Nav, mega menus, reveal animations, counters, filters,
│   │                          lightbox, form handling (Supabase-backed), FAQ accordion
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

1. **Run the Supabase migrations and add your credentials** — see
   `supabase/README.md`. Until `assets/js/supabase-client.js` has a real
   Project URL and anon key, the contact and newsletter forms still work
   but only show a client-only confirmation; they don't persist anywhere.
2. **Admin CMS** (`admin/`) — authenticated dashboard so every table in
   Supabase (events, gallery, sponsors, blog, contact messages, SEO
   settings, etc.) is editable without touching code. The role model
   (Super Admin / Admin / Editor / Event Manager / Media Manager / Viewer)
   is already enforced at the database level via RLS — the CMS UI still
   needs building.
3. **Dynamic wiring** — swap the static event/gallery/blog/sponsor markup on
   the public pages for data fetched from Supabase, with images served from
   Storage so new uploads appear without a redeploy.

## Content note

Company name, team names, statistics, testimonials, press mentions and
historical dates throughout this site (e.g. "founded 2017", exhibitor counts,
leadership names) are placeholder content written to demonstrate tone and
structure. Replace with Ishmar's real figures, history and team before launch.
