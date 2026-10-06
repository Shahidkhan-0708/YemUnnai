begin;
-- SECURITY INVOKER checks only the verified user's ID and permanent-account flag.
-- The server role receives those two columns, never Auth passwords or metadata.
grant select(id,is_anonymous) on auth.users to service_role;
drop policy if exists admin_self on public.app_admins;
create policy admin_self on public.app_admins for select to authenticated
  using(user_id=(select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,true));
commit;
