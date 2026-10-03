# Paperwork Autopilot

Helps households stay on top of bills, renewals and official letters. Snap a photo, upload a PDF or paste an email; Claude extracts the details, you confirm them, and they land on a calm dashboard.

The database schema is in `supabase/migrations/`.

## Run it

1. Create a Supabase project (or run one locally with `npx supabase start`, which needs Docker).
2. Apply the schema: paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor, or run `npx supabase db push`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and `ANTHROPIC_API_KEY`.
4. `npm install`, then `npm run dev` and open http://localhost:3000.

In Supabase → Authentication → URL configuration, add `<your site>/auth/confirm` as a redirect URL so the sign-up confirmation email works.

## Payments (Free + Pro)

Free accounts get 5 AI-read documents a month; Pro is unlimited. Billing runs on Stripe.

1. In Stripe, create a product "Pro" with a recurring monthly price. Put its id in `STRIPE_PRO_PRICE_ID`. If you change the price, update `PRO_PRICE_LABEL` in `src/lib/plans.ts`.
2. Add a webhook endpoint `<your site>/api/stripe/webhook` with the events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Turn on the customer portal (Stripe → Settings → Billing → Customer portal) so users can change cards and cancel.
4. Apply `supabase/migrations/0002_billing.sql` and set `SUPABASE_SERVICE_ROLE_KEY` (server only).

## Reminder emails

A daily job (`vercel.json` → `/api/cron/reminders`, 13:00 UTC) emails each open item 7 days and 1 day before its due date, through Resend. Each reminder is sent once per due date; if sending fails, the next day's run retries.

1. In Resend, verify your domain and create an API key. Set `RESEND_API_KEY` and `REMINDER_FROM_EMAIL`.
2. Set `CRON_SECRET` to a long random string. Vercel adds it to the cron request automatically.
3. Optional but recommended: in Supabase → Authentication → SMTP, use Resend's SMTP details so sign-up emails aren't rate-limited.

To use a different provider, replace `sendEmail` in `src/lib/reminders.ts`.

## Legal pages

Draft Privacy Policy (`/legal/privacy`) and Terms of Service (`/legal/terms`) are included. Replace every `[placeholder]` (company name, address, contact email, governing law, date) before launch, and have a lawyer review them if you can.

## Checks

```
npm run lint
npm run build
```

## Notes

- The Anthropic key is only read on the server (`src/lib/ai.ts`); nothing with `NEXT_PUBLIC_` touches it.
- Extraction uses `claude-opus-5-5` with structured JSON output, and the result is validated again with Zod before it is saved.
- Server-side refusal fallback (`fallbacks: "default"`) is on, so a rare safety decline is retried on another model instead of failing.
- Phone photos are shrunk in the browser before upload, so uploads stay quick on mobile data.
