Google Analytics is available in Admin → Google Analytics. The production GA4 Property ID is `557267368`; the website measurement ID is `G-JCXFNM71JQ`.

The view reads historical and real-time reports directly from Google's Data API using the read-only Analytics scope. Access requires the existing permanent admin account and a fresh `app_admins` membership check before every request. Google credentials and OAuth tokens stay on the server. Database activity on Overview remains a separate source; it is never presented as Google Analytics history.

To connect the property:

1. In [Google Cloud](https://console.cloud.google.com/), select or create a project and enable **Google Analytics Data API**.
2. In IAM & Admin → Service Accounts, create a service account. A project administrator role is not needed for reading Analytics reports.
3. Open the service account → Keys → Add key → Create new key → JSON. Save the downloaded JSON as `supabase/google-analytics-credentials.local` in this workspace. This file is ignored by Git. Never paste its contents into chat or put it in a frontend environment variable.
4. Copy `client_email` from that file. In [Google Analytics](https://analytics.google.com/) → Admin → Property access management for property `557267368`, add that email as a **Viewer**.
5. Run `node scripts/configure_google_analytics.mjs 557267368`. It writes `.tmp/google-analytics-secrets.local` without printing the key.
6. Run `supabase secrets set --project-ref hdwpaxgbdrmezwkwumwk --env-file .tmp/google-analytics-secrets.local`. This sets server-only `GA_PROPERTY_ID` and `GA_SERVICE_ACCOUNT_JSON`.
7. Refresh the Google Analytics tab. It explicitly shows a connection/access error until Google's API accepts the account.

Reports include visitors, visits, first-time and active visitors, page views, engagement, key actions, purchases/revenue, daily trends, traffic channels, sources, landing pages, page titles, events, dishes/businesses, searches, visitor type, countries/cities, devices, browsers/operating systems, and campaigns. Date filters cover 7/30/90/365 days, all available GA4 history since 2020, and custom dates. Current period totals come from Google aggregate reports rather than sums of daily users. The previous period uses the same duration; unavailable pre-GA4 comparisons are omitted. The real-time card uses Google's last-30-minute active-user total.

Breakdowns load 250 rows per page, with explicit row counts and Load more. CSV downloads include the loaded rows with spreadsheet formula-like text escaped. Daily CSV includes the full returned daily series; long charts group additive page views by month. Cached results are reused for up to 60 seconds within one Edge instance, including real-time counts; the displayed update timestamp identifies their age. Incompatible optional reports and unavailable real-time data do not erase other reports.

Google processing delays, privacy thresholds, sampling, retention, blocked tracking and previously uncollected data still apply. Custom Explore layouts, user-level raw exports, Google Ads/AdSense account administration and BigQuery tables are not replicated. Open full Analytics links to Google's property for those surfaces. Google purchases/revenue reflect recorded events rather than verified counter payments. These are website reports; they do not assert whether a particular restaurant actually received payment.

The tag skips admin pages, localhost and `testTraffic=1`. Automatic first-page views are disabled because app navigation sends its own page views. If browser-history Enhanced Measurement is enabled in Google, disable its history-change page views to avoid extra counts on URL changes. This does not alter past Google history.

Checks: `node scripts/test_google_analytics.mjs`, `node scripts/test_admin.mjs`, `npm run build`, `node scripts/test_admin_browser.mjs`. Google backend tests use generated local RSA keys and mocked API responses; they do not generate traffic in the real property. Real Google counts must be verified after the service-account key is connected.

References: [Google API quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart), [dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema), [page-view measurement](https://developers.google.com/analytics/devguides/collection/ga4/views).
