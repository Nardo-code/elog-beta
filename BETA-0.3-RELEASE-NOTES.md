# eLOG Beta 0.3.0 — Cloud foundation

Beta 0.3 adds an owner-controlled cloud foundation while preserving the local-only workflow.

## Included

- First-run choice between local-only and cloud storage.
- Required device password with an accurate warning that it locks the interface but does not encrypt browser storage.
- Optional analytics, diagnostics, and product-update consent, off by default.
- Google authentication through Supabase after the owner enables the provider.
- Private per-user workspace synchronization with explicit conflict choices and an on-device safety backup before a cloud restore.
- Cross-device sign-in and manual/automatic synchronization.
- A user-controlled switch back to local-only mode and cloud-account deletion.
- A role-gated owner dashboard for account, consent, event-count, and sync-health summaries.
- Database row-level security and owner functions that exclude raw journal payloads from the dashboard.

## Owner setup still required

Cloud sign-in remains unavailable until the database schema and Google OAuth provider are configured in Supabase. See `supabase/README.md`.

## Privacy boundary

Optional product events never include trade symbols, entries, exits, sizes, balances, notes, screenshots, or checklist criteria. The admin dashboard has no raw-workspace query.
