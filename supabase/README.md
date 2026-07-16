# eLOG Supabase setup

1. Open the Supabase SQL Editor for the eLOG project.
2. Run `schema.sql` in full.
3. Configure Auth URL settings:
   - Site URL: `https://nardo-code.github.io/elog-beta/`
   - Redirect URL: `https://nardo-code.github.io/elog-beta/`
4. Enable Google under Authentication → Sign In / Providers after configuring the Google OAuth client.
5. Sign in to eLOG once with the owner's Google account.
6. Edit and run `make-owner-admin.sql` with the exact owner email.
7. Sign out and back in before opening `admin.html`.

The browser uses only the public `sb_publishable_` key. Never put a secret key, service-role key, database password, or Google client secret in this repository.
