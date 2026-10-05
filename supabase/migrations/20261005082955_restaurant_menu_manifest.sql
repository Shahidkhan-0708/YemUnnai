-- Preserve the source menu independently of the app's cooked/packed tabs.
alter table public.food_items alter column price drop not null;
alter table public.food_items add column if not exists source_item_id text;
alter table public.food_items add column if not exists source_hotel_code text;
alter table public.food_items add column if not exists menu_category text;
alter table public.food_items add column if not exists food_type text;
alter table public.food_items add column if not exists description text;
alter table public.food_items add column if not exists details text;
alter table public.food_items add column if not exists price_display text;
alter table public.food_items add column if not exists price_variants jsonb not null default '[]'::jsonb check (jsonb_typeof(price_variants) = 'array');
alter table public.food_items add column if not exists source_image_file text;
alter table public.food_items add column if not exists menu_position integer;
create unique index if not exists food_items_vendor_source_id_idx on public.food_items(vendor_id,source_item_id) where source_item_id is not null;
