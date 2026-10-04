# Phase 2: validation and a one-shop pilot

Status: implementation started on 2026-10-03. Local checks, staging SQL/API/PIN/Realtime/Cron/legacy-record checks, and mocked/live browser journeys passed. Email recovery, physical device/accessibility reviews, historical upgrade/rollback rehearsal, and the pilot remain pending. See [verification results](phase-2-verification.md).

## Outcome and scope

Prove that a buyer can discover food, submit one purchase, recover it, track preparation, collect it, and get help, while the shop can safely manage availability and fulfil orders. Start with one shop and expand only after the evidence below passes.

Keep React/Vite, Supabase, vendor PIN authentication, single-item checkout, pickup, and cash or counter UPI payment. Reuse the Phase 1 implementation and test runners. Fix failures at their shared source; add tests for uncovered money, ownership, persistence, or lifecycle branches. No new backend or UI library is needed.

Phase 2 does not include push notifications, a multi-item cart, delivery, group ordering, scheduling, loyalty, or online payments. Reconsider those after pilot feedback.

## Starting evidence

The previous session passed TypeScript, the production build, pickup handler/client checks, and vendor PIN handler checks. Lint had warnings but no errors. Those results are recorded in [the release notes](everyday-pickup-release.md); rerun them against the final Phase 2 revision.

The migration and Edge Function have not been deployed in this session. Database integration, real concurrency, live authentication, browser journeys, and autonomous expiry remain unverified. Existing browser checks use mocked transport and cannot substitute for staging checks.

Previous environment blockers were Supabase CLI telemetry permissions, no Docker or psql, no staging credentials, blocked package-registry access, and a Chrome debugger timeout. Treat these as unresolved prerequisites, rather than failed application assertions or passing tests.

## Execution order

### 1. Establish a repeatable verification environment

- Recheck the workspace and preserve existing unrelated changes. Record the tested revision or a patch snapshot, migration version, application URL, and environment in a verification report.
- Prefer an isolated Supabase staging project for Auth, database, Edge Functions, Realtime, and Cron. A disposable local Supabase instance is acceptable for database checks, but live email and deployment configuration still need staging coverage.
- Confirm the explicit staging target before running fixture mutations. Supply staging secrets through environment variables or the normal secret store; never put them into frontend variables, source files, or test output.
- Diagnose CLI and Chrome launch failures once and use a working supported environment if this sandbox cannot run them. Keep temporary Chrome profiles outside watched source, or retain the existing Vite exclusion.
- Audit the existing runners before trusting them: role permissions, fixture creation, assertions, cleanup, timeouts, and nonzero exit on failure. Cleanup failure must not produce an overall passing result. Do not broaden production grants just to make fixtures work.

Files: `scripts/test_pickup.mjs`, `scripts/test_pickup_integration.mjs`, `scripts/test_pickup_browser.mjs`, `supabase/test_pickup.sql`, `supabase/config.toml`, and `vite.config.ts`.

Pass condition: one documented command set runs against an explicit nonproduction target, reports skipped checks as pending, and leaves no fixture users, orders, or shops behind.

### 2. Verify money, ownership, stock, and state transitions

Apply the additive migration to staging, deploy `pickup`, and verify its Auth configuration. Use a disposable database containing representative historical orders to check migration compatibility; do not copy unnecessary personal data.

Run the existing transactional SQL and staging concurrency checks. Extend only the missing checks, including forced execution of both outcomes of each race where possible.

| Area | Required evidence |
| --- | --- |
| Authoritative amounts | Quantity, unit price, and total agree; altered browser totals cannot affect the amount. Changed price requires another confirmation. Historical totals remain unchanged. |
| Duplicate prevention | Concurrent requests using one buyer/attempt create one row, one reservation, and one pickup number. Lost-response replay returns that row even when the replay payload differs. |
| Availability | Offline/inactive shops, sold-out items, walk-in-only items, and insufficient quantities reject creation without consuming stock or a purchase. |
| Last portion | Two buyers racing for one tracked portion produce one order; stock never becomes negative. |
| Ownership | Test both direct REST/RPC and Edge access: buyers cannot read or mutate another buyer's records; vendors cannot operate another shop; public clients cannot call privileged functions or write orders directly. |
| Lifecycle | Only allowed transitions succeed. Preparing, Ready, and Collected remain separate. Collection requires payment confirmation. Collected and legacy records cannot be cancelled or reinterpreted. |
| Cancellation and expiry | Cancel/accept, cancel/collect, and expiry/accept races leave one coherent outcome. Decline/cancellation/expiry restore reserved stock exactly once. |
| Deadline | A pending order expires without any buyer or vendor page open. Verify the scheduled job actually runs, then verify acceptance after the deadline cannot revive it. |
| Pickup numbers | Numbers are unique per shop/date, accept values above 999, and use the intended operating date at midnight. |
| Help and Saved | Buyer/shop/admin access is correctly scoped. Only authorized admins handle escalated requests. One account cannot read or change another account's bookmarks. |

Files: `supabase/migrations/20261002190000_everyday_pickup.sql`, `supabase/functions/pickup/handler.mjs`, the SQL check, and the staging runner.

Pass condition: all deterministic database assertions pass; simultaneous requests and forced race orderings produce no duplicate purchase, unauthorized access, overselling, double restoration, or contradictory terminal states. Record commands and results. Run a targeted check again whenever its implementation changes.

### 3. Verify live identity, recovery, and daily-use persistence

- Anonymous signup creates a usable buyer session without a phone number or delivery address. Auth failures have a useful retry state.
- Link and verify a guest email; confirm the buyer ID and existing orders survive. On another device, login recovers that account's orders and bookmarks.
- Sign into an existing account and verify that unrelated guest orders are not claimed. Historical phone numbers must not grant ownership.
- Switch between buyer and vendor roles, refresh, and open another tab. Verify both sessions remain separate and records are scoped to the current identity.
- Test refresh during checkout and a response lost after commit. Recover the frozen attempt before another purchase. Test blocked/corrupt browser storage and the supported-browser behavior when Web Locks are absent.
- Save and unsave from every entry point. Verify guest persistence, login merge, removal after sync, offline edits, retry, account switching, and another device. Fix silent persistence failures if testing exposes them.
- Reorder an old purchase after price, quantity, availability, or shop status changes. Checkout must show current information and require confirmation.
- Test Realtime delivery, disconnected channels, visible-screen polling, tab visibility changes, and network reconnection. Stale data must be identified and fresh data must replace it.

Files: `src/lib/pickup.ts`, `src/lib/supabase.ts`, `src/lib/saved.ts`, `src/lib/hooks.ts`, `src/components/OrdersScreen.tsx`, and `src/App.tsx`.

Pass condition: a genuine staging Auth session recovers the correct records across refresh and devices; changing identity never exposes the previous account's data; updates arrive or recover through polling/refetch. Mocked Auth alone does not satisfy this milestone.

### 4. Verify complete buyer and vendor journeys

First get the existing mocked browser runner working. Then exercise the same important journeys against staging with real Auth and Edge requests; retain manual physical-device checks where automation cannot prove the result.

| Journey | Required outcome |
| --- | --- |
| Buyer purchase | Discover/filter, inspect food, choose quantity, review shop/location/amount/payment, confirm once, refresh, track preparation, see Ready, and collect. |
| Vendor fulfilment | PIN login, online/stock controls, incoming order, optional preparation estimate, Mark ready, cash or counter UPI selection, and Confirm collection. Buyer state agrees. |
| Buyer recovery | Failed catalog fetch, offline checkout, uncertain result, retry, and reconnect all give a usable next action without a new duplicate attempt. |
| Cancellation | Pending cancellation is immediate; accepted cancellation needs approval/rejection; collection cannot bypass an unresolved request. |
| Help | Buyer submits order-linked help, shop replies, unresolved request escalates, authenticated admin resolves; help still works after collection. |
| Return visit | Saved, history, reorder, filters, and persistent English/Telugu selection behave consistently. Launch interruptions do not repeat. |

Check loading, empty, error, retry, and success states on critical screens. Test keyboard-only checkout and collection, dialog focus trapping and restoration, visible labels, screen-reader status announcements, 320px layouts, long Telugu sentences, adequate touch targets, and reduced motion. Have a Telugu reader review critical transactional copy.

Files: buyer/vendor screens and existing shared modal/button helpers. Reuse native controls; correct identified accessibility and copy gaps without replacing the visual system.

Pass condition: both complete journeys pass with real staging services, along with the failure paths above. No known blocker prevents a supported buyer or vendor from completing or recovering a purchase.

### 5. Prepare shop operations and release evidence

- Finish product, engineering, and design reviews with the gstack tooling when available. Record unavailable reviews as pending. Include Supabase security guidance and accessibility/writing guidance in fixes.
- Create `docs/phase-2-verification.md` recording each check as passed, failed, or pending, with environment, revision, and evidence. Do not equate a build pass with functional validation.
- Provide a short shop checklist: opening/closing availability, accurate dietary/stock data, accepting within three minutes, estimating preparation, marking Ready, confirming collection/payment, and handling cancellation/help.
- Assign a shop operator and an app-support/admin owner for the pilot. Define who handles overdue orders and escalated requests before buyers use it.
- Use existing database timestamps and support records to inspect overdue Pending orders and unresolved help. If checkout failures or duplicate attempts need additional visibility, add minimal structured diagnostics with action, outcome, and correlation ID; omit tokens, email, PIN, and help-message contents. Do not add a separate analytics service by default.
- Verify a deployment rollback procedure in staging. If a release fails, stop new checkout and put the shop offline, preserve existing order access, and restore a compatible frontend/Edge version. Do not reverse additive tables or revert to the old unrestricted checkout path.

Pass condition: the verification report has no unresolved release gate; operators can complete the checklist; the deployed configuration and rollback procedure have been tested in staging.

### 6. Run a controlled pilot, then decide on expansion

Deploy only after the prior gates pass and the production target is explicitly authorized. Staging readiness is not permission to deploy to an unidentified production project.

Default pilot: one participating shop over seven operating days, with a recommended minimum of thirty real orders before deciding on wider rollout. These are proposed evaluation defaults, not evidence already collected. Extend the pilot if volume is too low to assess normal and busy periods. Artificial fixtures do not count as real orders.

Review daily: checkout failures, uncertain attempts, confirmed duplicates, overdue Pending orders, stock discrepancies, payment/status discrepancies, and unanswered or escalated help. Record the number of checkout attempts alongside failures so counts have context. Distinguish rejected unavailable items from service failures.

Stop new orders and investigate any cross-account exposure, duplicate charge/purchase, overselling from a race, contradictory collected/cancelled state, or inability to recover a confirmed order. Preserve the records needed to resolve existing purchases.

Pass condition for wider rollout:

- No unresolved money, ownership, stock, or lifecycle defect.
- Buyers and shop operators complete the critical journeys on their actual devices.
- No unexplained overdue order, stock discrepancy, or lost confirmed order remains.
- Each help request has a responsible owner, and escalations are handled.
- Any checkout failure pattern has a documented fix or understood recovery; repeat failures do not block ordinary use.
- Final build, targeted regressions, browser checks, and required reviews pass for the release revision.

## Deliverables and dependencies

Deliverables: targeted fixes, trustworthy existing test runners, staging verification evidence, a shop checklist, a tested deployment/rollback procedure, and a pilot report with a rollout decision.

External dependencies: a working test environment, an isolated Supabase project with appropriate credentials, a test email inbox, two buyer/device sessions and two vendor accounts, physical-device and Telugu review, and a participating pilot shop with an assigned support owner. Their absence blocks the relevant gate, not independent local work.

No Phase 2 feature expansion is required to begin this plan. Start implementation at milestone 1; prioritize the database and recovery gates before interface polish. Implementation and deployment remain distinct steps.
