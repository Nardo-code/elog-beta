# Optional cloud infrastructure

The public beta defaults to on-device storage. New cloud enrollment is intentionally locked.

Before any future cloud release, a deployment operator must:

1. Apply the reviewed database schema in the correct project.
2. Configure only the deployed app origin as an approved authentication redirect.
3. Enable identity providers only when their consent screen and data policy are ready.
4. Verify row-level security with separate test accounts.
5. Test account-data deletion before opening enrollment.

If the production project was created before the account-deletion fix, run `fix-account-deletion.sql` once in its SQL Editor. It deletes user-linked product events before the authentication row so the database ownership check cannot block deletion.

Never commit a password, OAuth client secret, Supabase secret/service-role key, database credential, private journal export, or personal authentication record. Browser publishable configuration is not a substitute for row-level security.
