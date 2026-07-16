-- Run only after the owner has signed in to eLOG with Google once.
-- Replace the placeholder with the exact owner email, then run in Supabase SQL Editor.
-- Never grant admin through user-editable user_metadata.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = lower('OWNER_EMAIL_HERE');

-- The owner must sign out and sign in again so the new role is included in the JWT.
