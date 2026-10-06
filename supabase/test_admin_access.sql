-- Run inside a transaction and ROLLBACK; fixtures never persist.
do $$
declare actor uuid; other uuid; owner uuid:=gen_random_uuid(); v uuid; f uuid; event uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); result jsonb; input jsonb;
begin
  select owner_id into actor from public.vendors where id='a0000000-0000-4000-8000-000000000001';
  assert actor is not null,'Existing permanent seller needed for rolled-back test';
  other:=gen_random_uuid();
  assert public.admin_action(other,'snapshot','{}')->>'error'='forbidden','Unapproved account denied';
  assert not has_function_privilege('authenticated','public.admin_action(uuid,text,jsonb)','EXECUTE'),'Cannot invoke privileged RPC from browser';
  assert not has_function_privilege('anon','public.record_portal_event(uuid,jsonb)','EXECUTE'),'No unauthenticated telemetry writes';
  assert not has_table_privilege('authenticated','public.portal_events','SELECT'),'Error reports private';
  assert not has_column_privilege('authenticated','public.vendors','is_active','UPDATE'),'Seller cannot reactivate deleted business';
  assert not has_column_privilege('authenticated','public.vendors','name','UPDATE'),'Only admin can rename businesses';
  assert has_column_privilege('authenticated','public.vendors','is_online','UPDATE'),'Seller online toggle preserved';
  insert into public.app_admins(user_id) values(actor) on conflict do nothing;
  insert into auth.users(id,email,is_anonymous,aud,role,created_at,updated_at) values(owner,'fixture-'||owner||'@example.invalid',false,'authenticated','authenticated',now(),now());
  input:=jsonb_build_object('vendor',jsonb_build_object('name','Admin fixture '||gen_random_uuid(),'image_url','/images/NewLogo.svg','is_active',true,'is_online',false,'latitude',null,'longitude',null,'location_landmark','Test only'),'ownerId',owner,'pin','0412');
  result:=public.admin_action(actor,'vendor_save',input);assert not result ? 'error',result::text;v:=(result->'vendor'->>'id')::uuid;
  assert exists(select 1 from private.vendor_pins where outlet_id=v and user_id=owner),'New business has seller credentials';
  input:=jsonb_build_object('food',jsonb_build_object('vendor_id',v,'name','Fixture food','price',null,'category','cooked','image_url','/images/NewLogo.svg','in_stock',true,'is_vegetarian',true,'menu_category','Pizza','description','Original details','price_variants',jsonb_build_array(jsonb_build_object('name','Medium','price',130,'currency','INR'))));
  result:=public.admin_action(actor,'food_save',input);assert not result ? 'error',result::text;f:=(result->'food'->>'id')::uuid;
  assert exists(select 1 from public.food_items where id=f and price is null and vendor_id=v and price_variants->0->>'price'='130'),'Prices and ownership preserved';
  input:=jsonb_set(input,'{food,id}',to_jsonb(f::text));input:=jsonb_set(input,'{food,name}','"Edited food"');input:=jsonb_set(input,'{food,is_vegetarian}','false');input:=jsonb_set(input,'{food,in_stock}','false');
  result:=public.admin_action(actor,'food_save',input);assert not result ? 'error',result::text;
  assert exists(select 1 from public.food_items where id=f and name='Edited food' and not is_vegetarian and not in_stock),'Edit name/diet/stock';
  input:=jsonb_set(input,'{food,vendor_id}',to_jsonb('a0000000-0000-4000-8000-000000000001'::text));
  assert public.admin_action(actor,'food_save',input)->>'error'='not_found','Existing dish cannot change restaurant';
  result:=public.record_portal_event(actor,jsonb_build_object('eventId',event,'sessionId',sid,'kind','error','vendorId',v,'source','test','message','Fixture error','route','/'));
  assert result->>'success'='true',result::text;
  perform public.record_portal_event(actor,jsonb_build_object('eventId',event,'sessionId',sid,'kind','error','vendorId',v));
  assert(select count(*)=1 from public.portal_events where id=event),'Retries do not double count';
  assert public.admin_action(actor,'error_resolve',jsonb_build_object('errorId',event,'resolved',true))->>'success'='true';
  assert exists(select 1 from public.portal_events where id=event and resolved_at is not null),'Resolve error';
  assert public.admin_action(actor,'snapshot','{}') ? 'stats','Snapshot has analytics';
  assert public.admin_action(actor,'vendor_delete',jsonb_build_object('vendorId',v))->>'success'='true';
  assert exists(select 1 from public.vendors where id=v and not is_active and not is_online),'Delete hides business';
  assert exists(select 1 from public.food_items where id=f),'Historical menu is preserved';
  perform set_config('admin_test.actor',actor::text,true);perform set_config('admin_test.vendor',v::text,true);perform set_config('admin_test.food',f::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',owner,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare n integer; begin
  update public.food_items set in_stock=true where id=current_setting('admin_test.food')::uuid;get diagnostics n=row_count;assert n=0,'Archived seller token cannot edit food';
  update public.vendors set is_online=true where id=current_setting('admin_test.vendor')::uuid;get diagnostics n=row_count;assert n=0,'Archived seller token cannot restore online';
end $$;
reset role;
do $$ declare actor uuid;result jsonb;begin
  actor:=current_setting('admin_test.actor')::uuid;
  result:=public.admin_action(actor,'food_delete',jsonb_build_object('foodId',current_setting('admin_test.food')));assert result->>'success'='true';
  assert not exists(select 1 from public.food_items where id=current_setting('admin_test.food')::uuid),'Delete menu item';
end $$;
select 'PASS: admin access, business/menu CRUD, isolation, private errors, telemetry deduplication, archive and stale seller permissions' as result;
