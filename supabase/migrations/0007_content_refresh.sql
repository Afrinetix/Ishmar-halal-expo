-- ============================================================================
-- Ishmar Halal Traders Expo — Content refresh
-- Run this after 0006. Updates the rows seeded by 0004_seed.sql to match
-- the company's current profile: legal name, 48-expo milestone, and
-- Nairobi + Mombasa operations. Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Site identity + contact info (now covers both offices)
-- ----------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('site_identity', '{"name": "Ishmar Halal Traders Expo Limited", "short_name": "Ishmar Halal Traders Expo", "tagline": "East Africa''s trusted platform for business growth"}'::jsonb),
  ('contact_info', '{"phone": "+254700000000", "email": "info@ishmarexpo.com", "whatsapp": "254700000000", "address": "Muindi Mbingu Street, Nairobi, Kenya", "mombasa_phone": "+254700000001", "mombasa_address": "Nyali Road, Mombasa, Kenya"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ----------------------------------------------------------------------------
-- Events — refresh descriptions and add the Mombasa mixer + 48th-edition tag
-- ----------------------------------------------------------------------------
insert into public.events
  (slug, title, category, status, summary, description, start_date, end_date,
   venue_name, venue_address, city, expected_visitors, exhibitor_count, is_featured)
values
  ('ishmar-halal-trade-expo-2027', 'Ishmar Halal Trade Expo 2027', 'trade_fair', 'upcoming',
   'Our flagship exhibition uniting food, cosmetics, finance and tourism exhibitors from across Kenya and the region.',
   'Ishmar''s flagship three-day trade exhibition, bringing together over 350 exhibitors across four halls at KICC, Nairobi.',
   '2027-03-18', '2027-03-20', 'Kenyatta International Convention Centre', 'Harambee Avenue, Nairobi', 'Nairobi',
   12400, 350, true),
  ('sme-business-mixer-mombasa-2027', 'SME Business Mixer, Mombasa', 'networking', 'upcoming',
   'An evening of structured business matchmaking for small and growing coastal businesses.',
   'Structured B2B matchmaking connecting Mombasa''s SMEs, exporters and coastal trade buyers.',
   '2027-07-14', '2027-07-14', 'Nyali Centre', 'Nyali, Mombasa', 'Mombasa', 300, null, false),
  ('ishmar-halal-trade-expo-2026', 'Ishmar Halal Trade Expo 2026', 'trade_fair', 'past',
   'Our 48th successful expo: 324 exhibitors and strong trade activity tracked across three days.',
   'The 48th edition of our flagship exhibition, delivered in Nairobi.',
   '2026-03-19', '2026-03-21', 'Kenyatta International Convention Centre', 'Harambee Avenue, Nairobi', 'Nairobi',
   11800, 324, false)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  venue_name = excluded.venue_name,
  venue_address = excluded.venue_address,
  city = excluded.city;

-- Retire the old un-located networking event in favour of the Mombasa mixer above
delete from public.events where slug = 'sme-halal-business-mixer-2027';
