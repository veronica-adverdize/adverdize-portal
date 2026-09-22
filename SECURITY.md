# Security Checklist

Before going live with real clients, verify all items below.

## Airwallex
- [ ] API keys are in server-side env vars only (never NEXT_PUBLIC_)
- [ ] Subscription pricing is determined server-side from price_id lookup
- [ ] Webhook signatures are verified before processing
- [ ] Webhook events are deduplicated via webhook_events table
- [ ] Subscriptions are activated via webhook, not redirect URL

## Supabase
- [ ] RLS enabled on all tables
- [ ] service_role key is never exposed client-side
- [ ] Each client can only access their own organisation's data
- [ ] Admin operations are enforced server-side

## Application
- [ ] All API routes check authentication
- [ ] Users cannot modify organisation_id in requests
- [ ] Client A cannot access Client B's invoices, subscriptions, or reports
- [ ] No secrets in git repository
- [ ] Rate limiting on sensitive endpoints (auth, checkout)

## Deployment
- [ ] HTTPS enforced
- [ ] Environment variables set in Vercel (not in code)
- [ ] Supabase auth email confirmation enabled
