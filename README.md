# eLOG Beta 0.2.0

eLOG is an installable, local-first trading journal beta for stocks, options, futures, and forex.

## Beta notice

- Journal data is stored in the tester's browser on their device.
- Testers should download data copies and create restore points regularly.
- The local password protects the interface but does not encrypt browser storage.
- Installing the app does not create an account or cloud sync.
- Rule coaching uses correlations in the tester's own journal; it is not a trade signal.
- GitHub feedback is public and must not contain private trading or personal information.
- Paid plans are previews and do not process payments in MK1.
- eLOG is a journaling tool, not financial advice.

## Public beta

Open https://nardo-code.github.io/elog-beta/ in a current browser. Use **Settings → Install eLOG** to add it to Windows, Android, or another supported desktop/mobile browser. On iPhone or iPad, use Safari's **Share → Add to Home Screen**.

## Development checks

Run `node scripts/validate-site.mjs`, `node --check app.js`, and `node --check sw.js` before publishing.
