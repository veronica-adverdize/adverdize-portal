const AIRWALLEX_BASE =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api-demo.airwallex.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${AIRWALLEX_BASE}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Airwallex auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

async function airwallexFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();

  const res = await fetch(`${AIRWALLEX_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Airwallex API error: ${res.status}`);
  }

  return res.json();
}

export async function createAirwallexCustomer(params: {
  email: string;
  name: string;
}) {
  return airwallexFetch("/api/v1/billing/customers", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      name: params.name,
    }),
  });
}

export async function createBillingCheckout(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  promoCode?: string;
}) {
  return airwallexFetch("/api/v1/billing/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      mode: "SUBSCRIPTION",
      customer_id: params.customerId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...(params.promoCode && { promotion_code: params.promoCode }),
    }),
  });
}

export async function getSubscription(subscriptionId: string) {
  return airwallexFetch(`/api/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true
) {
  return airwallexFetch(
    `/api/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancel_at_period_end: atPeriodEnd }),
    }
  );
}

export async function upgradeSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: string;
}) {
  return airwallexFetch(
    `/api/v1/billing/subscriptions/${params.subscriptionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price: params.newPriceId, quantity: 1 }],
        proration_behavior: params.prorationBehavior ?? "CREATE_PRORATIONS",
      }),
    }
  );
}

export async function listInvoices(customerId: string) {
  return airwallexFetch(
    `/api/v1/billing/invoices?customer_id=${customerId}&page_size=20`
  );
}

export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return airwallexFetch("/api/v1/billing/portal_sessions", {
    method: "POST",
    body: JSON.stringify({
      customer_id: params.customerId,
      return_url: params.returnUrl,
    }),
  });
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.AIRWALLEX_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
