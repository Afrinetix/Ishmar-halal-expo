-- ============================================================================
-- Ishmar Halal Expo — Seed data
-- Optional but recommended: run this fourth so the admin CMS and site have
-- real rows to work with immediately. Matches the placeholder content
-- already written into the static HTML pages.
-- ============================================================================

insert into public.events
  (slug, title, category, status, summary, description, start_date, end_date,
   venue_name, venue_address, expected_visitors, exhibitor_count, is_featured)
values
  ('ishmar-halal-trade-expo-2027', 'Ishmar Halal Trade Expo 2027', 'trade_fair', 'upcoming',
   'Our flagship exhibition uniting food, cosmetics, finance and tourism exhibitors from across Africa.',
   'The Ishmar Halal Trade Expo is our flagship exhibition and the largest halal-focused trade event in East Africa. Over three days, more than 350 exhibitors set up across four halls at KICC, hosting pre-scheduled meetings with buyers who have travelled from 40 countries.',
   '2027-03-18', '2027-03-20', 'Kenyatta International Convention Centre', 'Harambee Avenue, Nairobi',
   12400, 350, true),
  ('halal-investment-summit-2027', 'Halal Investment Summit', 'conference', 'upcoming',
   'A one-day forum connecting halal enterprises with regional banks, DFIs and private capital.',
   'Investor panels, SME pitch sessions and structured introductions between halal businesses and the funds looking to back them.',
   '2027-05-06', '2027-05-06', 'Radisson Blu', 'Upper Hill, Nairobi', 600, null, false),
  ('sme-halal-business-mixer-2027', 'SME Halal Business Mixer', 'networking', 'upcoming',
   'An evening of structured B2B matchmaking for small and growing halal-certified businesses.',
   'Pre-scheduled buyer-seller meetings for small and growing halal-certified businesses.',
   '2027-07-14', '2027-07-14', 'Sarit Centre', 'Westlands, Nairobi', 300, null, false),
  ('ishmar-halal-trade-expo-2026', 'Ishmar Halal Trade Expo 2026', 'trade_fair', 'past',
   '324 exhibitors, 41 countries, and $24M in trade deals tracked across three days.',
   'The 2026 edition of our flagship exhibition.',
   '2026-03-19', '2026-03-21', 'Kenyatta International Convention Centre', 'Harambee Avenue, Nairobi',
   11800, 324, false)
on conflict (slug) do nothing;

insert into public.blog_posts
  (slug, title, excerpt, content, category, author_name, author_title, status, published_at)
values
  ('why-halal-certification-drives-growth',
   'Why halal certification is becoming a growth lever for African SMEs',
   'Certification used to be a compliance cost. For a growing number of exporters, it is now the fastest way to get a first meeting with a serious buyer.',
   'For years, halal certification was treated by most small food producers as a box to tick before they could sell into a particular market. That is changing quickly, and the businesses that noticed first are now several steps ahead of everyone else on the exhibition floor.',
   'Halal Trade', 'Zainab Kimani', 'Head of Marketing, Ishmar Halal Expo', 'published', '2026-06-12T09:00:00Z'),
  ('five-export-mistakes',
   'Five export mistakes halal food brands keep making',
   'Most rejected shipments trace back to paperwork, not product. Here is what to fix before you book a stand.',
   'Every year we watch a handful of exhibitors turn strong stand traffic into stalled deals, and it is rarely the product''s fault. Here are the five mistakes we see most often.',
   'SME Growth', 'Omar Farah', 'Director of Partnerships, Ishmar Halal Expo', 'published', '2026-05-28T09:00:00Z')
on conflict (slug) do nothing;

insert into public.partners (name, partner_type, description, is_active, sort_order)
values
  ('Kenya Investment Authority', 'government', 'Facilitates investment leads generated at our conferences.', true, 1),
  ('TradeMark Africa', 'trade', 'Supports cross-border logistics for exhibiting SMEs.', true, 2),
  ('Nairobi Chamber of Commerce', 'trade', 'Co-hosts our exporter briefings and networking sessions.', true, 3),
  ('East Africa Halal Bureau', 'other', 'Verifies exhibitor certifications ahead of every edition.', true, 4),
  ('Baraka Capital', 'finance', 'Runs the SME pitch sessions at our Investment Summit.', true, 5),
  ('KICC Nairobi', 'venue', 'Our flagship venue partner since 2022.', true, 6)
on conflict do nothing;

insert into public.testimonials (author_name, author_title, author_company, quote, rating, is_featured, sort_order)
values
  ('Amina Yusuf', 'Export Manager', 'Zamzam Foods',
   'We closed three distribution deals on day two alone. The buyer quality at Ishmar is unlike any other trade show we''ve attended in the region.', 5, true, 1),
  ('Hassan Mwangi', 'CEO', 'Nur Cosmetics',
   'The organizing team handled every logistics detail so our people could focus on selling. That level of professionalism is rare.', 5, true, 2),
  ('Fatima Noor', 'Investment Director', 'Baraka Capital',
   'Ishmar gave our fund direct access to fifteen investable halal SMEs in a single week. That kind of pipeline usually takes months to build.', 5, true, 3)
on conflict do nothing;

insert into public.settings (key, value)
values
  ('contact_info', '{"phone": "+254700000000", "email": "info@ishmarexpo.com", "whatsapp": "254700000000", "address": "Muindi Mbingu Street, Nairobi, Kenya"}'::jsonb),
  ('social_links', '{"linkedin": "https://www.linkedin.com/company/ishmarhalalexpo", "facebook": "https://www.facebook.com/ishmarhalalexpo", "instagram": "https://www.instagram.com/ishmarhalalexpo", "twitter": "https://twitter.com/ishmarhalalexpo"}'::jsonb),
  ('site_identity', '{"name": "Ishmar Halal Expo Limited", "short_name": "Ishmar Halal Expo", "tagline": "Where Africa''s halal economy does business"}'::jsonb)
on conflict (key) do nothing;

insert into public.seo_metadata (page_path, title, description)
values
  ('/', 'Ishmar Halal Expo | Africa''s Premier Halal Trade Exhibitions',
   'Ishmar Halal Expo Limited organizes Africa''s leading halal trade fairs, conferences and business networking events.')
on conflict (page_path) do nothing;
