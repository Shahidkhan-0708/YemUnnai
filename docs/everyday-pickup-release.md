# Everyday pickup release

The implementation keeps single-item pickup and payment at the shop. Vendor PIN login remains separate from buyer authentication.

## Implementation

Checkout uses the authenticated `pickup` Edge Function and service-only database functions. The browser sends an item ID, quantity, expected unit price, and attempt ID. The database locks stock, checks the shop and price, reserves portions, assigns a daily pickup number, and stores the order in one transaction. Repeating a buyer's attempt returns its original order.

The browser stores the unresolved attempt before sending it. A lost response retains the same payload. Recovery first queries that attempt, then safely replays it if no result exists. A changed price requires another explicit confirmation. Browser storage must work before checkout sends a request. Modern browsers also serialize checkout across tabs with Web Locks.

Buyers can read their own orders. Vendors can read orders for their own shops. Direct browser order creation and updates are revoked. The Edge Function verifies the user's token with Supabase Auth and supplies the actor to database functions. Public clients cannot invoke those service-only functions or supply an authorized actor.

New orders move from Pending to Preparing, Ready, and Collected. Collection requires cash or counter UPI confirmation. Decline, cancellation, and expiry release a tracked reservation once. An order row lock serializes lifecycle changes. Acceptance checks the three-minute deadline even if the scheduled expiry job has not run yet. Cron expires unattended orders every ten seconds.

Historical amounts remain unchanged. Old `unit_price` values represent historical totals. Historical `completed` records retain that status and show that pickup state is unknown. No old order is assigned to a buyer through a phone number.

Discovery includes maximum-price, availability, and vendor-confirmed vegetarian filters. Missing dietary data stays unknown. Failed refreshes show an error and retry action. Existing displayed catalog information is marked as potentially outdated and cannot start checkout from the discovery grid. The detail screen rechecks availability before checkout. The database checks again during creation.

Discover, Saved, and Orders stay available in buyer navigation. Orders includes all active orders and the last thirty days of history. Realtime triggers refreshes. Visible pages poll and reconnecting refetches current data. Orders stay in Supabase rather than becoming a local order database.

Pending cancellation is immediate. Accepted cancellation requires the shop's decision. An outstanding cancellation blocks collection. Buyers can request help after collection, and unresolved help can escalate from the shop to app admins. Admin membership comes from `app_admins`, with no browser write grant.

Bookmark controls share a local store. Verified accounts sync bookmarks through owner-scoped RLS. Failed synchronization preserves local changes for retry. Order again checks current availability and price before opening checkout.

Buyer and vendor Auth clients use different storage keys. Anonymous purchases require no email or delivery address. Linking a verified email keeps the guest's user ID. Signing into an existing account shows that account's orders and does not claim the guest's historical orders. Language selection persists. Core journey strings support English and Telugu. Returning users skip the launch splash.

Checkout and collection dialogs use the existing focus helper. Controls have labels, visible focus, and native keyboard behavior. New sheets and detail content use normal flow and wrap long text. Reduced motion disables animation. No Watermelon component or runtime dependency was added: existing controls and native elements cover the identified gaps.

## Review guidance applied

The product review keeps the accepted scope: pickup, counter payment, guest access, and shop-first help. Group orders, delivery, online payments, scheduling, push, loyalty, and a multi-item cart remain later releases.

The engineering review follows checkout through response loss and replay. It checks money calculation, ownership boundaries, stock locking, release-once behavior, and conflicting lifecycle actions. Database functions use invoker security with service-only execution grants. No service key enters the client bundle.

The design review checks discovery, checkout, order recovery, pickup, cancellation, help, and repeat purchase. Loading, empty, failure, retry, and confirmation states are present. Pickup numbers and status text work without a color cue. Preparation time is labeled as an estimate.

Automated gstack product, engineering, and design reviews remain pending. The installed skill runner was inaccessible in this environment. Run the gstack setup or upgrade workflow in a working environment, then perform those reviews before pilot release.

## Verification

Passed locally:

- TypeScript project build.
- Vite production build.
- Pickup handler and client checks in `scripts/test_pickup.mjs`.
- Existing vendor PIN handler checks in `supabase/test_vendor_pin.mjs`.
- Lint completed without errors. Existing React and utility warnings remain.

The pickup checks execute the actual browser checkout module with a fake transport. They cover authentication, spoofed actors, invalid input, simultaneous clicks, response loss after commit, recovery, frozen payload replay, changed-price confirmation, and corrupt attempt storage. They are not database integration tests.

Pending release gates:

- `supabase/test_pickup.sql`: transactional database checks for money, stock, authorization, cancellation, collection, and expiry. Requires a migrated local or staging database and `psql`.
- `scripts/test_pickup_integration.mjs`: real concurrent staging buyers, last-portion reservation, duplicate recovery, ownership, and cancellation/acceptance/collection/expiry races. Requires explicit staging keys. It provisions isolated fixtures and cleans them up.
- `scripts/test_pickup_browser.mjs`: headless Chrome with mocked transport for Saved, checkout, the dialog focus handler, refresh, Telugu, narrow layouts, reduced motion, and vendor pickup. Phase 2 replaced the failing debugger connection, but Chrome still exits before app assertions. See [current verification](phase-2-verification.md).
- Live anonymous signup, email verification and cross-device login, Realtime reconnects, and autonomous Cron expiry.
- Screen reader review and a physical mobile-device check. Telugu copy needs native-reader review before wider rollout.

Phase 2 resolved Supabase CLI startup with its documented telemetry opt-out setting. Docker and `psql` remain unavailable, but CLI Management API queries can be used once secure management access is supplied. Database behavior and concurrency remain unverified here; see [current verification](phase-2-verification.md).

## Staging and pilot deployment

1. Apply `supabase/migrations/20261002190000_everyday_pickup.sql` to staging through the normal migration workflow.
2. Deploy `supabase/functions/pickup`. Its configuration disables gateway JWT checking because the handler validates each request with Auth.
3. Enable anonymous sign-ins, email confirmations, and manual identity linking. Configure the application origin as an allowed Auth redirect.
4. Make sure that `pg_cron` runs the `expire-pickup-orders` job. Make sure that `orders`, `food_items`, and `vendors` are enabled for Realtime.
5. Provision an app administrator's verified Auth user in `public.app_admins` through a privileged database connection.
6. Run the SQL, staging concurrency, and browser checks. Complete the pending automated and accessibility reviews.
7. Pilot one shop. Watch checkout failures, repeated attempts, overdue Pending orders, and unresolved support requests before wider rollout.

Run the local checks:

```sh
npm run test:pickup
node supabase/test_vendor_pin.mjs
npm run build
npm run lint
```

Run the database check after migration:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test_pickup.sql
```

For staging concurrency, set `PICKUP_RUN_STAGING=1`, `PICKUP_STAGING_URL`, `PICKUP_STAGING_PUBLIC_KEY`, and `PICKUP_STAGING_SECRET_KEY`, then run `npm run test:pickup:integration`. Never use production keys for this fixture test.

For browser checks, run the production build first. Set `CHROME_PATH` if Chrome uses another path, then run `npm run test:pickup:browser`. The runner serves that build on an isolated local port.

The migration and Edge Function are prepared locally. This session did not deploy the release or run a pilot shop.

Supabase references: [anonymous authentication](https://supabase.com/docs/guides/auth/auth-anonymous), [Edge Function authentication](https://supabase.com/docs/guides/functions/auth), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), and [scheduled database jobs](https://supabase.com/docs/guides/database/extensions/pg_cron).
