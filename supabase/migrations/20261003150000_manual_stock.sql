-- Stock is managed by sellers with an on/off switch. Existing order quantities and snapshots are preserved.
begin;
-- Row locking requires UPDATE privilege even when no shop fields change.
grant select, update on public.vendors to service_role;

create or replace function public.checkout_pickup(p_actor uuid, p_input jsonb) returns jsonb
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
  if not f.in_stock or f.action_type <> 'order' or f.price <= 0 or f.price > 1000000 then
    return jsonb_build_object('error','item_unavailable');
  end if;
  if f.price <> expected then return jsonb_build_object('error','price_changed','price',f.price); end if;
  insert into public.pickup_counters values (v.id, day, 1)
    on conflict (vendor_id, operating_date) do update set last_number = public.pickup_counters.last_number + 1
    returning last_number into number;
  insert into public.orders (vendor_id, food_item_id, buyer_id, attempt_id, item_name, unit_price, quantity, total,
    pickup_number, operating_date, shop_name, pickup_location, stock_reserved, expires_at, is_legacy)
  values (v.id, f.id, p_actor, attempt, f.name, f.price, qty, f.price * qty, number, day, v.name,
    coalesce(v.location_landmark, v.name), false, clock_timestamp() + interval '3 minutes', false)
  returning * into o;
  return jsonb_build_object('order',to_jsonb(o));
end $$;
revoke execute on function public.checkout_pickup(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.checkout_pickup(uuid,jsonb) to service_role;

commit;
