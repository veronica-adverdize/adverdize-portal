import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) return false;
  const message = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

const BASE_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api.sandbox.airwallex.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airwallex auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function airwallexFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airwallex API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function createAirwallexCustomer(params: {
  email: string;
  name: string;
  merchantCustomerId: string;
}) {
  return airwallexFetch("/api/v1/customers/create", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      full_name: params.name,
      merchant_customer_id: params.merchantCustomerId,
    }),
  });
}

export async function createBillingCheckout(params: {
  priceId: string;
  successUrl: string;
  backUrl: string;
  billingCustomerId?: string;
}) {
  const requestId = crypto.randomUUID();
  const body: Record<string, unknown> = {
    request_id: requestId,
    mode: "SUBSCRIPTION",
    success_url: params.successUrl,
    back_url: params.backUrl,
    line_items: [{ price_id: params.priceId, quantity: 1 }],
    subscription_data: {},
  };
  if (params.billingCustomerId) {
    body.billing_customer_id = params.billingCustomerId;
  }
  if (process.env.AIRWALLEX_LEGAL_ENTITY_ID) {
    body.legal_entity_id = process.env.AIRWALLEX_LEGAL_ENTITY_ID;
  }
  if (process.env.AIRWALLEX_PAYMENT_ACCOUNT_ID) {
    body.linked_payment_account_id = process.env.AIRWALLEX_PAYMENT_ACCOUNT_ID;
  }
  return airwallexFetch("/api/v1/billing/billing_checkouts/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function cancelSubscription(
  airwallexSubscriptionId: string,
  atPeriodEnd: boolean = true
) {
  return airwallexFetch(
    `/api/v1/recurring/subscriptions/${airwallexSubscriptionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancel_at_period_end: atPeriodEnd }),
    }
  );
}

export async function createProduct(params: { name: string; description?: string }) {
  return airwallexFetch("/api/v1/products/create", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      description: params.description ?? "",
      type: "service",
    }),
  });
}

export async function createPrice(params: {
  productId: string;
  amount: number;
  currency: string;
  billingPeriod: "monthly" | "quarterly" | "semi_annual" | "annual";
}) {
  const intervalMap: Record<string, { interval: string; interval_count: number }> = {
    monthly: { interval: "month", interval_count: 1 },
    quarterly: { interval: "month", interval_count: 3 },
    semi_annual: { interval: "month", interval_count: 6 },
    annual: { interval: "year", interval_count: 1 },
  };
  const { interval, interval_count } = intervalMap[params.billingPeriod];
  return airwallexFetch("/api/v1/prices/create", {
    method: "POST",
    body: JSON.stringify({
      product_id: params.productId,
      unit_amount: params.amount,
      currency: params.currency,
      recurring: { interval, interval_count },
    }),
  });
}

export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return airwallexFetch("/api/v1/portal/sessions/create", {
    method: "POST",
    body: JSON.stringify({
      customer_id: params.customerId,
      return_url: params.returnUrl,
    }),
  });
}

export async function getSubscription(subscriptionId: string) {
  try {
    return await airwallexFetch(`/api/v1/billing/subscriptions/${subscriptionId}`);
  } catch {
    // Fall back to recurring endpoint
    return airwallexFetch(`/api/v1/recurring/subscriptions/${subscriptionId}`);
  }
}

export async function listInvoices(customerId: string) {
  return airwallexFetch(
    `/api/v1/billing/invoices?billing_customer_id=${customerId}`
  );
}

export async function listSubscriptions(customerId: string) {
  return airwallexFetch(
    `/api/v1/billing/subscriptions?billing_customer_id=${customerId}`
  );
}