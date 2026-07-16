-- eLOG account-deletion hotfix
-- Run this file in the Supabase SQL Editor for the production eLOG project.

create or replace function public.elog_delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Remove user-linked events before auth.users. Signed-in event rows have no
  -- anonymous_id, so ON DELETE SET NULL would otherwise violate their check.
  delete from public.elog_product_events where user_id = current_user_id;
  delete from public.elog_workspaces where user_id = current_user_id;
  delete from public.elog_profiles where user_id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.elog_delete_my_account() from public, anon;
grant execute on function public.elog_delete_my_account() to authenticated;
