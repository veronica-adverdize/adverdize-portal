# Adverdize Client Portal

A client portal for Adverdize built with Next.js, Supabase, and Airwallex Billing.

## Stack

- **Next.js 15** — frontend + API routes
- **Supabase** — auth, database (with RLS), storage
- **Airwallex Hosted Billing Checkout** — subscriptions, invoices, payment methods
- **Tailwind CSS** — styling
- **Vercel** — deployment

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd adverdize-portal
npm install
```

### 2. Set up Supabase

1. Create a new project at supabase.com
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key

### 3. Set up Airwallex

1. Create an account at airwallex.com
2. Go to API → Credentials to get your Client ID and API Key
3. Set up your webhook endpoint: `https://portal.adverdize.com/api/webhooks/airwallex`
4. Copy the webhook secret

### 4. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`.

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 6. Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in Vercel dashboard.

## Adding services

After deploying, insert service packages directly in Supabase dashboard or via the admin panel:

```sql
insert into service_packages (name, description, features) values (
  'SEO Growth',
  'For businesses ready to scale organic traffic.',
  array['25 Target Keywords', 'Content Optimisation', 'On-Page SEO', 'Monthly Reporting']
);
```

Then add prices with the Airwallex price IDs you create in the Airwallex dashboard.

## Security

See `SECURITY.md` for the full security checklist.
