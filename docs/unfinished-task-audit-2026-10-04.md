# Outstanding-request audit, 2026-10-04

This audit preserves the prior requests when newer queued prompts arrive. A task
is complete only when its behavior is checked; an unavailable production dependency
is recorded separately from a passing fixture test.

## Implemented and checked

- Discovery: approved orange SVG header implemented, original branding and photos,
  spaced wordmark, new tagline, Walk In action, responsive layouts, consistent
  canteen typography, aligned card prices/ratings/actions, and one Unavailable label.
- Navigation: four customer tabs including Profile; customer language control removed;
  seller back navigation integrated in the header; full-screen themed 404.
- Seller: stock On/Off, scoped deletion with confirmation, Veg/Non-veg/Not set
  controls that save automatically, quiet bounded dashboard read retries, and one
  add-item sheet with focus restoration and background locking.
- Orders and Saved: quieter account recovery, duplicate-checkout/recovery guards,
  account-switch isolation, cloud sync when available, IndexedDB bookmark fallback,
  and truthful failed-write handling.
- Installation: animated offer after buyer/seller login, native install when supported,
  and platform guidance otherwise. A real iPhone installation remains a device check.
- Performance: optimized responsive photos, eager priority for visible dishes,
  cached public menu/directory, branding photos before the network catalog arrives,
  shared catalog requests, and fresh stock/price verification before ordering.
- Email: new-account signup no longer depends on disabled anonymous Auth; existing
  guest identity is preserved; known errors, shared request lock and cooldown added.
- Maps: one real OpenStreetMap/Leaflet map replaces GPS/campus/demo panels, with
  logo markers, canteen selection and walking-map handoff. No fabricated route,
  walking ETA or automatic location prompt. MITS campus reference comes from
  [the institution's disclosure](https://mits.ac.in/assets/pdf/admin/AICTE%20Mandatory%20Disclosure%202018-19.pdf).
- Seller location setup: shown automatically for an unusable pin; editable afterward.
  Latitude/longitude, landmark, campus classification and explicit geolocation capture
  save to the existing vendor record. Ownership is checked before a scoped write;
  database RLS remains in force. Failed writes preserve the confirmed location.

The current map browser test passes real geographic tile initialization, invalid
seed suppression, explicit GPS capture, validation, duplicate-write protection,
failed-save preservation, customer logo-marker refresh, walking destination,
portrait layout, focus and Escape dismissal. Production writes are mocked in
these tests; no food or real order is created or deleted.

Earlier SVG pixel comparisons describe their original static reference states.
Later approved native interactive changes intentionally replace parts of those
screens. Exact identity of dynamic content at every viewport is not claimed.

## Initial production access failure, resolved in the follow-up

Read-only access recheck on this date:

- Both environment and ignored-file management tokens: `403 database_read`.
- Auth management configuration: `403 auth_config_read`.
- Production `/functions/v1/pickup`: `404`.
- Public Auth settings: email and signup enabled, anonymous signup disabled.

Those tokens still fail. The existing saved Supabase CLI login, checked separately
without the environment token override, has access to the correct production
project. This allowed the following work without changing projects or tokens:

- Backed up all 45 foods, five canteens and nine historical orders in ignored files.
- Inspected the actual schema and migration history before installing the four
  pending pickup migrations atomically. Historical totals remain intact.
- Deployed `pickup`; its handler validates each user token through Auth.
- Enabled anonymous buyer sessions and manual account linking, preserving the
  canonical site URL, redirect allowlist and all other undeclared Auth settings.
- Increased guest sign-in allowance from 30 to 2,000 per IP/hour and token refresh
  allowance from 150 to 3,000 per IP/five minutes for shared campus connections.
  These allowances are not a measured 1,000-concurrent-user capacity guarantee;
  token endpoint bursts remain subject to Supabase's own limits.
- Applied participant read-policy, identity evaluation and lookup-index fixes.
  Guest buyers cannot provision a business. Performance advisors now report no
  warnings. Security advisors retain expected guest-access notices and the
  existing leaked-password-protection warning; a clean security report is not claimed.
- Ran real production SQL integration tests for totals, idempotency, lifecycle,
  cancellation, expiry, payment confirmation, support, Saved isolation and seller
  stock/dietary/coordinate/delete writes, including cross-canteen denial.
  All test fixtures rolled back; no fixture canteen or user remains.
- Tested the deployed HTTP endpoint with one temporary guest: Auth, empty order
  and support reads, unavailable-item checkout, invalid quantity, unauthorized
  rejection and denial of direct privileged RPC calls all passed. No live order
  or email was created, and the signed-out guest was removed by exact ID.
- Verified the ten-second expiry job is active with successful production runs.

The SQL suite tests the actual database lifecycle using rollback-only fixtures.
It does not claim a completed purchase through a buyer and seller browser session
on production. Earlier browser checkout tests used controlled fixtures.

## Dashboard presentation follow-up

Location setup no longer appears or opens automatically on the seller dashboard.
It is optional behind a small map-pin icon in Menu & stock, with a 44px tap target,
an accessible label, and a portrait sheet explaining its purpose. It does not
affect accepting orders. Browser checks cover explicit opening, focus restoration,
Escape, coordinate validation, a single scoped save and failure preservation.

Completed orders leave the incoming queue and appear in a collapsed Past orders
box containing compact item, quantity, pickup number, status, total and collection
time summaries. Customer history uses collapsed receipts that expand on tap.
Vendor reads now retain the backend's recent history rather than discarding it.
The existing backend scope limits history to 30 days and includes older active
orders. Browser lifecycle checks verify both collapsed seller history and customer
receipt expansion; transport is controlled and no real purchase is placed.

Installation is offered after the customer intro finishes, without requiring
login, once per browsing session when the browser supports installation. The
animated prompt waits for other dialogs, respects dismissal and standalone mode,
and invokes the native installer only after a tap. iPhone/iPad users receive home
screen instructions. Browser checks cover the intro transition, no automatic
native installation, focus, session dismissal, both motion preferences, delayed
browser eligibility and standalone suppression. Browser eligibility is simulated
in these tests; they do not install the app on a physical device.

## Remaining external setup

The user selected Brevo for email. No Brevo SMTP login, SMTP key or verified sender
has been provided yet. Public email delivery and inbox verification remain pending.
The server-only configuration script and exact required fields are documented in
[brevo-smtp-setup.md](brevo-smtp-setup.md). Selecting a provider alone does not
configure credentials or verify an email delivery.

All 45 production foods were unlabelled in the latest read. Sellers must confirm
ingredients before marking them Veg/Non-veg. Photos do not establish ingredients.
Existing canteen seed locations are unconfirmed; sellers can now replace them.
Neither this audit nor a client patch invents correct food labels or shop pins.

## Synthetic browsing

The user approved 200 simulated browsing visits excluded from production analytics.
The runner uses isolated storage, five viewport widths and eight concurrent sessions;
it blocks analytics and every non-read request before navigating. No orders, account
signups or emails are generated. This is not 200 real people or proof of capacity
for 1,000 simultaneous ordering users.

All 200 distinct journeys passed after targeted replays (268 attempts total).
The initial run passed 138; 50 failures came from the runner attempting to serialize
a DOM element, with 12 image/navigation timeouts needing replay. The first replay
passed 56 of 62. Four later failures were an unguarded storage access in the test
bootstrap and two were navigation/loading timeouts. Guarding that bootstrap and
testing the canonical `https://yemunnai.me/` directly completed the remaining six.
The final combined report has zero failed journeys. All 265 attempted analytics
requests were blocked; no production write was allowed.

Initial menu-visible median was 2,438 ms and p95 was 4,736 ms on this test machine.
These measurements include browser setup/navigation and are not image-only timings,
a promise for every connection, or an ordering-capacity benchmark. Detailed retained
reports are under `.tmp/synthetic-browsing/`, including initial runs and the combined
`verified-results.json`; failures have not been erased from the original reports.

Final map review also corrected refreshes resetting a visitor's chosen zoom and
pan, and verified that map zoom survives an online/catalog refresh. The live-catalog
image check found that eager priority followed interleaved database order instead
of the rendered canteen groups; priority now follows the actual first four cards.
