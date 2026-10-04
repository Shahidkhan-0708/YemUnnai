-- Additive pickup release. Historical unit_price contains the entire amount.
begin;
alter table public.food_items add column if not exists is_vegetarian boolean;
alter table public.food_items add column if not exists remaining_quantity integer check (remaining_quantity >= 0);
alter table public.orders
  add column buyer_id uuid references auth.users(id),
  add column attempt_id uuid,
  add column quantity integer check (quantity between 1 and 20),
  add column total integer check (total >= 0),
  add column pickup_number bigint,
  add column operating_date date,
  add column shop_name text,
  add column pickup_location text,
  add column stock_reserved boolean not null default false,
  add column cancellation_requested boolean not null default false,
  add column cancellation_result text check (cancellation_result in ('approved','rejected')),
  add column expires_at timestamptz,
  add column preparation_minutes integer check (preparation_minutes between 1 and 180),
  add column accepted_at timestamptz,
  add column ready_at timestamptz,
  add column collected_at timestamptz,
  add column payment_method text check (payment_method in ('cash','counter_upi')),
  add column payment_confirmed_at timestamptz,
  add column outcome_reason text,
  add column is_legacy boolean not null default true;
update public.orders set total = unit_price;
alter table public.orders alter column is_legacy set default false;
alter table public.orders alter column customer_mobile set default '';
alter table public.orders alter column delivery_address set default '';
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','accepted','preparing','ready','collected','declined','cancelled','completed'));
-- Accepted is known to mean preparing. Completed is deliberately left ambiguous.
update public.orders set status = 'preparing' where status = 'accepted';
create unique index orders_buyer_attempt on public.orders(buyer_id, attempt_id);
create unique index orders_shop_pickup on public.orders(vendor_id, operating_date, pickup_number);
create index orders_buyer_created on public.orders(buyer_id, created_at desc);
create index orders_expiry on public.orders(expires_at) where status = 'pending' and not is_legacy;
alter table public.orders add constraint orders_new_amount check
  (is_legacy or (buyer_id is not null and attempt_id is not null and quantity is not null
    and total is not null and total = unit_price * quantity and pickup_number is not null and operating_date is not null));

create table public.pickup_counters (
  vendor_id uuid references public.vendors(id), operating_date date, last_number bigint not null,
  primary key (vendor_id, operating_date)
);
alter table public.pickup_counters enable row level security;
revoke all on public.pickup_counters from public, anon, authenticated;
grant all on public.pickup_counters to service_role;
drop policy if exists orders_anyone_insert on public.orders;
drop policy if exists orders_vendor_update on public.orders;
revoke insert, update, delete on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
create policy orders_buyer_read on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()));

create table public.saved_items (
  buyer_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete cascade,
  primary key(buyer_id, food_item_id)
);
alter table public.saved_items enable row level security;
revoke all on public.saved_items from anon, authenticated;
grant select, insert, delete on public.saved_items to authenticated;
create policy saved_own on public.saved_items for all to authenticated
  using (buyer_id = (select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')::boolean, true))
  with check (buyer_id = (select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')::boolean, true));

create table public.app_admins (user_id uuid primary key references auth.users(id));
alter table public.app_admins enable row level security;
revoke all on public.app_admins from public, anon, authenticated;
grant select on public.app_admins to authenticated;
grant all on public.app_admins to service_role;
create policy admin_self on public.app_admins for select to authenticated using (user_id = (select auth.uid()));
create table public.order_support (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  buyer_id uuid not null references auth.users(id),
  vendor_id uuid not null references public.vendors(id),
  message text not null check (length(message) between 1 and 2000),
  status text not null default 'open' check (status in ('open','escalated','resolved')),
  response text check (length(response) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index support_order on public.order_support(order_id);
alter table public.order_support enable row level security;
revoke all on public.order_support from anon, authenticated;
grant select on public.order_support to authenticated;
grant all on public.order_support to service_role;
create policy support_read on public.order_support for select to authenticated using (
  buyer_id = (select auth.uid()) or exists(select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid()))
  or (status = 'escalated' and exists(select 1 from public.app_admins a where a.user_id = (select auth.uid())))
);

-- Service-only invoker functions. The Edge Function verifies the actor's Auth token.
-- A terminal transition releases stock in the same transaction, once.
create function public.release_order_stock() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.stock_reserved and new.status in ('declined','cancelled') and old.status not in ('declined','cancelled') then
    update public.food_items set remaining_quantity = remaining_quantity + old.quantity
      where id = old.food_item_id and remaining_quantity is not null;
    new.stock_reserved := false;
  end if;
  return new;
end $$;
revoke execute on function public.release_order_stock() from public, anon, authenticated;
create trigger order_stock_release before update on public.orders for each row execute function public.release_order_stock();

create function public.expire_pickup_orders() returns void language plpgsql security invoker set search_path = '' as $$
declare r record;
begin
  for r in select id from public.orders where status = 'pending' and expires_at <= clock_timestamp() and not is_legacy
    order by id for update skip locked loop
    update public.orders set status = 'cancelled', outcome_reason = 'acceptance_timeout' where id = r.id;
  end loop;
end $$;
revoke execute on function public.expire_pickup_orders() from public, anon, authenticated;
grant execute on function public.expire_pickup_orders() to service_role;

create function public.checkout_pickup(p_actor uuid, p_input jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  o public.orders; f public.food_items; v public.vendors;
  attempt uuid := (p_input->>'attemptId')::uuid;
  qty integer := (p_input->>'quantity')::integer;
  expected integer := (p_input->>'expectedPrice')::integer;
  day date := (clock_timestamp() at time zone 'Asia/Kolkata')::date;
  number bigint;
begin
  if p_actor is null then raise exception 'Unauthorized'; end if;
  if attempt is null or qty is null or qty not between 1 and 20 or expected is null or expected <= 0 then
    return jsonb_build_object('error','invalid_checkout');
  end if;
  -- Serialize only the same buyer/attempt, then return its immutable result.
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text || attempt::text, 0));
  select * into o from public.orders where buyer_id = p_actor and attempt_id = attempt;
  if found then return jsonb_build_object('order',to_jsonb(o)); end if;
  select * into f from public.food_items where id = (p_input->>'itemId')::uuid;
  if not found then return jsonb_build_object('error','item_unavailable'); end if;
  select * into v from public.vendors where id = f.vendor_id for update;
  select * into f from public.food_items where id = f.id for update;
  if not found then return jsonb_build_object('error','item_unavailable'); end if;
  if not v.is_active or not v.is_online then return jsonb_build_object('error','shop_offline'); end if;
  if not f.in_stock or (f.remaining_quantity is not null and f.remaining_quantity < qty) or f.action_type <> 'order' or f.price <= 0 then
    return jsonb_build_object('error','item_unavailable');
  end if;
  if f.price <> expected then return jsonb_build_object('error','price_changed','price',f.price); end if;
  insert into public.pickup_counters values (v.id, day, 1)
    on conflict (vendor_id, operating_date) do update set last_number = public.pickup_counters.last_number + 1
    returning last_number into number;
  if f.remaining_quantity is not null then
    update public.food_items set remaining_quantity = remaining_quantity - qty where id = f.id;
  end if;
  insert into public.orders (vendor_id, food_item_id, buyer_id, attempt_id, item_name, unit_price, quantity, total,
    pickup_number, operating_date, shop_name, pickup_location, stock_reserved, expires_at, is_legacy)
  values (v.id, f.id, p_actor, attempt, f.name, f.price, qty, f.price * qty, number, day, v.name,
    coalesce(v.location_landmark, v.name), f.remaining_quantity is not null, clock_timestamp() + interval '3 minutes', false)
  returning * into o;
  return jsonb_build_object('order',to_jsonb(o));
end $$;
revoke execute on function public.checkout_pickup(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.checkout_pickup(uuid,jsonb) to service_role;

create function public.pickup_action(p_actor uuid, p_action text, p_input jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare o public.orders; s public.order_support; vendor boolean; target text; result jsonb; admin boolean;
begin
  if p_actor is null then raise exception 'Unauthorized'; end if;
  select exists(select 1 from public.app_admins where user_id = p_actor) into admin;
  if p_action in ('list','vendor_list','recover','detail') then
    perform public.expire_pickup_orders();
    select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]') into result from (
      select o.*, jsonb_build_object('name',v.name,'latitude',v.latitude,'longitude',v.longitude,'location_landmark',v.location_landmark) as vendors
      from public.orders o join public.vendors v on v.id = o.vendor_id
      where ((p_action <> 'vendor_list' and o.buyer_id = p_actor) or (p_action = 'vendor_list' and v.owner_id = p_actor and v.id = (p_input->>'vendorId')::uuid))
        and (p_action <> 'recover' or o.attempt_id = (p_input->>'attemptId')::uuid)
        and (p_action <> 'detail' or o.id = (p_input->>'orderId')::uuid)
        and (p_action not in ('list','vendor_list') or o.status in ('pending','preparing','ready') or o.created_at >= now() - interval '30 days')
      order by o.created_at desc
    ) q;
    return jsonb_build_object('orders',result);
  end if;
  if p_action = 'support_list' then
    select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]') into result from (
      select s.* from public.order_support s where s.buyer_id = p_actor
        or exists(select 1 from public.vendors where id = s.vendor_id and owner_id = p_actor)
        or (admin and s.status = 'escalated') order by s.created_at desc limit 200
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
grant all on public.orders to service_role;
grant select, update on public.food_items to service_role;
grant select on public.vendors to service_role;

-- Shop availability changes refresh discovery just like menu changes.
do $$ begin
  alter publication supabase_realtime add table public.vendors;
exception when duplicate_object or undefined_object then null;
end $$;

-- Required for autonomous expiry, even when no browser is connected.
create extension if not exists pg_cron;
select cron.schedule('expire-pickup-orders','10 seconds','select public.expire_pickup_orders()');
commit;
