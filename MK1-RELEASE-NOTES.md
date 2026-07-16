# eLOG Prototype MK1

> Historical release notes. Beta 0.2 replaces the MK1 feedback outbox with reviewed GitHub issue submission and adds installable app support.

Release date: July 15, 2026  
Stage: 1 — local-first product prototype

## Release purpose

Prototype MK1 validates eLOG's product concept, interface, trade-entry workflow, analytics presentation, subscription positioning, privacy experience, and security direction before investing in production infrastructure.

## Included in MK1

- Responsive trading dashboard with sample performance data
- Trade journal for stocks, options, futures, and forex
- Automatic P&L and return calculations
- Market-specific sizing, multipliers, and entry criteria
- Reusable setup templates and checklists
- Configurable futures symbols, tick sizes, and tick values
- Forex units, standard lots, mini lots, and micro lots
- Configurable trading sessions and time zones
- Pre-trade and post-trade screenshot storage and review
- Searchable and filterable trade journal
- Individual trade editing and deletion from Overview or Journal
- Multi-select deletion with irreversible Beta warnings
- Custom trading rules with per-trade adherence checklists
- Analytics and playbook views
- Expanded analytics for individual trades, outcomes, sessions, setups, and markets
- Fully trade-driven Overview metrics, insights, timestamps, and market-filtered performance curve
- Manual trade date/time entry and custom Overview date ranges
- Multiple trading accounts, starting balances, deposits, withdrawals, equity, currency, and profile settings
- Open/closed positions, stops, targets, planned risk, R-multiples, MFE/MAE, scaling notes, grades, emotions, mistakes, tags, confidence, and lessons
- Downloadable JSON import for cross-device recovery
- First-use walkthrough, labeled demo data, empty states, keyboard focus, and Escape-to-close dialogs
- In-app privacy, terms, trading-risk, deletion, and prototype-limitation information
- Premium-locked Trade Data Review preview with blurred personalized insights
- Free Beta plan with unlimited manual trade entries
- Tiered subscription presentation
- Local password lock using one-way password derivation
- Granular privacy consent with optional sharing disabled by default
- Data export and local deletion controls
- Smooth motion system with reduced-motion accessibility
- Replaying tab splash transitions with right-to-left letter motion and an on-device enable/disable setting
- MK1 walkthrough, release status, and demo-data restoration
- Animated balloon-style eLOG identity with a Home shortcut
- Expandable and compact navigation modes saved on the device
- Persistent beta-feedback form with a local outbox prepared for the Stage 2 endpoint
- Prominent local-device storage notice and one-click backup export
- Up to five named on-device restore points with restore and deletion controls

## Stage 1 boundary

MK1 stores information in the browser on the current device. It does not yet provide cloud sync, real customer accounts, social sign-in, live subscription billing, email delivery, owner analytics, broker imports, or production-grade administration.

The privacy popup records preferences locally but transmits no customer information.

MK1 originally prepared a local feedback outbox for a future endpoint. Beta 0.2 supersedes that design with a GitHub report the tester reviews before public submission.

## Stage 2 production work

1. Convert the prototype into a maintainable Next.js application.
2. Add Supabase authentication, Postgres data storage, private file storage, and Row Level Security.
3. Add Google, Apple, and email sign-in.
4. Move all user data from device storage into protected user-owned records.
5. Integrate Stripe Checkout, subscriptions, webhooks, and the customer portal.
6. Connect consent-aware diagnostics and aggregated product analytics.
7. Add owner MFA, restricted staff roles, audit logging, and incident-response controls.
8. Deploy preview and production environments through Vercel.
9. Complete security testing, privacy documents, terms, backups, and recovery testing.

## Review instructions

Open `index.html` in a current browser. On first use, choose privacy preferences. Use the question-mark button in the top bar for the MK1 walkthrough. Settings includes demo-data restoration, privacy controls, local security, futures contracts, and trading-session configuration.
