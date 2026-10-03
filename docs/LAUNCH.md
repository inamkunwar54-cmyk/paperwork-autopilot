# Launching Paperwork Autopilot

Everything in the spec is built: upload → extract → confirm → dashboard, money-leak flags, message drafts, reminder emails, privacy note, delete-all, Free + Pro billing, and draft legal pages.

## What only you can do

1. **GitHub:** create an empty private repo, connect GitHub at claude.ai/connect-github, and tell Claude the repo name.
2. **Supabase:** create a project. In the SQL editor, run `supabase/migrations/0001_init.sql` then `0002_billing.sql`. Under Authentication → URL configuration, add `https://<your site>/auth/confirm` as a redirect URL.
3. **Anthropic:** create an API key at console.anthropic.com, add a payment method, and set a monthly spend limit.
4. **Stripe:** create an account and a "Pro" product at $5/month. Add the webhook and turn on the customer portal (see "Payments" in the README). Complete business and bank details to get paid.
5. **Resend:** verify your domain and create an API key (see "Reminder emails" in the README).
6. **Vercel:** import the GitHub repo and add the environment variables from `.env.example`, using your real values, then deploy.
7. **Legal:** fill in the `[placeholders]` on the Privacy Policy and Terms pages.

Never paste secret keys (Supabase service role, Anthropic, Stripe, Resend) into chat. Put them straight into Vercel.

## What Claude does after that

- Pushes the code once the repo exists.
- Helps fill in the legal placeholders and Vercel settings.
- Checks the live site end to end with a real document, a Stripe test payment and a reminder email.

## Worth knowing

- **AI cost:** a few cents per document. This is an estimate from model pricing, not a measurement. Free users are capped at 5 a month; Pro is unlimited, so watch your Anthropic spend limit.
- **Reminder timing:** the job runs once a day at 13:00 UTC and uses UTC dates, so reminders can land a few hours early or late in far-off time zones.
- **Deleting data** keeps the login, the monthly usage count and any Pro subscription. Users cancel Pro under Manage billing; full account deletion is by email request, as the Privacy Policy says.
