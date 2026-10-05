-- Preserve buyer/vendor isolation while evaluating identity once per query.
begin;
drop policy if exists orders_buyer_read on public.orders;
drop policy if exists orders_vendor_read on public.orders;
create policy orders_participant_read on public.orders for select to authenticated
 using (buyer_id = (select auth.uid()) or exists (
   select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid())
 ));
alter policy saved_own on public.saved_items
 using (buyer_id = (select auth.uid()) and (select not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)))
 with check (buyer_id = (select auth.uid()) and (select not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)));

-- Guest buyer sessions cannot provision a business or become a menu owner.
alter policy vendors_owner_insert on public.vendors
 with check ((select not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)) and owner_id = (select auth.uid()));
alter policy vendors_owner_update on public.vendors
 using ((select not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)) and owner_id = (select auth.uid()))
 with check ((select not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)) and owner_id = (select auth.uid()));
create index if not exists orders_vendor_created on public.orders(vendor_id, created_at desc);
create index if not exists support_buyer_created on public.order_support(buyer_id, created_at desc);
create index if not exists support_vendor_created on public.order_support(vendor_id, created_at desc);
commit;
