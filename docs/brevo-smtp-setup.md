# Brevo sign-in email setup

Production ordering uses the deployed `pickup` function and guest Auth. Email
account recovery needs a verified Brevo sender and SMTP credentials. The Supabase
access token is not a Brevo SMTP key.

Add these values to the ignored `.env.staging.local` file, preserving existing
entries. Do not commit this file or put these values in any `VITE_*` variable:

```dotenv
BREVO_SMTP_LOGIN=
BREVO_SMTP_KEY=
BREVO_SENDER_EMAIL=
# Optional: an inbox you own for one real sign-in email test.
BREVO_TEST_EMAIL=
# Optional: hourly email limit, within the Brevo account's quota. Default: 60.
BREVO_EMAILS_PER_HOUR=60
```

Use the SMTP login and a generated SMTP key from Brevo's SMTP & API settings,
plus an address verified under Senders. The setup uses `smtp-relay.brevo.com`,
port `587`, and sender name `YEMUNNAI`.
[Brevo SMTP instructions](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).

Preview, then apply using the existing authenticated Supabase CLI:

```sh
node scripts/configure_brevo_smtp.mjs
node scripts/configure_brevo_smtp.mjs --apply
```

The script changes only SMTP and the hourly email limit. It preserves redirects,
guest Auth, confirmation requirements and other remote settings. The SMTP key
stays in the child process environment and is redacted from command output.
Missing credentials stop setup before any production changes.

After setup, request a sign-in link for the approved test inbox, check delivery,
open the link and verify that the buyer account and saved items persist. Confirm
the Brevo account's daily quota before allowing a launch with 1,000 email signups.
Do not describe a configuration push as verified inbox delivery.
