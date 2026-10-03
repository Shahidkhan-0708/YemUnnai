# Production behaviour checks

Checked 2026-10-03.

## Fixed

- Production catalog queries no longer request missing optional dietary/quantity columns explicitly. Discovery reads the actual dishes, and seller menu reads work with both schema versions.
- Phones use their full viewport width instead of a fixed 400px panel. Desktop keeps a centered 480px layout.
- Empty searches and filters cannot display the static reference menu. Saved and detail screens show actual selections. Different shop maps retain their live vendor information.
- Menu failures show a retry state rather than a contradictory empty-dishes message. Existing stale menu cards disable ordering until recovery.
- Manual stock writes retry only a confirmed missing-quantity-column error using the stock flag alone. Network/auth failures are not silently retried as success.
- The PWA cache version changes so previous assets are removed during activation. Stray parentheses around the app were removed.

## Verification

TypeScript and production build pass. Local behaviour suites pass for Saved/account races, checkout duplicate/lost response/price/storage validation, vendor PIN validation and ownership, manual stock persistence/failure/legacy-column compatibility, seller preparation/ready/collection/payment/publishing, and projected SVG controls.

A real browser with device emulation at 320, 390, 469 and 1280px passes against the current production catalog: menu loading, search/no-results/reset, cooked/packed categories, price and unknown-diet filters, Saved add/remove, actual details/back, disabling unavailable orders, simulated catalog network failure and retry recovery. No real order, seller change or Auth user is created by this catalog test. Screenshots and results are in .tmp/live-menu-browser/. The existing mocked full checkout/vendor journey covers purchase transitions without changing production data.

## Production backend status

The live configuration points to hdwpaxgbdrmezwkwumwk: 47 dishes (41 cooked, 6 packed). Four shops are online; the default feed contains 25 cooked dishes because MITS Canteen is offline. This is seller-controlled and was preserved. Vendor PIN login responds, but the new pickup function returns HTTP 404 and anonymous guest access is disabled. End-to-end live checkout cannot pass until these backend features are installed and configured.

Both supplied access-token sources return HTTP 403 for production database access. The MCP connector points to uqeacuhensqtdcunwzni, a different project with 46 dishes and 9 shops. The app is not switched to that database without the user's choice because accounts and orders differ.

Existing Supabase advisories on the connected project include publicly executable rls_auto_enable(); see [remediation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). No RLS or backend security settings are changed by this UI fix.
