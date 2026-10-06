-- YEMEMUNNAI — 5 campus eateries showcase (MITS Canteen + 4 new)
-- Safe to run multiple times (idempotent upserts by fixed UUIDs).

INSERT INTO public.vendors (id, name, image_url, is_active, is_online, latitude, longitude, location_landmark, is_on_campus)
VALUES
  -- 1. MITS Canteen already exists (a0000000-0000-4000-8000-000000000001), photo /images/shop_mits_canteen.jpg
  ('a0000000-0000-4000-8000-000000000006', 'MITS Cafe',      '/images/shop_mits_cafe.jpg',      true, true, 13.56102, 78.49781, 'Near Main Block',     true),
  ('a0000000-0000-4000-8000-000000000007', 'Ekdant''s Cafe', '/images/shop_ekdants_cafe.jpg',   true, true, 13.56031, 78.49863, 'Beside Library',      true),
  ('a0000000-0000-4000-8000-000000000008', 'Lickies',        '/images/shop_lickies.jpg',        true, true, 13.55987, 78.49622, 'Opposite GATE Block', true),
  ('a0000000-0000-4000-8000-000000000009', 'MITS Hub',       '/images/shop_new_cafe.jpg',       true, true, 13.56066, 78.49951, 'Near Boys Hostel',    true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active;

-- Keep MITS Canteen active with its photo
UPDATE public.vendors
SET is_active = true,
    image_url = COALESCE(NULLIF(image_url, ''), '/images/shop_mits_canteen.jpg')
WHERE id = 'a0000000-0000-4000-8000-000000000001';

-- Showcase the 5 eateries at the top: park the rest of the roster
UPDATE public.vendors
SET is_active = false
WHERE name IN ('Royal Hotel', 'Royal Corner', 'Chai Corner', 'Vatika Tuck', 'Lays Corner');
