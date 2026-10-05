-- User-requested removal. Vendor records remain solely for historical receipts.
-- Save a private backup before running against production.
begin;
create temporary table preserved_receipts on commit drop as
  select id,item_name,unit_price,quantity,total,status from public.orders;
create temporary table preserved_other_foods on commit drop as
  select * from public.food_items where vendor_id not in
    ('a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008');
do $$ begin
  assert (select name='Ekdant''s Cafe' from public.vendors where id='a0000000-0000-4000-8000-000000000007'), 'Ekdant identity mismatch';
  assert (select name='Lickies' from public.vendors where id='a0000000-0000-4000-8000-000000000008'), 'Lickies identity mismatch';
end $$;
delete from public.food_items where vendor_id in
  ('a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008');
-- Unlink retired owners so existing sessions cannot recreate dishes through RLS.
update public.vendors set is_active=false,is_online=false,owner_id=null where id in
  ('a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008');
update public.vendors set image_url='/images/shop_p2-brand.svg' where
  id='a0000000-0000-4000-8000-000000000010' and name='Pizza And Pasta (P2)';
do $$ begin
  assert not exists(select * from preserved_receipts except select id,item_name,unit_price,quantity,total,status from public.orders), 'Existing receipts changed';
  assert not exists(select * from preserved_other_foods except select * from public.food_items), 'Other menus changed';
  assert (select count(*)=89 from public.food_items where vendor_id='a0000000-0000-4000-8000-000000000010'), 'P2 menu changed';
  assert (select count(*)=53 from public.food_items where vendor_id='a0000000-0000-4000-8000-000000000001'), 'MITS menu changed';
end $$;
commit;
select v.name,v.is_active,count(f.id) as menu_items from public.vendors v
left join public.food_items f on f.vendor_id=v.id
group by v.id order by v.name;
