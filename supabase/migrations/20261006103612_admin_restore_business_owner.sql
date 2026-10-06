begin;
create or replace function public.admin_action(p_actor uuid,p_action text,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v jsonb; f jsonb; record_id uuid; saved_vendor public.vendors%rowtype; saved_food public.food_items%rowtype; owner uuid; result jsonb;
begin
  if not exists(select 1 from public.app_admins a join auth.users u on u.id=a.user_id where a.user_id=p_actor and not u.is_anonymous)
    then return jsonb_build_object('error','forbidden'); end if;
  if p_action='snapshot' then
    return jsonb_build_object(
      'vendors',(select coalesce(jsonb_agg(to_jsonb(q) order by q.is_active desc,q.name),'[]') from public.vendors q),
      'foods',(select coalesce(jsonb_agg(to_jsonb(q) order by q.vendor_id,q.menu_position nulls last,q.name),'[]') from public.food_items q),
      'orders',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select id,vendor_id,food_item_id,item_name,unit_price,quantity,total,pickup_number,shop_name,status,payment_method,is_legacy,cancellation_requested,created_at from public.orders order by created_at desc limit 500) q),
      'support',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select id,order_id,vendor_id,message,status,response,created_at from public.order_support order by created_at desc limit 200) q),
      'errors',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select id,vendor_id,source,message,route,created_at,resolved_at from public.portal_events where kind='error' order by created_at desc limit 200) q),
      'traffic',(select coalesce(jsonb_agg(to_jsonb(q) order by q.date),'[]') from (select (created_at at time zone 'Asia/Kolkata')::date as date,count(distinct session_id) filter(where kind in ('page','item')) as visitors,count(*) filter(where kind='page') as views,count(*) filter(where kind='item') as item_views from public.portal_events where created_at>=now()-interval '30 days' and kind<>'error' group by 1) q),
      'traffic_since',(select min(created_at) from public.portal_events where kind<>'error'),
      'stats',jsonb_build_object('orders',(select count(*) from public.orders),'orders_today',(select count(*) from public.orders where created_at>=(now() at time zone 'Asia/Kolkata')::date at time zone 'Asia/Kolkata'),'collected_value',(select coalesce(sum(total),0) from public.orders where status='collected' and payment_confirmed_at is not null)),
      'changes',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select a.action,a.record_id,a.created_at from public.admin_changes a order by a.id desc limit 50) q)
    );
  elsif p_action='vendor_save' then
    v:=p_input->'vendor'; record_id:=coalesce(nullif(v->>'id','')::uuid,gen_random_uuid());
    if v->>'id' is null then
      owner:=(p_input->>'ownerId')::uuid;
      if owner is null or not exists(select 1 from auth.users where id=owner and not is_anonymous) then return jsonb_build_object('error','invalid_request'); end if;
      insert into public.vendors(id,name,image_url,is_active,is_online,owner_id,latitude,longitude,location_landmark)
        values(record_id,trim(v->>'name'),nullif(v->>'image_url',''),coalesce((v->>'is_active')::boolean,true),coalesce((v->>'is_online')::boolean,false),owner,(v->>'latitude')::float8,(v->>'longitude')::float8,coalesce(v->>'location_landmark','')) returning * into saved_vendor;
    else
      if not (v->>'is_active')::boolean and exists(select 1 from public.orders where vendor_id=record_id and status in ('pending','preparing','ready') and not is_legacy) then return jsonb_build_object('error','active_orders'); end if;
      update public.vendors set name=trim(v->>'name'),image_url=nullif(v->>'image_url',''),is_active=(v->>'is_active')::boolean,is_online=case when (v->>'is_active')::boolean then (v->>'is_online')::boolean else false end,
        latitude=(v->>'latitude')::float8,longitude=(v->>'longitude')::float8,location_landmark=coalesce(v->>'location_landmark',''),owner_id=coalesce(owner_id,(p_input->>'ownerId')::uuid) where id=record_id returning * into saved_vendor;
      if not found then return jsonb_build_object('error','not_found'); end if;
    end if;
    if coalesce(p_input->>'pin','')<>'' then perform public.provision_vendor_pin(record_id,saved_vendor.owner_id,p_input->>'pin'); end if;
    result:=jsonb_build_object('vendor',to_jsonb(saved_vendor));
  elsif p_action='vendor_delete' then
    record_id:=(p_input->>'vendorId')::uuid;
    if exists(select 1 from public.orders where vendor_id=record_id and status in ('pending','preparing','ready') and not is_legacy) then return jsonb_build_object('error','active_orders'); end if;
    update public.vendors set is_active=false,is_online=false where id=record_id returning * into saved_vendor;
    if not found then return jsonb_build_object('error','not_found'); end if;
    result:=jsonb_build_object('success',true);
  elsif p_action='food_save' then
    f:=p_input->'food'; record_id:=coalesce(nullif(f->>'id','')::uuid,gen_random_uuid());
    if not exists(select 1 from public.vendors where id=(f->>'vendor_id')::uuid) then return jsonb_build_object('error','not_found'); end if;
    if f->>'id' is null then
      insert into public.food_items(id,vendor_id,name,price,category,action_type,image_url,in_stock,is_vegetarian,menu_category,description,price_variants,food_type)
        values(record_id,(f->>'vendor_id')::uuid,trim(f->>'name'),(f->>'price')::integer,f->>'category','walkin',nullif(f->>'image_url',''),(f->>'in_stock')::boolean,(f->>'is_vegetarian')::boolean,coalesce(f->>'menu_category',''),coalesce(f->>'description',''),coalesce(f->'price_variants','[]'),case when (f->>'is_vegetarian')::boolean then 'Veg' when (f->>'is_vegetarian')::boolean=false then 'Non-Veg' else 'Not specified' end) returning * into saved_food;
    else
      update public.food_items set name=trim(f->>'name'),price=(f->>'price')::integer,category=f->>'category',image_url=nullif(f->>'image_url',''),in_stock=(f->>'in_stock')::boolean,is_vegetarian=(f->>'is_vegetarian')::boolean,menu_category=coalesce(f->>'menu_category',''),description=coalesce(f->>'description',''),
        price_display=case when price is not distinct from (f->>'price')::integer and price_variants=coalesce(f->'price_variants','[]') then price_display else null end,
        price_variants=coalesce(f->'price_variants','[]'),food_type=case when (f->>'is_vegetarian')::boolean then 'Veg' when (f->>'is_vegetarian')::boolean=false then 'Non-Veg' else 'Not specified' end
        where id=record_id and vendor_id=(f->>'vendor_id')::uuid returning * into saved_food;
      if not found then return jsonb_build_object('error','not_found'); end if;
    end if;
    result:=jsonb_build_object('food',to_jsonb(saved_food));
  elsif p_action='food_delete' then
    record_id:=(p_input->>'foodId')::uuid;
    delete from public.food_items where id=record_id;
    if not found then return jsonb_build_object('error','not_found'); end if;
    result:=jsonb_build_object('success',true);
  elsif p_action='error_resolve' then
    record_id:=(p_input->>'errorId')::uuid;
    update public.portal_events set resolved_at=case when (p_input->>'resolved')::boolean then now() else null end where id=record_id and kind='error';
    if not found then return jsonb_build_object('error','not_found'); end if;
    result:=jsonb_build_object('success',true);
  elsif p_action='support_resolve' then
    record_id:=(p_input->>'supportId')::uuid;
    update public.order_support set status='resolved',response=trim(p_input->>'response'),updated_at=now() where id=record_id;
    if not found then return jsonb_build_object('error','not_found'); end if;
    result:=jsonb_build_object('success',true);
  elsif p_action='order_transition' then
    record_id:=(p_input->>'orderId')::uuid;
    select v.owner_id into owner from public.orders o join public.vendors v on v.id=o.vendor_id where o.id=record_id;
    if owner is null then return jsonb_build_object('error','not_found'); end if;
    -- Reuse pickup's transition/stock/payment safeguards; actor is retained in admin_changes.
    result:=public.pickup_action(owner,'transition',p_input);
    if result ? 'error' then return result; end if;
  else return jsonb_build_object('error','invalid_request'); end if;
  insert into public.admin_changes(actor_id,action,record_id) values(p_actor,p_action,record_id);
  return result;
exception when unique_violation then return jsonb_build_object('error','duplicate_name');
  when invalid_text_representation or check_violation or not_null_violation then return jsonb_build_object('error','invalid_request');
end $$;
revoke all on function public.admin_action(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_action(uuid,text,jsonb) to service_role;
commit;
