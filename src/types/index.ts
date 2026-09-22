export type UserRole = "super_admin" | "staff" | "client_admin" | "client_member";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organisation_id: string;
  avatar_url?: string;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  logo_url?: string;
  airwallex_customer_id?: string;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface ServicePrice {
  id: string;
  service_id: string;
  billing_period: "monthly" | "quarterly" | "semi_annual" | "annual";
  amount: number;
  currency: string;
  airwallex_price_id: string;
  is_active: boolean;
}

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing"
  | "paused";

export interface Subscription {
  id: string;
  organisation_id: string;
  service_id: string;
  price_id: string;
  airwallex_subscription_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  service?: ServicePackage;
  price?: ServicePrice;
}

export interface Invoice {
  id: string;
  organisation_id: string;
  subscription_id: string;
  airwallex_invoice_id: string;
  amount: number;
  currency: string;
  status: "paid" | "unpaid" | "void";
  invoice_url?: string;
  paid_at?: string;
  created_at: string;
}
