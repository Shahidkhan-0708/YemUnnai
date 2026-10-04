# Profile and discovery fixes — 2026-10-04

The email flow previously attempted anonymous sign-in before registering a fresh
visitor. Production anonymous sign-in is disabled. New visitors now request an
email signup directly; existing guest sessions still link email to the same
identity, and existing-account sign-in never silently creates a different account.
Requests share a lock across forms, successful sends and rate-limit responses
start a one-minute cooldown, and known Auth errors give a specific next step.
The profile offers the create/keep-account action after an existing-account lookup
fails. The same helper protects the Orders account form.

Public Auth settings confirm email is enabled and account signup is enabled.
Reading production mail configuration with the available management token still
returns HTTP 403, `Missing required permission(s): auth_config_read`. SMTP delivery
configuration and delivery to the screenshot's address cannot be verified or
repaired with that credential. No real verification email was sent in testing.

The production catalog contained 45 food items and all 45 had `is_vegetarian`
unset. This is why Pure veg returned no dishes. Seller Menu & stock now provides
Veg, Non-veg, and Not set buttons for every item and a Not labelled filter.
Selections save immediately, target both food and vendor IDs, preserve stock
quantity, and show the confirmed classification. Failed writes retain the prior
label. Customer Pure veg continues to include only explicitly vegetarian items;
an empty filter explains that seller-confirmed labels are required. No production
food was classified from a photograph or unverified ingredient assumptions.

Canteen labels now use identical color, size, weight, and line height on both
lines. Controlled Chrome tests cover automatic diet saves, duplicate clicks,
ownership filters, failed writes, unknown labels, and customer filter updates.
The 72 filter-combination regression checks also pass.

The separately authorized 200-session browsing test blocks all analytics requests
and all non-read HTTP methods. It uses isolated browser storage and varied routes
across five viewport widths, with eight sessions at a time. These are simulated
sessions, not 200 real people or a 200-concurrent-user capacity claim.
