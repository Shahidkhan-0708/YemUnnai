begin;
-- Wrap the Auth call itself so PostgreSQL and the advisor recognize an InitPlan.
alter policy saved_own on public.saved_items
 using (buyer_id = (select auth.uid()) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, true))
 with check (buyer_id = (select auth.uid()) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, true));
alter policy vendors_owner_insert on public.vendors
 with check (not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, true) and owner_id = (select auth.uid()));
alter policy vendors_owner_update on public.vendors
 using (not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, true) and owner_id = (select auth.uid()))
 with check (not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, true) and owner_id = (select auth.uid()));
-- Production already has the identical orders_vendor_created_idx index.
drop index if exists public.orders_vendor_created;
create index if not exists orders_vendor_created_idx on public.orders(vendor_id, created_at desc);
commit;
