-- Avoid PL/pgSQL row-variable conflicts in order and support listing queries.
begin;
create or replace function public.pickup_action(p_actor uuid, p_action text, p_input jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare o public.orders; s public.order_support; vendor boolean; target text; result jsonb; admin boolean;
begin
  if p_actor is null then raise exception 'Unauthorized'; end if;
  select exists(select 1 from public.app_admins where user_id = p_actor) into admin;
  if p_action in ('list','vendor_list','recover','detail') then
    perform public.expire_pickup_orders();
    select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]') into result from (
      select listed_order.*, jsonb_build_object('name',v.name,'latitude',v.latitude,'longitude',v.longitude,'location_landmark',v.location_landmark) as vendors
      from public.orders listed_order join public.vendors v on v.id = listed_order.vendor_id
      where ((p_action <> 'vendor_list' and listed_order.buyer_id = p_actor) or (p_action = 'vendor_list' and v.owner_id = p_actor and v.id = (p_input->>'vendorId')::uuid))
        and (p_action <> 'recover' or listed_order.attempt_id = (p_input->>'attemptId')::uuid)
        and (p_action <> 'detail' or listed_order.id = (p_input->>'orderId')::uuid)
        and (p_action not in ('list','vendor_list') or listed_order.status in ('pending','preparing','ready') or listed_order.created_at >= now() - interval '30 days')
      order by listed_order.created_at desc
    ) q;
    return jsonb_build_object('orders',result);
  end if;
  if p_action = 'support_list' then
    select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]') into result from (
      select listed_support.* from public.order_support listed_support where listed_support.buyer_id = p_actor
        or exists(select 1 from public.vendors where id = listed_support.vendor_id and owner_id = p_actor)
        or (admin and listed_support.status = 'escalated') order by listed_support.created_at desc limit 200
    ) q;
    return jsonb_build_object('requests',result,'admin',admin);
  end if;
  if p_action in ('support_escalate','support_resolve') then
    select * into s from public.order_support where id = (p_input->>'supportId')::uuid for update;
    if not found then return jsonb_build_object('error','not_found'); end if;
    vendor := exists(select 1 from public.vendors where id = s.vendor_id and owner_id = p_actor);
    if p_action = 'support_escalate' then
      if s.buyer_id <> p_actor or s.status <> 'open' then return jsonb_build_object('error','not_allowed'); end if;
      update public.order_support set status = 'escalated', updated_at = clock_timestamp() where id = s.id;
    else
      if not vendor and not (admin and s.status = 'escalated') then return jsonb_build_object('error','not_allowed'); end if;
      if length(trim(coalesce(p_input->>'response',''))) not between 1 and 2000 then return jsonb_build_object('error','invalid_message'); end if;
      update public.order_support set status = 'resolved', response = trim(p_input->>'response'), updated_at = clock_timestamp() where id = s.id;
    end if;
    return jsonb_build_object('success',true);
  end if;
  select * into o from public.orders where id = (p_input->>'orderId')::uuid for update;
  if not found then return jsonb_build_object('error','not_found'); end if;
  vendor := exists(select 1 from public.vendors where id = o.vendor_id and owner_id = p_actor);
  if o.buyer_id is distinct from p_actor and not vendor then return jsonb_build_object('error','not_found'); end if;
  if p_action = 'support' then
    if o.buyer_id is distinct from p_actor or length(trim(coalesce(p_input->>'message',''))) not between 1 and 2000 then
      return jsonb_build_object('error','invalid_message');
    end if;
    insert into public.order_support(order_id,buyer_id,vendor_id,message) values(o.id,p_actor,o.vendor_id,trim(p_input->>'message')) returning * into s;
    return jsonb_build_object('request',to_jsonb(s));
  end if;
  if o.is_legacy then return jsonb_build_object('error','legacy_order'); end if;
  if o.status = 'pending' and o.expires_at <= clock_timestamp() then
    update public.orders set status = 'cancelled', outcome_reason = 'acceptance_timeout' where id = o.id returning * into o;
    return jsonb_build_object('order',to_jsonb(o));
  end if;
  if p_action = 'cancel' and o.buyer_id = p_actor then
    if o.status = 'pending' then
      update public.orders set status = 'cancelled', outcome_reason = 'buyer_cancelled' where id = o.id returning * into o;
    elsif o.status in ('preparing','ready') then
      update public.orders set cancellation_requested = true, cancellation_result = null where id = o.id returning * into o;
    else return jsonb_build_object('error','invalid_transition'); end if;
  elsif p_action = 'cancellation_decision' and vendor then
    if not o.cancellation_requested or o.status not in ('preparing','ready') or coalesce(p_input->>'decision','') not in ('approve','reject') then
      return jsonb_build_object('error','invalid_transition');
    end if;
    update public.orders set cancellation_requested = false,
      cancellation_result = case when p_input->>'decision' = 'approve' then 'approved' else 'rejected' end,
      status = case when p_input->>'decision' = 'approve' then 'cancelled' else status end,
      outcome_reason = case when p_input->>'decision' = 'approve' then 'shop_cancelled' else outcome_reason end
      where id = o.id returning * into o;
  elsif p_action = 'transition' and vendor then
    target := p_input->>'status';
    if not ((o.status = 'pending' and target in ('preparing','declined')) or (o.status = 'preparing' and target = 'ready') or (o.status = 'ready' and target = 'collected'))
      or target is null then return jsonb_build_object('error','invalid_transition'); end if;
    if target = 'collected' and (o.cancellation_requested or coalesce(p_input->>'paymentMethod','') not in ('cash','counter_upi')) then
      return jsonb_build_object('error','payment_required');
    end if;
    update public.orders set status = target,
      preparation_minutes = case when target = 'preparing' then (p_input->>'preparationMinutes')::integer else preparation_minutes end,
      accepted_at = case when target = 'preparing' then clock_timestamp() else accepted_at end,
      ready_at = case when target = 'ready' then clock_timestamp() else ready_at end,
      collected_at = case when target = 'collected' then clock_timestamp() else collected_at end,
      payment_method = case when target = 'collected' then p_input->>'paymentMethod' else payment_method end,
      payment_confirmed_at = case when target = 'collected' then clock_timestamp() else payment_confirmed_at end
      where id = o.id returning * into o;
  else return jsonb_build_object('error','not_allowed'); end if;
  return jsonb_build_object('order',to_jsonb(o));
end $$;
revoke execute on function public.pickup_action(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.pickup_action(uuid,text,jsonb) to service_role;

commit;
