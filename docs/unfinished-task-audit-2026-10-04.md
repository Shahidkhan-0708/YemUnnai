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

## Production tasks that remain blocked

Read-only access recheck on this date:

- Both environment and ignored-file management tokens: `403 database_read`.
- Auth management configuration: `403 auth_config_read`.
- Production `/functions/v1/pickup`: `404`.
- Public Auth settings: email and signup enabled, anonymous signup disabled.

Consequently live checkout deployment/database verification, production email
delivery configuration and real buyer-to-seller order progression are incomplete.
Prepared backend migration/function code exists under `supabase/`; bypassing
permissions or claiming a successful live order would not finish those tasks.

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
