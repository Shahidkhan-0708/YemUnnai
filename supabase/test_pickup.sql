-- Run against a local/staging Supabase database AFTER the migration. All fixtures roll back.
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test_pickup.sql
begin;
insert into auth.users(id) values
 ('10000000-0000-4000-8000-000000000001'), ('10000000-0000-4000-8000-000000000002'),
 ('10000000-0000-4000-8000-000000000003'), ('10000000-0000-4000-8000-000000000004'),
 ('10000000-0000-4000-8000-000000000005');
insert into public.app_admins(user_id) values ('10000000-0000-4000-8000-000000000005');
insert into public.vendors(id,name,is_active,is_online,owner_id,location_landmark) values
 ('20000000-0000-4000-8000-000000000001','Pickup integration shop A',true,true,'10000000-0000-4000-8000-000000000003','Counter A'),
 ('20000000-0000-4000-8000-000000000002','Pickup integration shop B',true,true,'10000000-0000-4000-8000-000000000004','Counter B');
insert into public.food_items(id,vendor_id,name,price,category,action_type,in_stock,remaining_quantity) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Test samosa',15,'cooked','order',true,3);
set local role service_role;
do $$
declare
 a uuid := '10000000-0000-4000-8000-000000000001'; b uuid := '10000000-0000-4000-8000-000000000002';
 vendor uuid := '10000000-0000-4000-8000-000000000003'; other_vendor uuid := '10000000-0000-4000-8000-000000000004';
 f uuid := '30000000-0000-4000-8000-000000000001'; attempt uuid := '40000000-0000-4000-8000-000000000001';
 admin_actor uuid := '10000000-0000-4000-8000-000000000005';
 payload jsonb; response jsonb; first_order uuid; second_order uuid; stock integer; request_id uuid;
begin
 payload := jsonb_build_object('itemId',f,'attemptId',attempt,'quantity',2,'expectedPrice',14);
 response := public.checkout_pickup(a,payload);
 assert response->>'error' = 'price_changed', 'price confirmation';
 update public.vendors set is_active = false where id = '20000000-0000-4000-8000-000000000001';
 assert public.checkout_pickup(a,payload)->>'error' = 'shop_offline', 'inactive checkout';
 update public.vendors set is_active = true where id = '20000000-0000-4000-8000-000000000001';
 update public.vendors set is_online = false where id = '20000000-0000-4000-8000-000000000001';
 response := public.checkout_pickup(a,payload || '{"expectedPrice":15}');
 assert response->>'error' = 'shop_offline', 'offline checkout';
 update public.vendors set is_online = true where id = '20000000-0000-4000-8000-000000000001';
 payload := payload || '{"expectedPrice":15}';
 response := public.checkout_pickup(a,payload);
 assert response->'order'->>'total' = '30', 'authoritative total';
 assert response->'order'->>'unit_price' = '15', 'unit price separate from total';
 assert response->'order'->>'quantity' = '2', 'stored quantity';
 first_order := (response->'order'->>'id')::uuid;
 assert jsonb_array_length(public.pickup_action(a,'list','{}')->'orders') = 1, 'buyer order listing';
 assert jsonb_array_length(public.pickup_action(a,'recover',jsonb_build_object('attemptId',attempt))->'orders') = 1, 'attempt recovery';
 assert jsonb_array_length(public.pickup_action(vendor,'vendor_list',jsonb_build_object('vendorId','20000000-0000-4000-8000-000000000001'))->'orders') = 1, 'vendor order listing';
 response := public.checkout_pickup(a,payload || '{"quantity":1,"expectedPrice":999}');
 assert (response->'order'->>'id')::uuid = first_order, 'duplicate recovery returns original';
 select remaining_quantity into stock from public.food_items where id = f;
 assert stock = 3, 'duplicate keeps seller-managed stock unchanged';
 update public.food_items set in_stock = false where id = f;
 response := public.checkout_pickup(b,payload || jsonb_build_object('attemptId',gen_random_uuid()));
 assert response->>'error' = 'item_unavailable', 'seller stock off prevents checkout';
 update public.food_items set in_stock = true where id = f;
 response := public.checkout_pickup(b,payload || jsonb_build_object('attemptId',gen_random_uuid(),'quantity',1));
 second_order := (response->'order'->>'id')::uuid;
 assert second_order is not null, 'seller stock on allows checkout';
 assert response->'order'->>'pickup_number' = '2', 'daily server sequence';
 select remaining_quantity into stock from public.food_items where id = f;
 assert stock = 3, 'checkout does not decrement obsolete quantities';
 response := public.pickup_action(b,'detail',jsonb_build_object('orderId',first_order));
 assert jsonb_array_length(response->'orders') = 0, 'cross buyer detail blocked';
 response := public.pickup_action(other_vendor,'transition',jsonb_build_object('orderId',first_order,'status','declined'));
 assert response->>'error' = 'not_found', 'cross shop mutation blocked';
 response := public.pickup_action(a,'transition',jsonb_build_object('orderId',first_order,'status','ready'));
 assert response->>'error' = 'not_allowed', 'buyer cannot change lifecycle';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','collected','paymentMethod','cash'));
 assert response->>'error' = 'invalid_transition', 'cannot collect pending';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','preparing','preparationMinutes',10));
 assert response->'order'->>'status' = 'preparing', 'acceptance';
 response := public.pickup_action(a,'cancel',jsonb_build_object('orderId',first_order));
 assert (response->'order'->>'cancellation_requested')::boolean, 'accepted cancellation requires approval';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','ready'));
 assert response->'order'->>'status' = 'ready', 'ready separated from collection';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','collected','paymentMethod','cash'));
 assert response->>'error' = 'payment_required', 'cannot collect while cancellation outstanding';
 response := public.pickup_action(vendor,'cancellation_decision',jsonb_build_object('orderId',first_order,'decision','reject'));
 assert response->'order'->>'cancellation_result' = 'rejected', 'request rejected';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','collected'));
 assert response->>'error' = 'payment_required', 'payment confirmation required';
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',first_order,'status','collected','paymentMethod','counter_upi'));
 assert response->'order'->>'status' = 'collected', 'collected with payment';
 assert response->'order'->>'payment_confirmed_at' is not null, 'payment timestamp';
 response := public.pickup_action(a,'cancel',jsonb_build_object('orderId',first_order));
 assert response->>'error' = 'invalid_transition', 'collected cannot cancel';
 response := public.pickup_action(a,'support',jsonb_build_object('orderId',first_order,'message','Issue after collection'));
 request_id := (response->'request'->>'id')::uuid;
 assert request_id is not null, 'help after collection';
 assert jsonb_array_length(public.pickup_action(a,'support_list','{}')->'requests') = 1, 'buyer support listing';
 assert jsonb_array_length(public.pickup_action(vendor,'support_list','{}')->'requests') = 1, 'vendor support listing';
 assert jsonb_array_length(public.pickup_action(other_vendor,'support_list','{}')->'requests') = 0, 'cross shop support listing';
 response := public.pickup_action(admin_actor,'support_resolve',jsonb_build_object('supportId',request_id,'response','App reply'));
 assert response->>'error' = 'not_allowed', 'admin must wait for shop-first escalation';
 response := public.pickup_action(b,'support_escalate',jsonb_build_object('supportId',request_id));
 assert response->>'error' = 'not_allowed', 'cross buyer escalation blocked';
 response := public.pickup_action(a,'support_escalate',jsonb_build_object('supportId',request_id));
 assert (response->>'success')::boolean, 'shop first escalation';
 response := public.pickup_action(other_vendor,'support_resolve',jsonb_build_object('supportId',request_id,'response','Wrong shop'));
 assert response->>'error' = 'not_allowed', 'cross shop support reply blocked';
 response := public.pickup_action(admin_actor,'support_resolve',jsonb_build_object('supportId',request_id,'response','App reply'));
 assert (response->>'success')::boolean, 'authorized admin resolves escalation';
 response := public.pickup_action(b,'cancel',jsonb_build_object('orderId',second_order));
 assert response->'order'->>'status' = 'cancelled', 'pending cancellation';
 perform public.pickup_action(b,'cancel',jsonb_build_object('orderId',second_order));
 select remaining_quantity into stock from public.food_items where id = f;
 assert stock = 3, 'cancellation leaves manual stock unchanged';
 response := public.checkout_pickup(a,payload || jsonb_build_object('attemptId',gen_random_uuid(),'quantity',1));
 second_order := (response->'order'->>'id')::uuid;
 update public.orders set expires_at = clock_timestamp() - interval '1 second' where id = second_order;
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',second_order,'status','preparing'));
 assert response->'order'->>'status' = 'cancelled', 'timeout beats late acceptance';
 assert response->'order'->>'outcome_reason' = 'acceptance_timeout', 'clear expiry reason';
 select remaining_quantity into stock from public.food_items where id = f;
 assert stock = 3, 'expiry leaves manual stock unchanged';
 assert (select count(*) from public.orders where buyer_id = a and attempt_id = attempt) = 1, 'one order per attempt';
 update public.food_items set action_type = 'walkin' where id = f;
 assert public.checkout_pickup(a,payload || jsonb_build_object('attemptId',gen_random_uuid(),'quantity',1))->>'error' = 'item_unavailable', 'walk-in cannot checkout';
 update public.food_items set action_type = 'order', in_stock = false where id = f;
 assert public.checkout_pickup(a,payload || jsonb_build_object('attemptId',gen_random_uuid(),'quantity',1))->>'error' = 'item_unavailable', 'sold-out cannot checkout';
 update public.food_items set in_stock = true where id = f;
 update public.pickup_counters set last_number = 999 where vendor_id = '20000000-0000-4000-8000-000000000001';
 response := public.checkout_pickup(a,payload || jsonb_build_object('attemptId',gen_random_uuid(),'quantity',1));
 assert response->'order'->>'pickup_number' = '1000', 'four-digit pickup number';
 assert (response->'order'->>'operating_date')::date = (clock_timestamp() at time zone 'Asia/Kolkata')::date, 'operating date';
 second_order := (response->'order'->>'id')::uuid;
 perform public.pickup_action(vendor,'transition',jsonb_build_object('orderId',second_order,'status','declined'));
 perform public.pickup_action(vendor,'transition',jsonb_build_object('orderId',second_order,'status','declined'));
 select remaining_quantity into stock from public.food_items where id = f;
 assert stock = 3, 'decline leaves manual stock unchanged';
 insert into public.orders(vendor_id, food_item_id, item_name, unit_price, total, customer_mobile, status, is_legacy)
 values ('20000000-0000-4000-8000-000000000001', f, 'Legacy total snapshot', 45, 45, 'unverified legacy phone', 'completed', true)
 returning id into second_order;
 response := public.pickup_action(vendor,'transition',jsonb_build_object('orderId',second_order,'status','collected','paymentMethod','cash'));
 assert response->>'error' = 'legacy_order', 'ambiguous historical completion is read-only';
 assert (select status = 'completed' and unit_price = 45 and total = 45 and quantity is null and buyer_id is null from public.orders where id = second_order), 'historical totals and identity preserved';
 assert jsonb_array_length(public.pickup_action(a,'detail',jsonb_build_object('orderId',second_order))->'orders') = 0, 'legacy phone cannot claim buyer ownership';
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":true}',true);
do $$
begin
 assert not exists(select 1 from public.orders where buyer_id = '10000000-0000-4000-8000-000000000001'), 'RLS buyer ownership';
 assert exists(select 1 from public.orders where buyer_id = '10000000-0000-4000-8000-000000000002'), 'RLS own order visible';
 assert not has_table_privilege('authenticated','public.orders','INSERT'), 'no direct creation';
 assert not has_table_privilege('authenticated','public.orders','UPDATE'), 'no direct status updates';
 assert not has_function_privilege('authenticated','public.checkout_pickup(uuid,jsonb)','EXECUTE'), 'no actor spoofing RPC';
 assert not has_function_privilege('anon','public.pickup_action(uuid,text,jsonb)','EXECUTE'), 'no anonymous lifecycle RPC';
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}',true);
insert into public.saved_items(buyer_id,food_item_id) values ('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 assert not exists(select 1 from public.saved_items), 'cross buyer Saved read blocked';
 begin
   insert into public.saved_items(buyer_id,food_item_id) values ('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
   assert false, 'cross buyer Saved insertion must fail';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $$ begin
 assert not exists(select 1 from public.orders where vendor_id = '20000000-0000-4000-8000-000000000001'), 'RLS cross shop blocked';
end $$;
-- Exercise the seller portal writes under real authenticated ownership policies.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 update public.food_items set is_vegetarian = true, in_stock = false, remaining_quantity = null
  where id = '30000000-0000-4000-8000-000000000001';
 assert found, 'seller can save dietary information and stock';
 update public.vendors set latitude = 13.6298, longitude = 78.4786,
  location_landmark = 'QA counter', is_on_campus = true where id = '20000000-0000-4000-8000-000000000001';
 assert found, 'seller can save own map pin';
 assert (select is_vegetarian and not in_stock and remaining_quantity is null from public.food_items where id = '30000000-0000-4000-8000-000000000001'), 'seller writes reflect on catalog';
 insert into public.food_items(id,vendor_id,name,price,category,action_type,in_stock)
  values ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Delete fixture',15,'cooked','order',true);
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 update public.food_items set is_vegetarian = false where id = '30000000-0000-4000-8000-000000000001';
 assert not found, 'other seller cannot change dietary information';
 update public.vendors set latitude = 0 where id = '20000000-0000-4000-8000-000000000001';
 assert not found, 'other seller cannot move map pin';
 delete from public.food_items where id = '30000000-0000-4000-8000-000000000002';
 assert not found, 'other seller cannot delete item';
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 delete from public.food_items where id = '30000000-0000-4000-8000-000000000002';
 assert found, 'own seller can delete item';
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":true}',true);
do $$ begin
 begin
  insert into public.vendors(id,name,owner_id) values ('20000000-0000-4000-8000-000000000003','Guest cannot create shop','10000000-0000-4000-8000-000000000002');
  assert false, 'anonymous buyer cannot create business';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;
select 'pickup_integration_passed_all_fixtures_rolled_back' as result;
