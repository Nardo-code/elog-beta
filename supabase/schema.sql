-- eLOG Beta cloud foundation
-- Run this entire file once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.elog_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.elog_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Trader' check (char_length(display_name) between 1 and 80),
  storage_mode text not null default 'cloud' check (storage_mode in ('cloud', 'local')),
  analytics_consent boolean not null default false,
  diagnostics_consent boolean not null default false,
  product_updates_consent boolean not null default false,
  support_access boolean not null default false,
  consent_version text not null default '2.0',
  app_version text not null default 'Beta 0.3.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.elog_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  device_id uuid,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.elog_product_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid,
  event_name text not null check (event_name in (
    'app_opened', 'onboarding_completed', 'page_view', 'sync_completed',
    'sync_failed', 'feedback_opened', 'install_prompt', 'client_error'
  )),
  app_version text not null check (char_length(app_version) <= 40),
  storage_mode text not null check (storage_mode in ('cloud', 'local', 'unset')),
  device_type text not null check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 2048),
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create or replace function public.elog_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists elog_profiles_updated_at on public.elog_profiles;
create trigger elog_profiles_updated_at
before update on public.elog_profiles
for each row execute function public.elog_set_updated_at();

drop trigger if exists elog_workspaces_updated_at on public.elog_workspaces;
create trigger elog_workspaces_updated_at
before update on public.elog_workspaces
for each row execute function public.elog_set_updated_at();

alter table public.elog_profiles enable row level security;
alter table public.elog_workspaces enable row level security;
alter table public.elog_product_events enable row level security;

drop policy if exists "Users read their eLOG profile" on public.elog_profiles;
create policy "Users read their eLOG profile"
on public.elog_profiles for select to authenticated
using ((select auth.uid()) = user_id or public.elog_is_admin());

drop policy if exists "Users create their eLOG profile" on public.elog_profiles;
create policy "Users create their eLOG profile"
on public.elog_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their eLOG profile" on public.elog_profiles;
create policy "Users update their eLOG profile"
on public.elog_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their eLOG profile" on public.elog_profiles;
create policy "Users delete their eLOG profile"
on public.elog_profiles for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users read their own workspace" on public.elog_workspaces;
create policy "Users read their own workspace"
on public.elog_workspaces for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own workspace" on public.elog_workspaces;
create policy "Users create their own workspace"
on public.elog_workspaces for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own workspace" on public.elog_workspaces;
create policy "Users update their own workspace"
on public.elog_workspaces for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own workspace" on public.elog_workspaces;
create policy "Users delete their own workspace"
on public.elog_workspaces for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Consent-aware product event insert" on public.elog_product_events;
create policy "Consent-aware product event insert"
on public.elog_product_events for insert to anon, authenticated
with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Admins read product events" on public.elog_product_events;
create policy "Admins read product events"
on public.elog_product_events for select to authenticated
using (public.elog_is_admin());

create or replace function public.elog_admin_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.elog_is_admin() then jsonb_build_object(
    'cloud_users', (select count(*) from public.elog_profiles where storage_mode = 'cloud'),
    'active_7d', (select count(*) from public.elog_profiles where last_seen_at >= now() - interval '7 days'),
    'analytics_opt_in', (select count(*) from public.elog_profiles where analytics_consent),
    'diagnostics_opt_in', (select count(*) from public.elog_profiles where diagnostics_consent),
    'synced_workspaces', (select count(*) from public.elog_workspaces),
    'events_7d', (select count(*) from public.elog_product_events where created_at >= now() - interval '7 days')
  ) else null end;
$$;

create or replace function public.elog_admin_users()
returns table (
  user_id uuid,
  display_name text,
  storage_mode text,
  analytics_consent boolean,
  diagnostics_consent boolean,
  support_access boolean,
  last_seen_at timestamptz,
  workspace_updated_at timestamptz,
  workspace_revision bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.display_name, p.storage_mode, p.analytics_consent,
    p.diagnostics_consent, p.support_access, p.last_seen_at, w.updated_at, w.revision
  from public.elog_profiles p
  left join public.elog_workspaces w on w.user_id = p.user_id
  where public.elog_is_admin()
  order by p.last_seen_at desc;
$$;

create or replace function public.elog_admin_event_summary(days_back integer default 30)
returns table (event_name text, event_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.event_name, count(*)
  from public.elog_product_events e
  where public.elog_is_admin()
    and e.created_at >= now() - make_interval(days => greatest(1, least(days_back, 365)))
  group by e.event_name
  order by count(*) desc;
$$;

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
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on public.elog_profiles, public.elog_workspaces, public.elog_product_events from anon;
grant insert on public.elog_product_events to anon;
grant select, insert, update, delete on public.elog_profiles to authenticated;
grant select, insert, update, delete on public.elog_workspaces to authenticated;
grant insert, select on public.elog_product_events to authenticated;
grant usage, select on sequence public.elog_product_events_id_seq to anon, authenticated;

revoke all on function public.elog_admin_summary() from public, anon;
revoke all on function public.elog_admin_users() from public, anon;
revoke all on function public.elog_admin_event_summary(integer) from public, anon;
revoke all on function public.elog_delete_my_account() from public, anon;
grant execute on function public.elog_admin_summary() to authenticated;
grant execute on function public.elog_admin_users() to authenticated;
grant execute on function public.elog_admin_event_summary(integer) to authenticated;
grant execute on function public.elog_delete_my_account() to authenticated;

comment on table public.elog_workspaces is 'User-owned eLOG workspace JSON. RLS permits only the authenticated owner.';
comment on table public.elog_product_events is 'Consent-aware product events. Never store journal content, symbols, balances, screenshots, or notes.';
