-- ============================================================================
-- YEMEMUNNAI — Backend schema (Supabase / Postgres)
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent): IF NOT EXISTS / drop-if-exists guards everywhere.
-- ============================================================================

-- Extensions needed for crypt()/gen_salt() in the demo-vendor seed below.
create extension if not exists pgcrypto with schema extensions;

-- ============================================================ 1. TABLES =====

-- Campus food vendors / shops (consumer "Local Shops" row + business portal)
create table if not exists public.vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  image_url   text,
  is_active   boolean not null default false,  -- green ring on consumer home
  is_online   boolean not null default false,  -- Business portal ONLINE/OFFLINE toggle
  owner_id    uuid references auth.users (id) on delete set null, -- vendor login owner
  created_at  timestamptz not null default now()
);

-- Menu items shown on the consumer discovery grid
create table if not exists public.food_items (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors (id) on delete cascade,
  name           text not null,
  price          integer not null check (price >= 0),              -- whole rupees
  category       text not null check (category in ('cooked','packed')),
  action_type    text not null check (action_type in ('walkin','order')),
  image_url      text,
  in_stock       boolean not null default true,                    -- LIVE / SOLD OUT
  likes_count    integer not null default 0,                       -- maintained by trigger
  dislikes_count integer not null default 0,                       -- maintained by trigger
  reviews_count  integer not null default 0,                       -- maintained by trigger
  created_at     timestamptz not null default now(),
  constraint food_items_vendor_name_key unique (vendor_id, name)
);
create index if not exists food_items_vendor_idx on public.food_items (vendor_id);

-- One like/dislike per (item, visitor). user_key = "anon:<random>" from
-- localStorage (consumers are account-less by design).
create table if not exists public.reactions (
  id           uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items (id) on delete cascade,
  user_key     text not null,
  value        text not null check (value in ('like','dislike')),
  created_at   timestamptz not null default now(),
  constraint reactions_one_per_user_key unique (food_item_id, user_key)
);
create index if not exists reactions_item_idx on public.reactions (food_item_id);
create index if not exists reactions_user_key_idx on public.reactions (user_key);

-- Star reviews written from the feedback popup
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items (id) on delete cascade,
  user_key     text not null,
  rating       integer not null check (rating between 1 and 5),
  is_liked     boolean not null default true,
  comment      text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists reviews_item_idx on public.reviews (food_item_id);

-- "No account needed" quick orders; snapshots item name/price at order time
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors (id) on delete cascade,
  food_item_id     uuid references public.food_items (id) on delete set null,
  item_name        text not null,
  unit_price       integer not null check (unit_price >= 0),
  customer_mobile  text not null,
  delivery_address text not null,
  status           text not null default 'pending'
                     check (status in ('pending','accepted','declined','completed')),
  created_at       timestamptz not null default now()
);
create index if not exists orders_vendor_created_idx
  on public.orders (vendor_id, created_at desc);

-- ========================================================= 2. TRIGGERS ======
-- Counters live on food_items so the consumer grid needs no joins.
-- SECURITY DEFINER is required: anonymous visitors trigger these updates but
-- have no UPDATE grant on food_items. Direct RPC calls are revoked below.

create or replace function public.handle_reaction_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.food_items
       set likes_count    = likes_count    + (new.value = 'like')::int,
           dislikes_count = dislikes_count + (new.value = 'dislike')::int
     where id = new.food_item_id;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.value is distinct from new.value then
      update public.food_items
         set likes_count    = likes_count    + (new.value = 'like')::int
                                                     - (old.value = 'like')::int,
             dislikes_count = dislikes_count + (new.value = 'dislike')::int
                                                     - (old.value = 'dislike')::int
       where id = new.food_item_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.food_items
       set likes_count    = likes_count    - (old.value = 'like')::int,
           dislikes_count = dislikes_count - (old.value = 'dislike')::int
     where id = old.food_item_id;
    return old;
  end if;
  return null;
end;
$$;

revoke execute on function public.handle_reaction_change() from public, anon, authenticated;

drop trigger if exists reactions_counter on public.reactions;
create trigger reactions_counter
after insert or update or delete on public.reactions
for each row execute function public.handle_reaction_change();

create or replace function public.handle_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.food_items
       set reviews_count = reviews_count + 1
     where id = new.food_item_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.food_items
       set reviews_count = greatest(0, reviews_count - 1)
     where id = old.food_item_id;
    return old;
  end if;
  return null;
end;
$$;

revoke execute on function public.handle_review_change() from public, anon, authenticated;

drop trigger if exists reviews_counter on public.reviews;
create trigger reviews_counter
after insert or delete on public.reviews
for each row execute function public.handle_review_change();

-- ============================================================ 3. RLS ========
-- Tables in `public` are exposed through the Data API, so RLS everywhere.

alter table public.vendors    enable row level security;
alter table public.food_items enable row level security;
alter table public.reactions  enable row level security;
alter table public.reviews    enable row level security;
alter table public.orders     enable row level security;

-- --- vendors ----------------------------------------------------------------
drop policy if exists "vendors_public_read" on public.vendors;
create policy "vendors_public_read" on public.vendors
  for select using (true);

drop policy if exists "vendors_owner_insert" on public.vendors;
create policy "vendors_owner_insert" on public.vendors
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "vendors_owner_update" on public.vendors;
create policy "vendors_owner_update" on public.vendors
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- --- food_items -------------------------------------------------------------
drop policy if exists "food_items_public_read" on public.food_items;
create policy "food_items_public_read" on public.food_items
  for select using (true);

drop policy if exists "food_items_owner_insert" on public.food_items;
create policy "food_items_owner_insert" on public.food_items
  for insert to authenticated
  with check (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  ));

drop policy if exists "food_items_owner_update" on public.food_items;
create policy "food_items_owner_update" on public.food_items
  for update to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  ));

drop policy if exists "food_items_owner_delete" on public.food_items;
create policy "food_items_owner_delete" on public.food_items
  for delete to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  ));

-- --- reactions (account-less consumers; keys are client-generated "anon:*") --
drop policy if exists "reactions_public_read" on public.reactions;
create policy "reactions_public_read" on public.reactions
  for select using (true);

drop policy if exists "reactions_anon_insert" on public.reactions;
create policy "reactions_anon_insert" on public.reactions
  for insert to anon, authenticated
  with check (user_key like 'anon:%');

drop policy if exists "reactions_anon_update" on public.reactions;
create policy "reactions_anon_update" on public.reactions
  for update to anon, authenticated
  using (user_key like 'anon:%')
  with check (user_key like 'anon:%');

drop policy if exists "reactions_anon_delete" on public.reactions;
create policy "reactions_anon_delete" on public.reactions
  for delete to anon, authenticated
  using (user_key like 'anon:%');

-- --- reviews ----------------------------------------------------------------
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (true);

drop policy if exists "reviews_anyone_insert" on public.reviews;
create policy "reviews_anyone_insert" on public.reviews
  for insert to anon, authenticated
  with check (true);

-- --- orders -----------------------------------------------------------------
-- Consumers INSERT only (no read-back needed; the UI confirms locally).
-- Vendors read/update only the orders belonging to their own shop.
drop policy if exists "orders_anyone_insert" on public.orders;
create policy "orders_anyone_insert" on public.orders
  for insert to anon, authenticated
  with check (true);

drop policy if exists "orders_vendor_read" on public.orders;
create policy "orders_vendor_read" on public.orders
  for select to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = orders.vendor_id and v.owner_id = (select auth.uid())
  ));

drop policy if exists "orders_vendor_update" on public.orders;
create policy "orders_vendor_update" on public.orders
  for update to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = orders.vendor_id and v.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.vendors v
    where v.id = orders.vendor_id and v.owner_id = (select auth.uid())
  ));

-- ------------------------------------------------ 3.5 Explicit grants ------
-- Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Policies decide WHICH rows; grants decide WHETHER an operation can run at all.
-- Revoke the default all-privilege grants, then grant only what each role needs.

revoke all on public.vendors    from anon, authenticated;
revoke all on public.food_items from anon, authenticated;
revoke all on public.reactions  from anon, authenticated;
revoke all on public.reviews    from anon, authenticated;
revoke all on public.orders     from anon, authenticated;

-- vendors: public catalog read; owners insert/update their shop (RLS-scoped)
grant select on public.vendors to anon, authenticated;
grant insert, update on public.vendors to authenticated;

-- food_items: public menu read; vendors manage their own items (RLS-scoped)
grant select on public.food_items to anon, authenticated;
grant insert, update, delete on public.food_items to authenticated;

-- reactions: account-less visitors toggle their own rows (RLS-scoped by user_key)
grant select, insert, update, delete on public.reactions to anon, authenticated;

-- reviews: anyone can read/write; no update/delete path for consumers
grant select, insert on public.reviews to anon, authenticated;

-- orders: consumers INSERT only (no read-back); vendors read + update status
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

-- ======================================================== 4. REALTIME =======
-- Live order feed on the business dashboard + live menu/stock for consumers.

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;  -- already added
  when undefined_object then null;  -- no realtime publication (self-hosted)
end $$;

do $$
begin
  alter publication supabase_realtime add table public.food_items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ========================================================= 5. STORAGE =======
-- Public bucket for food photos; vendors may write only inside their own
-- "<user-id>/" folder.

insert into storage.buckets (id, name, public)
values ('food-photos', 'food-photos', true)
on conflict (id) do nothing;

drop policy if exists "food_photos_public_read" on storage.objects;
create policy "food_photos_public_read" on storage.objects
  for select using (bucket_id = 'food-photos');

drop policy if exists "food_photos_owner_insert" on storage.objects;
create policy "food_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "food_photos_owner_update" on storage.objects;
create policy "food_photos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================ 6. SEED =======
-- Vendor accounts are provisioned through setup_vendor_auth.mjs after the PIN migration.

-- Shops matching the current UI (images ↔ names mirror src/lib/mockData.ts)
insert into public.vendors (id, name, image_url, is_active, is_online) values
  ('a0000000-0000-4000-8000-000000000001', 'MITS Canteen', '/images/shop_mits_canteen.jpg', true, true),
  ('a0000000-0000-4000-8000-000000000006', 'MITS Cafe',    '/images/shop_mits_cafe.jpg',    true, true),
  ('a0000000-0000-4000-8000-000000000007', 'Ekdant''s Cafe', '/images/shop_ekdants_cafe.jpg', true, true),
  ('a0000000-0000-4000-8000-000000000008', 'Lickies',      '/images/shop_lickies.jpg',      true, true),
  ('a0000000-0000-4000-8000-000000000009', 'MITS Hub',     '/images/shop_new_cafe.jpg',     true, true)
on conflict (name) do nothing;

-- Keep the extra legacy vendors (not shown on the home grid; is_active = false)
insert into public.vendors (id, name, image_url, is_active, is_online) values
  ('a0000000-0000-4000-8000-000000000002', 'Royal Hotel',  '/images/shop_royal.jpg',  false, false),
  ('a0000000-0000-4000-8000-000000000003', 'Chai Corner',  '/images/shop_chai.jpg',   false, false),
  ('a0000000-0000-4000-8000-000000000004', 'Vatika',       '/images/shop_yat.jpg',    false, false),
  ('a0000000-0000-4000-8000-000000000005', 'Lays Corner',  '/images/lays_packet.jpg', false, false)
on conflict (name) do nothing;

-- Menu items matching the current mock data + supabase/seed_menus.mjs
-- (names ↔ prices ↔ photos must stay in sync across all three sources)
insert into public.food_items
  (id, vendor_id, name, price, category, action_type, image_url, in_stock,
   likes_count, dislikes_count, reviews_count)
values
  -- MITS Canteen: Tea ₹10 · Coffee ₹10 · Samosa ₹15
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Tea',    10, 'cooked', 'walkin', '/images/item_tea.jpg',            true, 64, 4, 21),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Coffee', 10, 'cooked', 'walkin', '/images/item_coffee.jpg',         true, 71, 3, 25),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Samosa', 15, 'cooked', 'order',  '/images/item_samosa_chicken.jpg', true, 88, 2, 34),
  -- MITS Cafe: Tea ₹15 · Coffee ₹20 · Black coffee ₹30 · Sonti coffee ₹30 · Milk ₹15 · Batanees ₹20
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000006', 'Tea',          15, 'cooked', 'walkin', '/images/item_tea.jpg',          true, 52, 3, 18),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000006', 'Coffee',       20, 'cooked', 'walkin', '/images/item_coffee.jpg',       true, 60, 2, 22),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000006', 'Black Coffee', 30, 'cooked', 'walkin', '/images/item_black_coffee.jpg', true, 34, 1, 11),
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000006', 'Sonti Coffee', 30, 'cooked', 'walkin', '/images/item_sonti_coffee.jpg', true, 41, 1, 14),
  ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000006', 'Milk',         15, 'cooked', 'walkin', '/images/item_milk.jpg',         true, 29, 2,  9),
  ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000006', 'Batanees',     20, 'packed', 'order',  '/images/item_batanees.jpg',     true, 55, 3, 19),
  -- Ekdant's Cafe: Tea ₹10 · Coffee ₹10 · Samosa ₹15 · Mirchi bajji 3 for ₹20
  ('b0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000007', 'Tea',    10, 'cooked', 'walkin', '/images/item_tea.jpg',         true, 47, 2, 15),
  ('b0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000007', 'Coffee', 10, 'cooked', 'walkin', '/images/item_coffee.jpg',      true, 51, 3, 17),
  ('b0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000007', 'Samosa', 15, 'cooked', 'order',  '/images/item_samosa_corn.jpg', true, 66, 2, 23),
  ('b0000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000007', 'Mirchi Bajji (3 pcs)', 20, 'cooked', 'walkin', '/images/item_mirchi_bajji.jpg', true, 73, 4, 27),
  -- Lickies: Tea ₹10 · Coffee ₹10 · Samosa ₹15 · Popsicles from ₹10
  ('b0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000008', 'Tea',      10, 'cooked', 'walkin', '/images/item_tea.jpg',           true, 39, 2, 12),
  ('b0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000008', 'Coffee',   10, 'cooked', 'walkin', '/images/item_coffee.jpg',        true, 44, 2, 14),
  ('b0000000-0000-4000-8000-000000000033', 'a0000000-0000-4000-8000-000000000008', 'Samosa',   15, 'cooked', 'order',  '/images/item_samosa_chicken.jpg', true, 58, 3, 20),
  ('b0000000-0000-4000-8000-000000000034', 'a0000000-0000-4000-8000-000000000008', 'Popsicle', 10, 'packed', 'walkin', '/images/item_popsicle.svg',      true, 82, 3, 31),
  -- MITS Hub: Tea ₹10 · Coffee ₹10 · Samosa ₹15
  ('b0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000009', 'Tea',    10, 'cooked', 'walkin', '/images/item_tea.jpg',            true, 36, 2, 11),
  ('b0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000009', 'Coffee', 10, 'cooked', 'walkin', '/images/item_coffee.jpg',         true, 40, 2, 13),
  ('b0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000009', 'Samosa', 15, 'cooked', 'order',  '/images/item_samosa_chicken.jpg', true, 54, 3, 18)
on conflict (vendor_id, name) do nothing;

-- Retire the old demo rows (Biryani/Lays placeholders with wrong prices/photos)
delete from public.food_items
 where name in ('Biryani', 'Lays', 'QA Paneer Roll');

-- ============================================================================
-- Done. Next steps:
--   1. Project Settings → API → copy "Project URL" and "anon public" key
--   2. Put them in .env.local as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
--   3. npm run dev
-- ============================================================================
