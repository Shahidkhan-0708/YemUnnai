-- Run AFTER importing Paradise (16 dishes) and Mallikarjuna Mess (34 dishes).
-- Use a privileged connection to the intended local/staging database:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test_new_restaurant_access.sql
-- No accounts/policies are created. Every menu write is a disposable fixture.
begin;
set local plpgsql.check_asserts = on;
set local statement_timeout = '30s';
set local lock_timeout = '5s';

do $$
declare
 shop record;
begin
 assert (select relrowsecurity from pg_class where oid = 'public.vendors'::regclass), 'vendors RLS enabled';
 assert (select relrowsecurity from pg_class where oid = 'public.food_items'::regclass), 'food_items RLS enabled';
 for shop in select * from (values
  ('a0000000-0000-4000-8000-000000000011'::uuid, 'Paradise', 16),
  ('a0000000-0000-4000-8000-000000000012'::uuid, 'Mallikarjuna Mess', 34)
 ) as expected(id, name, menu_count) loop
  assert exists(select 1 from public.vendors v join auth.users u on u.id = v.owner_id
   where v.id = shop.id and v.name = shop.name and not coalesce(u.is_anonymous, false)),
   'existing permanent owner required: ' || shop.name;
  assert (select count(*) from public.food_items where vendor_id = shop.id) = shop.menu_count,
   'imported menu count: ' || shop.name;
 end loop;
 assert (select count(distinct owner_id) from public.vendors where id in
  ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000012')) = 2,
  'restaurants must have separate owners';
end $$;

set local role authenticated;
do $$
declare
 shop record;
 other_shop uuid;
 other_item uuid;
 fixture uuid;
begin
 assert current_user = 'authenticated', 'test runs without privileged RLS bypass';
 assert (select not rolbypassrls and not rolsuper from pg_roles where rolname = current_user),
  'authenticated role cannot bypass RLS';
 assert (select count(*) from public.vendors where id in
  ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000012')) = 2,
  'both restaurant rows visible to authenticated role';
 for shop in select id, name, owner_id from public.vendors where id in
  ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000012') order by id loop
  select id into strict other_shop from public.vendors where id in
   ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000012') and id <> shop.id;
  select id into strict other_item from public.food_items where vendor_id = other_shop order by id limit 1;
  perform set_config('request.jwt.claims', jsonb_build_object(
   'sub', shop.owner_id, 'role', 'authenticated', 'is_anonymous', false)::text, true);
  assert auth.uid() = shop.owner_id, 'JWT owner: ' || shop.name;

  update public.vendors set is_online = is_online where id = shop.id and owner_id = auth.uid();
  assert found, 'own vendor update: ' || shop.name;
  update public.vendors set is_online = is_online where id = other_shop;
  assert not found, 'cross-vendor update blocked: ' || shop.name;

  fixture := gen_random_uuid();
  insert into public.food_items(id, vendor_id, name, price, category, action_type, in_stock)
   values (fixture, shop.id, 'Access test ' || fixture, 10, 'cooked', 'order', true);
  assert exists(select 1 from public.food_items where id = fixture and vendor_id = shop.id),
   'own menu create/read: ' || shop.name;
  update public.food_items set name = 'Edited access test ' || fixture, price = 25,
   category = 'packed', action_type = 'walkin', image_url = '/access-test.jpg', is_vegetarian = true
   where id = fixture and vendor_id = shop.id;
  assert found, 'own menu edit: ' || shop.name;
  assert exists(select 1 from public.food_items where id = fixture and
   name = 'Edited access test ' || fixture and price = 25 and category = 'packed' and
   action_type = 'walkin' and image_url = '/access-test.jpg' and is_vegetarian),
   'edited fields persist: ' || shop.name;
  update public.food_items set in_stock = false, remaining_quantity = null where id = fixture;
  assert found, 'own stock off: ' || shop.name;
  assert exists(select 1 from public.food_items where id = fixture and not in_stock and remaining_quantity is null),
   'stock off persists: ' || shop.name;
  update public.food_items set in_stock = true where id = fixture;
  assert found, 'own stock on: ' || shop.name;
  assert exists(select 1 from public.food_items where id = fixture and in_stock), 'stock on persists: ' || shop.name;

  begin
   insert into public.food_items(vendor_id, name, price, category, action_type)
    values (other_shop, 'Forbidden access test ' || fixture, 10, 'cooked', 'order');
   assert false, 'cross-vendor insert must fail: ' || shop.name;
  exception when insufficient_privilege then null;
  end;
  update public.food_items set name = 'Forbidden edit ' || fixture, price = 1 where id = other_item;
  assert not found, 'cross-vendor menu edit blocked: ' || shop.name;
  update public.food_items set in_stock = not in_stock where id = other_item;
  assert not found, 'cross-vendor stock update blocked: ' || shop.name;
  delete from public.food_items where id = other_item;
  assert not found, 'cross-vendor delete blocked: ' || shop.name;
  begin
   update public.food_items set vendor_id = other_shop where id = fixture;
   assert false, 'own dish cannot transfer to another vendor: ' || shop.name;
  exception when insufficient_privilege then null;
  end;

  delete from public.food_items where id = fixture and vendor_id = shop.id;
  assert found, 'own menu delete: ' || shop.name;
  assert not exists(select 1 from public.food_items where id = fixture), 'deleted fixture absent: ' || shop.name;
  raise notice 'Restaurant access checks passed: %', shop.name;
 end loop;
end $$;
reset role;
rollback;
select 'new_restaurant_access_passed_all_writes_rolled_back' as result;
