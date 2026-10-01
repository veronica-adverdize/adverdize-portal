/**
 * Update all Airwallex prices:
 * 1. Change billing frequency to monthly (interval: month, interval_count: 1)
 * 2. Add billing_length metadata (1_mo, 3_mos, 6_mos, 12_mos)
 * 3. Update currency to SGD
 *
 * Usage (from project root):
 *   node scripts/update-airwallex-prices.mjs
 *
 * Reads credentials from .env.local automatically.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.log("No .env.local found, using existing env vars");
}

const BASE_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api.sandbox.airwallex.com";

async function getToken() {
  const res = await fetch(`${BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID,
      "x-api-key": process.env.AIRWALLEX_API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function airwallexFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

// Billing period to metadata value
const periodToLength = {
  monthly: "1_mo",
  quarterly: "3_mos",
  semi_annual: "6_mos",
  annual: "12_mos",
};

// All prices from Supabase with their Airwallex IDs
const prices = [
  { id: "pri_sgpvr8s4zhms5ijjdkw", name: "Google Ads Premium", period: "monthly", amount: 100000 },
  { id: "pri_sgpv75l96hms5ijmzuv", name: "Google Ads Premium", period: "quarterly", amount: 95000 },
  { id: "pri_sgpv75l96hms5ijpre8", name: "Google Ads Premium", period: "semi_annual", amount: 90000 },
  { id: "pri_sgpv75l96hms5ijshe1", name: "Google Ads Premium", period: "annual", amount: 80000 },
  { id: "pri_sgpvr8s4zhms5ijxwqa", name: "Google Ads Scale", period: "monthly", amount: 200000 },
  { id: "pri_sgpvr8s4zhms5ik0pt7", name: "Google Ads Scale", period: "quarterly", amount: 190000 },
  { id: "pri_sgpvr8s4zhms5ik39ms", name: "Google Ads Scale", period: "semi_annual", amount: 180000 },
  { id: "pri_sgpvr8s4zhms5ik63hh", name: "Google Ads Scale", period: "annual", amount: 160000 },
  { id: "pri_sgpvr8s4zhms5ij5lfo", name: "Google Ads Starter", period: "monthly", amount: 50000 },
  { id: "pri_sgpvr8s4zhms5ij8cz1", name: "Google Ads Starter", period: "quarterly", amount: 47500 },
  { id: "pri_sgpvr8s4zhms5ijawsm", name: "Google Ads Starter", period: "semi_annual", amount: 45000 },
  { id: "pri_sgpv75l96hms5ijdoza", name: "Google Ads Starter", period: "annual", amount: 40000 },
  { id: "pri_sgpvr8s4zhms5ieaxlm", name: "SEO Premium", period: "monthly", amount: 100000 },
  { id: "pri_sgpv75l96hms5iedmpf", name: "SEO Premium", period: "quarterly", amount: 95000 },
  { id: "pri_sgpv75l96hms5iegmqc", name: "SEO Premium", period: "semi_annual", amount: 90000 },
  { id: "pri_sgpv75l96hms5iejf1h", name: "SEO Premium", period: "annual", amount: 80000 },
  { id: "pri_sgpvr8s4zhms5iep4ej", name: "SEO Scale", period: "monthly", amount: 200000 },
  { id: "pri_sgpvr8s4zhms5ierzss", name: "SEO Scale", period: "quarterly", amount: 190000 },
  { id: "pri_sgpvr8s4zhms5ieul5x", name: "SEO Scale", period: "semi_annual", amount: 180000 },
  { id: "pri_sgpv75l96hms5iexcl3", name: "SEO Scale", period: "annual", amount: 160000 },
  { id: "pri_sgpv75l96hms5idwfvk", name: "SEO Starter", period: "monthly", amount: 50000 },
  { id: "pri_sgpv75l96hms5idzjrd", name: "SEO Starter", period: "quarterly", amount: 47500 },
  { id: "pri_sgpvr8s4zhms5ie29vc", name: "SEO Starter", period: "semi_annual", amount: 45000 },
  { id: "pri_sgpv75l96hms5ie59s2", name: "SEO Starter", period: "annual", amount: 40000 },
  { id: "pri_sgpvr8s4zhms5ifggz5", name: "Social Media Advertising - Premium", period: "monthly", amount: 100000 },
  { id: "pri_sgpvr8s4zhms5ifj7qq", name: "Social Media Advertising - Premium", period: "quarterly", amount: 95000 },
  { id: "pri_sgpv75l96hms5ifls7v", name: "Social Media Advertising - Premium", period: "semi_annual", amount: 90000 },
  { id: "pri_sgpv75l96hms5ifoqp8", name: "Social Media Advertising - Premium", period: "annual", amount: 80000 },
  { id: "pri_sgpvr8s4zhms5ifu4ho", name: "Social Media Advertising - Scale", period: "monthly", amount: 200000 },
  { id: "pri_sgpv75l96hms5ifwlvp", name: "Social Media Advertising - Scale", period: "quarterly", amount: 190000 },
  { id: "pri_sgpvr8s4zhms5ifzpvp", name: "Social Media Advertising - Scale", period: "semi_annual", amount: 180000 },
  { id: "pri_sgpv75l96hms5ig2acu", name: "Social Media Advertising - Scale", period: "annual", amount: 160000 },
  { id: "pri_sgpvr8s4zhms5if2yv3", name: "Social Media Advertising - Starter", period: "monthly", amount: 50000 },
  { id: "pri_sgpv75l96hms5if5ikg", name: "Social Media Advertising - Starter", period: "quarterly", amount: 47500 },
  { id: "pri_sgpvr8s4zhms5if8cjc", name: "Social Media Advertising - Starter", period: "semi_annual", amount: 45000 },
  { id: "pri_sgpv75l96hms5ifaup5", name: "Social Media Advertising - Starter", period: "annual", amount: 40000 },
  { id: "pri_sgpvr8s4zhms5iiodu1", name: "SMM (Short-Form Videos) - Premium", period: "monthly", amount: 180000 },
  { id: "pri_sgpv75l96hms5iiutys", name: "SMM (Short-Form Videos) - Scale", period: "monthly", amount: 340000 },
  { id: "pri_sgpv75l96hms5ij0bhx", name: "SMM (Short-Form Videos) - Starter", period: "monthly", amount: 100000 },
  { id: "pri_sgpv75l96hms5ihenvg", name: "SMM (Static/Carousel) - Premium", period: "monthly", amount: 80000 },
  { id: "pri_sgpv75l96hms5ihj21x", name: "SMM (Static/Carousel) - Premium", period: "quarterly", amount: 76000 },
  { id: "pri_sgpv75l96hms5ihmcvq", name: "SMM (Static/Carousel) - Premium", period: "semi_annual", amount: 72000 },
  { id: "pri_sgpvr8s4zhms5ihoyd5", name: "SMM (Static/Carousel) - Premium", period: "annual", amount: 64000 },
  { id: "pri_sgpvr8s4zhms5ihvarf", name: "SMM (Static/Carousel) - Scale", period: "monthly", amount: 160000 },
  { id: "pri_sgpvr8s4zhms5ihya0k", name: "SMM (Static/Carousel) - Scale", period: "quarterly", amount: 152000 },
  { id: "pri_sgpv75l96hms5ii1hmv", name: "SMM (Static/Carousel) - Scale", period: "semi_annual", amount: 144000 },
  { id: "pri_sgpvr8s4zhms5ii4k3h", name: "SMM (Static/Carousel) - Scale", period: "annual", amount: 128000 },
  { id: "pri_sgpv75l96hms5iia981", name: "SMM (Static/Carousel) - Starter", period: "monthly", amount: 40000 },
  { id: "pri_sgpvr8s4zhms5iid3yu", name: "SMM (Static/Carousel) - Starter", period: "quarterly", amount: 38000 },
  { id: "pri_sgpvr8s4zhms5iifxtj", name: "SMM (Static/Carousel) - Starter", period: "semi_annual", amount: 36000 },
  { id: "pri_sgpvr8s4zhms5iiijyg", name: "SMM (Static/Carousel) - Starter", period: "annual", amount: 32000 },
  { id: "pri_sgpvr8s4zhms5ig7zpz", name: "SMM Premium", period: "monthly", amount: 80000 },
  { id: "pri_sgpvr8s4zhms5igav48", name: "SMM Premium", period: "quarterly", amount: 76000 },
  { id: "pri_sgpv75l96hms5igda6v", name: "SMM Premium", period: "semi_annual", amount: 72000 },
  { id: "pri_sgpvr8s4zhms5iggdf5", name: "SMM Premium", period: "annual", amount: 64000 },
  { id: "pri_sgpvr8s4zhms5iglsmy", name: "SMM Scale", period: "monthly", amount: 160000 },
  { id: "pri_sgpvr8s4zhms5igoawz", name: "SMM Scale", period: "quarterly", amount: 152000 },
  { id: "pri_sgpvr8s4zhms5igr384", name: "SMM Scale", period: "semi_annual", amount: 144000 },
  { id: "pri_sgpvr8s4zhms5igtrod", name: "SMM Scale", period: "annual", amount: 128000 },
  { id: "pri_sgpv75l96hms5igzamq", name: "SMM Starter", period: "monthly", amount: 40000 },
  { id: "pri_sgpv75l96hms5ih2n03", name: "SMM Starter", period: "quarterly", amount: 38000 },
  { id: "pri_sgpvr8s4zhms5ih5a12", name: "SMM Starter", period: "semi_annual", amount: 36000 },
  { id: "pri_sgpvr8s4zhms5ih8dwv", name: "SMM Starter", period: "annual", amount: 32000 },
];

async function updatePrice(price) {
  const billingLength = periodToLength[price.period];
  const requestId = crypto.randomUUID();

  const body = {
    request_id: requestId,
    currency: "SGD",
    recurring: {
      interval: "month",
      interval_count: 1,
    },
    metadata: {
      billing_length: billingLength,
    },
  };

  try {
    const result = await airwallexFetch(
      `/api/v1/billing/prices/${price.id}/update`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    console.log(`✓ ${price.name} (${price.period}) → monthly + billing_length=${billingLength} + SGD`);
    return { success: true, price };
  } catch (err) {
    console.error(`✗ ${price.name} (${price.period}): ${err.message}`);
    return { success: false, price, error: err.message };
  }
}

async function main() {
  if (!process.env.AIRWALLEX_CLIENT_ID || !process.env.AIRWALLEX_API_KEY) {
    console.error("Set AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY env vars");
    process.exit(1);
  }

  console.log(`Environment: ${BASE_URL}`);
  console.log(`Updating ${prices.length} prices...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  // Process one at a time to avoid rate limits
  for (const price of prices) {
    const result = await updatePrice(price);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(result);
    }
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone: ${success} updated, ${failed} failed`);
  if (errors.length > 0) {
    console.log("\nFailed prices:");
    for (const e of errors) {
      console.log(`  - ${e.price.name} (${e.price.period}): ${e.error}`);
    }
  }
}

main();
