begin;
create temporary table hub_before on commit drop as select id,owner_id,image_url,is_online,is_active from public.vendors where id='a0000000-0000-4000-8000-000000000009';
update public.vendors set name='MITS Hub' where id='a0000000-0000-4000-8000-000000000009' and name in ('New Cafe','MITS Hub');
do $$ begin
assert (select name='MITS Hub' from public.vendors where id='a0000000-0000-4000-8000-000000000009'), 'Expected the existing cafe';
assert not exists(select * from hub_before except select id,owner_id,image_url,is_online,is_active from public.vendors), 'Seller ownership and state preserved';
end $$;
select name,(select count(*) from public.food_items f where f.vendor_id=v.id) as menu_items from public.vendors v where id='a0000000-0000-4000-8000-000000000009';
commit;
