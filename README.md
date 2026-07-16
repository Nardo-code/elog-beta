# eLOG Beta 0.3.0

eLOG is an installable trading journal beta for stocks, options, futures, and forex. Testers can choose local-only storage or, after owner setup, private cloud synchronization with Google sign-in.

## Beta notice

- Local mode stores journal data in the tester's browser on their device.
- Cloud mode stores the workspace in the signed-in user's private Supabase row and supports cross-device synchronization.
- Testers should download data copies and create restore points regularly.
- The local password protects the interface but does not encrypt browser storage.
- Optional analytics and diagnostics are off by default and exclude trades, symbols, screenshots, notes, balances, and setup criteria.
- The owner dashboard receives account, consent, event-count, and sync status only; it cannot retrieve raw journal payloads.
- Rule coaching uses correlations in the tester's own journal; it is not a trade signal.
- GitHub feedback is public and must not contain private trading or personal information.
- Paid plans are previews and do not process payments in MK1.
- eLOG is a journaling tool, not financial advice.

## Public beta

Open https://nardo-code.github.io/elog-beta/ in a current browser. Use **Settings → Install eLOG** to add it to Windows, Android, or another supported desktop/mobile browser. On iPhone or iPad, use Safari's **Share → Add to Home Screen**.

## Activate Stage 2 cloud mode

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Set the Supabase Site URL and redirect URL to `https://nardo-code.github.io/elog-beta/`.
3. Enable Google in Supabase Authentication using your Google OAuth client ID and secret.
4. Sign in once, replace the placeholder email in `supabase/make-owner-admin.sql`, and run it in the SQL Editor.
5. Sign out and back in to refresh the owner role, then open `admin.html` from Settings.

The website contains only the Supabase publishable key. Never commit a Supabase secret or service-role key.

## Development checks

Run `node scripts/validate-site.mjs`, then syntax-check `app.js`, `cloud.js`, `admin.js`, and `sw.js` before publishing.
