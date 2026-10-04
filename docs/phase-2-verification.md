# Phase 2 verification

Updated 2026-10-03. Phase 2 is in progress. Local, staging SQL/API, mocked-browser, and live-staging browser checks passed. Email recovery, physical device/accessibility reviews, historical upgrade/rollback rehearsal, and the pilot remain pending. No production deployment was made.

Staging target: `uqeacuhensqtdcunwzni`, authorized by the user. The Supabase MCP integration and Management API now work with reviewed tool/network access. Credentials stayed in the ignored `.env.staging.local` or process memory; privileged keys were never added to frontend configuration or printed.

Initial inspection found 9 vendors, 46 menu items, pickup tables with RLS, both Edge Functions ACTIVE at version 1, and running Cron. These objects were already present; this agent did not bootstrap or deploy them. Initial migration history was empty. Inspection confirmed the checkout price ceiling and shop-lock grant were present, but historical migration provenance remains unknown. Do not rerun the legacy bootstrap.

Live SQL testing found PL/pgSQL alias conflicts in order/support listing. The CLI generated `20261003053555_pickup_action_alias_fix.sql`, applied to staging through MCP. Expanded rollback-only assertions then passed. Staging Auth now enables anonymous signup and manual linking, requires email confirmation, and uses the app's localhost redirect URLs. The API runner passed real PIN authentication, last-portion and duplicate-request races, ownership, lifecycle/payment/support, Saved RLS, autonomous Cron expiry, and cleanup. A subsequent run added Realtime subscription/resubscription; it passed after the runner explicitly awaited JWT setup before subscribing. Cleanup queries confirmed zero fixture users, shops, orders, and subscriptions.

Security advisors report public-role EXECUTE on the platform `public.rls_auto_enable()` event-trigger function and disabled leaked-password protection. Its definition was inspected; it returns `event_trigger` and enables RLS on newly created public tables. It was not altered. RLS-without-policy notices on service-only PINs/counters are intentional. Advisor review remains a rollout consideration; no plan upgrade was made.

## Tested environment and revision

Windows sandbox, workspace `YemEmUnnai`, Node 24.21.0, installed React/Vite/Supabase packages. Tests exercise the current working tree, not an untouched Git commit. Base commit: `971ef6a4081c6d49d6464a603de1fb88057dfd97`. A SHA-256 manifest of the relevant sources, migrations, and runners is saved at `.tmp/phase-2-manifest.json`; regenerate it if those files change.

The original pickup migration remains `20261002190000_everyday_pickup.sql`, followed by `20261003024121_phase_two_pickup_validation.sql` and the new alias correction. Apply all migrations in order for fresh installations. Do not rerun the legacy bootstrap after security migrations: it reinstates retired policies/functions.

## Local results

| Check | Status | Evidence and limits |
| --- | --- | --- |
| TypeScript | Passed | `tsc -b`, exit 0. |
| Production build | Passed | Vite build, exit 0. Existing mixed static/dynamic ErrorPage import warning remains. |
| Lint | Passed with warnings | oxlint exit 0; React effect/Fast Refresh and existing utility warnings remain. |
| Checkout/Auth handler | Passed | `scripts/test_pickup.mjs`: actual handler and transpiled checkout module; validation, actor spoofing, duplicate clicks, frozen replay, lost response, changed price, corrupt attempt storage, Auth outage classification, correlation header, and secret-free logging. Transport is mocked. |
| Daily-use persistence | Passed | `scripts/test_daily_use.mjs`: actual Saved module; remote deletions, guest merge, offline add/remove replay, reload, unrelated cross-device additions, identity races, token refresh, and blocked storage. Database transport is mocked. |
| Orders/help identity changes | Passed | Daily-use check runs the actual Orders hook and Support panel; delayed old-account responses cannot restore private order/help data or old admin state. React hooks and transport are stubbed. |
| Menu trust boundary | Passed | Daily-use check runs actual catalog creation; invalid prices/quantities do not reach writes, zero remaining stock is valid, and free walk-in items remain valid. |
| Staging runner failure/cleanup | Passed locally | Daily-use check runs the real runner against a local HTTP stub. Slow fixture creation finishes before cleanup; all created users receive cleanup attempts; incomplete cleanup produces a fatal result and no PASS. This does not prove database permissions or cleanup on Supabase. |
| Vendor PIN handler | Passed locally and on staging | Local validation/lockout checks; live incorrect PIN rejection, leading-zero PIN, correct owner identity, and single-use token. |
| SQL lifecycle/security | Passed on staging | `supabase/test_pickup.sql`, including buyer/vendor recovery and support listing regressions. Fixtures rolled back; verified no fixture rows remained. |
| Real API concurrency | Passed on staging | `scripts/test_pickup_integration.mjs`: actual Auth, deployed Edge Functions, REST, RLS, stock/duplicate/state races, payment, support, Saved, expiry, and cleanup. |
| Realtime | Passed on staging | Authorized vendor receives inserts before and after channel resubscription. This is not a physical network-loss/mobile test. |
| Browser journeys | Passed with mocked transport | Production build in real headless Chrome outside the restricted sandbox: Saved, checkout focus, single submission, four-digit pickup, Telugu, narrow viewport, reduced motion, refresh recovery, and vendor preparation/collection/payment. Artifact: `.tmp/pickup-browser-results/journeys.json`. |
| Live browser journey | Passed on staging | Real browser, Auth sessions, REST/Edge/Realtime: discovery, guest Saved, authoritative checkout, refresh, separate buyer/vendor sessions, preparation, ready/paid collection, help after collection, and changed-price reorder without automatic purchase. `.tmp/pickup-live-browser-results/journeys.json`; temporary shops, rows, and Auth users deleted and verified. Vendor session comes from the actual PIN endpoint before browser startup; manual PIN keypad input remains a device-review item. |
| Browser connection recovery | Passed for simulated fetch loss | Live browser blocks requests to staging while the server status changes, shows the order error warning, then restores requests and dispatches online. UI recovers Preparing. This does not simulate radio loss or physically test mobile connectivity. |
| Legacy records | Passed on staging | Rollback-only fixtures preserve ambiguous completed status, original total, null quantity/ownership, deny lifecycle changes, and prevent claiming via unverified phone. This does not replace a full historical migration rehearsal. |

The new browser runner serves the production build locally and injects mocked transport before application startup. It checks Saved, pickup checkout, the dialog focus handler, four-digit pickup, refresh, language persistence, narrow layout, reduced motion, and vendor preparation/collection/payment. Its synthetic Tab event does not replace a physical keyboard or screen-reader review. Run a build before this runner. Results go to `.tmp/pickup-browser-results/journeys.json`; browser failures also write a failing artifact.

## Implemented corrections

- Saved sync treats cloud rows as authoritative and applies per-item pending edits. It no longer restores bookmarks deleted on another device or deletes unrelated remote additions while retrying an offline edit.
- Local persistence failures show a warning in discovery and detail. No message claims bookmarks are durable when browser storage failed.
- Account changes immediately clear private cached data and invalidate in-flight order/help results. Support refetches after reconnecting, and repeated clicks share a synchronous action lock.
- Vendor menu creation validates whole prices/quantities at the shared API boundary. Order pricing matches checkout limits; zero-price walk-in items remain supported. Staging inspection confirmed the database price ceiling and shop-lock privilege; checkout SQL/API checks passed.
- Edge diagnostics record action, outcome, duration, generated request ID, and validated attempt ID. They omit Auth tokens, service keys, emails, PINs, and help-message contents. Logging failures cannot change purchase results. Auth service outages return an unavailable outcome rather than claiming the buyer is unauthorized.
- Staging checks wait for all fixture setup calls, enforce request timeouts, verify cleanup, cover concurrent first submissions and deterministic lifecycle orderings, check real anonymous signup and Saved ownership, and observe Cron expiry through REST without triggering expiry through the Edge order API. These real-service assertions passed.
- SQL checks include inactive/sold-out/walk-in availability, four-digit numbers, operating date, decline restoration, shop-first/admin support boundaries, and Saved ownership.
- Additive SQL alias correction fixes buyer/vendor listing, attempt recovery, and support listing. The expanded SQL runner exercises these paths on staging.
- The install offer now opens its modal only after an explicit action. Browser testing exposed that its automatic launch could steal checkout focus. The offer and sheet include English/Telugu strings; the browser runner makes installation available to cover this regression.

## Remaining release gates

| Gate | Status | What is needed |
| --- | --- | --- |
| Staging access/setup | Working | Correct project, Auth setup, functions, grants, and Cron inspected. |
| SQL assertions | Passed; historical upgrade rehearsal pending | Rollback-only assertions passed after alias fix. A representative legacy production copy still needs an upgrade rehearsal. |
| Real API concurrency and cleanup | Passed | Actual staging services and verified fixture cleanup. |
| Anonymous/email/PIN identity flows | Anonymous and PIN passed; email pending | Verified email inbox and cross-device recovery still required. |
| Realtime and autonomous expiry | API checks passed; device reconnect pending | Insert delivery before/after resubscription and Cron expiry verified. Physical offline/reconnect and fallback polling review remain. |
| Full browser journey | Mocked and live-staging browser passed | `scripts/test_pickup_browser_live.mjs` uses the shared browser server/profile runner without mocking Supabase. Vendor PIN is verified before browser startup; actual keypad/device review remains. |
| Accessibility/mobile/Telugu review | Pending | Physical keyboard, screen reader, actual mobile devices, and native-reader review of transactional copy. |
| Automated product/engineering/design review | Pending | Working gstack runtime; no automatic review is claimed complete. |
| Rollback rehearsal | Pending | Deployed staging frontend/Edge versions and named compatible rollback versions. |
| Pilot | Pending | Named shop/operator/support owner, passed staging gates, authorized production target, and actual operating days. |

## Tooling and commands

The Supabase CLI startup blocker is resolved: its documented `SUPABASE_TELEMETRY_DISABLED=1` environment setting avoids the inaccessible telemetry file. Installed CLI is 2.118.0. `db query --file ... --project-ref ... --linked` can use the Management API, so psql/Docker are not required for that route. Query/deploy still require scoped management access and an explicit staging project.

The current sandbox has no usable Docker CLI or psql. MCP provides SQL access; reviewed execution outside the restricted sandbox provides Management API/network and Chrome access. Existing `.env.local` was not changed to staging and was not used for fixture mutations.

Local commands:

```sh
npm run test:pickup
npm run test:daily-use
node supabase/test_vendor_pin.mjs
npm run build
npm run lint
npm run test:pickup:browser
npm run test:pickup:browser:live
```

If the local Node/npm shim fails, use the installed Node executable directly with each script, `node_modules/typescript/bin/tsc -b`, `node_modules/vite/bin/vite.js build`, and `node_modules/oxlint/bin/oxlint`.

For staging, supply `PICKUP_RUN_STAGING=1`, `PICKUP_STAGING_URL`, `PICKUP_STAGING_PUBLIC_KEY`, and `PICKUP_STAGING_SECRET_KEY`, then run `npm run test:pickup:integration`. A Node `--env-file=.env.staging.local` invocation is also supported for an ignored local secrets file. Keep management and service credentials outside frontend `VITE_*` variables.

The live browser runner uses the same staging variables and restricts its target to `uqeacuhensqtdcunwzni`. It creates an isolated build in `.tmp/pickup-live-dist` with only public frontend credentials; it does not overwrite `.env.local` or `dist`. Privileged keys stay in the Node process. Only temporary buyer/vendor sessions reach the isolated browser profile. Overall PASS is printed after fixture cleanup checks; failing journeys still attempt all cleanup operations.

Use staging project `uqeacuhensqtdcunwzni`; no project creation or plan upgrade is needed. It already contains the schema, active functions, and catalog rows. Do not initialize bootstrap again. Do not mutate the app's existing production project as a substitute.

Use [the shop checklist](pilot-shop-checklist.md) and [read-only pilot queries](../supabase/pilot_checks.sql) when the release gates pass. The checklist covers opening, fulfilment, payment, support, incident handling, and a compatible rollback. It is prepared, not rehearsed.

References: [CLI telemetry controls](https://supabase.com/docs/guides/local-development/cli/getting-started), [management access tokens](https://supabase.com/docs/guides/platform/personal-access-tokens), [anonymous authentication](https://supabase.com/docs/guides/auth/auth-anonymous), and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
