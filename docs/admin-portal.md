Admin portal: https://yemunnai.me/?portal=admin

Access uses a permanent email/password account and the existing `app_admins` membership. The browser has no privileged key. The Edge Function validates Auth and membership on every request; revoking membership immediately prevents subsequent actions.

After the owner designates an email, run `node --env-file=supabase/.env.server.local supabase/provision_admin.mjs EMAIL`. New account credentials are written only to ignored `supabase/admin-credentials.local`; existing passwords are preserved. Seller PIN accounts cannot become administrators. Never commit credentials.

Businesses can be created with their own seller PIN and account, renamed, given uploaded logos and real coordinates, taken offline, archived and restored. Archiving removes the business from discovery and disables seller writes without deleting past orders. Active pickup orders must be handled before archiving. New businesses appear automatically in the seller directory.

Menus support names, photos, original sections, cooked/packed tabs, descriptions, null prices, price variants, diet and stock on/off. Existing items cannot move to another restaurant. Deleting food preserves order snapshots.

Analytics uses real database orders, reactions, reviews and app activity recorded after this release. Localhost and `testTraffic=1` visits are excluded. Previous GA history is separate. Traffic is measured in app sessions. The dashboard shows the latest 500 orders, 200 help requests and 200 sanitized error reports; all-time order totals remain exact. Admin changes are recorded separately. Errors cover reported JavaScript/render, menu/storage/database and pickup service failures; reports cannot be received from offline or blocked browsers.

Validation: `node scripts/test_admin.mjs`, build then `node scripts/test_admin_browser.mjs`. Live API verification requires `ADMIN_TEST_LIVE=1` and ignored public/server env files: `node --env-file=supabase/.env.server.local --env-file=.env.local scripts/test_admin_integration.mjs`. Live tests remove every fixture. `supabase/test_admin_access.sql` must run inside BEGIN/ROLLBACK.

Security advisors: no errors were reported. Existing anonymous public-read/guest-order policies and disabled leaked-password protection produce warnings; the private admin tables have RLS and no public read/write grants.
