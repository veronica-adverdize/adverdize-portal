create type user_role as enum ('super_admin', 'staff', 'client_admin', 'client_member');
create type subscription_status as enum ('active', 'past_due', 'cancelled', 'trialing', 'paused');
create type invoice_status as enum ('paid', 'unpaid', 'void');
create type billing_period as enum ('monthly', 'quarterly', 'semi_annual', 'annual');

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  airwallex_customer_id text unique,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'client_admin',
  organisation_id uuid references organisations(id),
  avatar_url text,
  created_at timestamptz default now()
);

create table service_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  features text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references service_packages(id) on delete cascade,
  billing_period billing_period not null,
  amount bigint not null,
  currency text default 'SGD',
  airwallex_price_id text unique,
  is_active boolean default true
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  service_id uuid references service_packages(id),
  price_id uuid references service_prices(id),
  airwallex_subscription_id text unique,
  status subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  airwallex_invoice_id text unique,
  amount bigint not null,
  currency text default 'SGD',
  status invoice_status default 'unpaid',
  invoice_url text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  airwallex_event_id text unique not null,
  created_at timestamptz default now()
);

alter table organisations enable row level security;
alter table users enable row level security;
alter table service_packages enable row level security;
alter table service_prices enable row level security;
alter table subscriptions enable row level security;
alter table invoices enable row level security;

create policy "users_own_profile" on users for all using (auth.uid() = id);

create policy "users_see_org_members" on users for select
  using (organisation_id = (select organisation_id from users where id = auth.uid()));

create policy "org_own_data" on organisations for select
  using (id = (select organisation_id from users where id = auth.uid()));

create policy "services_public_read" on service_packages for select using (is_active = true);
create policy "prices_public_read" on service_prices for select using (is_active = true);

create policy "org_own_subscriptions" on subscriptions for select
  using (organisation_id = (select organisation_id from users where id = auth.uid()));

create policy "org_own_invoices" on invoices for select
  using (organisation_id = (select organisation_id from users where id = auth.uid()));

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  org_id uuid;
begin
  insert into organisations (name)
  values (coalesce(new.raw_user_meta_data->>'company_name', 'My Company'))
  returning id into org_id;

  insert into users (id, email, full_name, role, organisation_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'client_admin',
    org_id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
