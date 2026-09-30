/**
 * Creates products and prices in Airwallex sandbox.
 * Prints SQL UPDATE statements to paste into Supabase.
 * Run with: npx tsx scripts/sync-to-airwallex.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local without dotenv dependency
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const AIRWALLEX_BASE = "https://api.sandbox.airwallex.com/api/v1";
const CURRENCY = process.env.AIRWALLEX_CURRENCY ?? "USD";

const packages = [
  {
    id: "a1b2c3d4-0001-0001-0001-000000000001", name: "SEO Starter", description: null,
    prices: [
      { id: "a7a19597-7f08-42ab-9880-3e8572de16b4", billing_period: "monthly",     amount: 50000  },
      { id: "8d1f0f7a-d6ce-4abf-b618-6bb1b4b9926a", billing_period: "quarterly",   amount: 47500  },
      { id: "99381b74-2f08-49e0-80f6-e16a8fdffeb7", billing_period: "semi_annual", amount: 45000  },
      { id: "19c1f359-c00e-4a87-ad27-238d360edd3a", billing_period: "annual",      amount: 40000  },
    ],
  },
  {
    id: "a1b2c3d4-0002-0002-0002-000000000002", name: "SEO Premium", description: null,
    prices: [
      { id: "0d05a983-0be7-4d2f-97c3-284a1ffb384a", billing_period: "monthly",     amount: 100000 },
      { id: "c6a6b43a-a666-472b-a358-334a3b849ddd", billing_period: "quarterly",   amount: 95000  },
      { id: "40563744-12d9-48df-bc2a-a6a2ac64b7b4", billing_period: "semi_annual", amount: 90000  },
      { id: "cf620520-d19e-4ec4-a86b-51cfad27076a", billing_period: "annual",      amount: 80000  },
    ],
  },
  {
    id: "a1b2c3d4-0003-0003-0003-000000000003", name: "SEO Scale", description: null,
    prices: [
      { id: "fc0ea435-5aa3-4005-b786-aa7d00bb82b5", billing_period: "monthly",     amount: 200000 },
      { id: "60d2e0ff-5ba4-4682-ae8f-92f89fddb214", billing_period: "quarterly",   amount: 190000 },
      { id: "88f013d6-82c5-46ba-85a0-f49fadc5a605", billing_period: "semi_annual", amount: 180000 },
      { id: "43d87f7d-00c1-4368-a1af-76a1d8c58257", billing_period: "annual",      amount: 160000 },
    ],
  },
  {
    id: "b2c3d4e5-0001-0001-0001-000000000001", name: "Social Media Advertising - Starter", description: null,
    prices: [
      { id: "40dec747-8abd-4935-86e5-e647873624aa", billing_period: "monthly",     amount: 50000  },
      { id: "083f107a-607c-4678-abb1-c053fe9fd829", billing_period: "quarterly",   amount: 47500  },
      { id: "bc296eba-70e1-464f-aefd-6de3282e5ea9", billing_period: "semi_annual", amount: 45000  },
      { id: "5d0aff06-7f54-4c0c-829e-a942d22c4aa1", billing_period: "annual",      amount: 40000  },
    ],
  },
  {
    id: "b2c3d4e5-0002-0002-0002-000000000002", name: "Social Media Advertising - Premium", description: null,
    prices: [
      { id: "adcedf42-b368-4768-850f-88259ec79fe6", billing_period: "monthly",     amount: 100000 },
      { id: "256d2317-ab20-4b54-a8b5-a0e398972f29", billing_period: "quarterly",   amount: 95000  },
      { id: "b4157870-c290-4ab8-a4e5-d6997c526499", billing_period: "semi_annual", amount: 90000  },
      { id: "6a112a94-8699-42a7-a8e6-1b9648f477a0", billing_period: "annual",      amount: 80000  },
    ],
  },
  {
    id: "b2c3d4e5-0003-0003-0003-000000000003", name: "Social Media Advertising - Scale", description: null,
    prices: [
      { id: "32f41bb3-9dc2-4f67-96ff-a7f833235811", billing_period: "monthly",     amount: 200000 },
      { id: "1878035a-10c0-4035-a667-5f2ddaaaff70", billing_period: "quarterly",   amount: 190000 },
      { id: "d5233cb2-143e-47f2-9590-cdf4736013ce", billing_period: "semi_annual", amount: 180000 },
      { id: "b142279c-feac-4282-b10c-b23262ddacf4", billing_period: "annual",      amount: 160000 },
    ],
  },
  {
    id: "c8fafa35-9bb7-4632-93c9-24025e85a184", name: "Social Media Management Premium", description: null,
    prices: [
      { id: "97afbdc6-fc23-472a-9045-e4c2a65ec27b", billing_period: "monthly",     amount: 80000  },
      { id: "6cf7161b-ff96-4dd5-bfb4-f7bc20fa605c", billing_period: "quarterly",   amount: 76000  },
      { id: "5236e08f-82b1-4402-a3c6-3d43b6ebf358", billing_period: "semi_annual", amount: 72000  },
      { id: "22b063e0-d9d1-4679-9936-e99df5e7e4a4", billing_period: "annual",      amount: 64000  },
    ],
  },
  {
    id: "204f7cbb-49c4-43e7-b040-9201f320173e", name: "Social Media Management Scale", description: null,
    prices: [
      { id: "b10526d4-e7e0-441d-95fb-0034c04725cf", billing_period: "monthly",     amount: 160000 },
      { id: "dd97d4b9-7f23-4d54-ae27-f4c965764709", billing_period: "quarterly",   amount: 152000 },
      { id: "b6894d6b-141f-4589-bfab-21a346a69db6", billing_period: "semi_annual", amount: 144000 },
      { id: "3c923974-4fe7-4d44-bdc3-5569ce51eb80", billing_period: "annual",      amount: 128000 },
    ],
  },
  {
    id: "e15fd038-b3cf-4196-87f6-9e06bc695d42", name: "Social Media Management Starter", description: null,
    prices: [
      { id: "be2bddf2-49d9-41ef-b2dc-0799051b3490", billing_period: "monthly",     amount: 40000  },
      { id: "987c68f1-0993-4dbd-84cb-acf0cc732e21", billing_period: "quarterly",   amount: 38000  },
      { id: "2df1944b-57a4-4321-ba75-edebb2c58815", billing_period: "semi_annual", amount: 36000  },
      { id: "8fbd2078-b819-41de-aa7a-b232cea3c5dc", billing_period: "annual",      amount: 32000  },
    ],
  },
  {
    id: "d3631b3c-e9f6-4ffe-b94e-bcb148677e87", name: "Social Media Management (Static/Carousel) - Premium", description: null,
    prices: [
      { id: "c12b0763-dfbb-45ee-9988-59bec3b42679", billing_period: "monthly",     amount: 80000  },
      { id: "688d3523-d5ea-46ea-b90f-8ec15d2b5e50", billing_period: "quarterly",   amount: 76000  },
      { id: "0b392fc9-3f90-4e0f-8238-04d5de9043ee", billing_period: "semi_annual", amount: 72000  },
      { id: "b48d39c0-f536-4f86-a187-5343decb81ab", billing_period: "annual",      amount: 64000  },
    ],
  },
  {
    id: "03409493-6461-4714-9dad-7c4451db0a36", name: "Social Media Management (Static/Carousel) - Scale", description: null,
    prices: [
      { id: "378c0758-ad80-4f6f-a3a6-9bb876bc456f", billing_period: "monthly",     amount: 160000 },
      { id: "d2d7e197-52c5-453c-bb42-ff1a3401ca63", billing_period: "quarterly",   amount: 152000 },
      { id: "1a95c83d-c481-4199-88b2-d170a0d320ab", billing_period: "semi_annual", amount: 144000 },
      { id: "ebdd2879-0882-4fee-9b1c-a53e95852d86", billing_period: "annual",      amount: 128000 },
    ],
  },
  {
    id: "fe72fcb0-f79b-476d-aadd-be3b8957fd19", name: "Social Media Management (Static/Carousel) - Starter", description: null,
    prices: [
      { id: "06ae4f7c-ee68-42bf-b879-89628d3292dc", billing_period: "monthly",     amount: 40000  },
      { id: "cba9a662-f212-46c2-be7e-d9949efef3fe", billing_period: "quarterly",   amount: 38000  },
      { id: "1f52652f-1a4a-4035-a3b7-5a103fb3320b", billing_period: "semi_annual", amount: 36000  },
      { id: "454ddc24-2489-43ad-8418-56e41f39dd24", billing_period: "annual",      amount: 32000  },
    ],
  },
  {
    id: "91ea8902-153f-4600-8702-b5074968ed5f", name: "Social Media Management (Short-Form Videos) - Premium", description: null,
    prices: [
      { id: "e022c0c6-1a77-4aa5-8300-c902145d6da7", billing_period: "monthly", amount: 180000 },
    ],
  },
  {
    id: "a10a2d90-315a-48af-acd2-199a3ff683a9", name: "Social Media Management (Short-Form Videos) - Scale", description: null,
    prices: [
      { id: "7f577535-4fb3-4840-882e-3f7547c250fc", billing_period: "monthly", amount: 340000 },
    ],
  },
  {
    id: "1ba66de5-13b6-4873-b756-426999cfdc3d", name: "Social Media Management (Short-Form Videos) - Starter", description: null,
    prices: [
      { id: "9bfe54a3-9a8b-489d-ba8b-9b16723aa208", billing_period: "monthly", amount: 100000 },
    ],
  },
  {
    id: "d4e5f6a7-0001-0001-0001-000000000001", name: "Google Ads Starter", description: null,
    prices: [
      { id: "e4f93b94-0de0-4fb2-befc-41c22449905d", billing_period: "monthly",     amount: 50000  },
      { id: "370d19f1-55be-4ec5-93d5-da66c51e3286", billing_period: "quarterly",   amount: 47500  },
      { id: "e5491bd0-c908-4553-bd5d-1e129b016cce", billing_period: "semi_annual", amount: 45000  },
      { id: "bd47d843-06e8-41a1-ad76-42fadeb0c0c2", billing_period: "annual",      amount: 40000  },
    ],
  },
  {
    id: "d4e5f6a7-0002-0002-0002-000000000002", name: "Google Ads Premium", description: null,
    prices: [
      { id: "db815206-7315-4707-bcbf-f9972bf621d5", billing_period: "monthly",     amount: 100000 },
      { id: "2b4cb0c8-7071-4f61-ad4f-f89a85231a26", billing_period: "quarterly",   amount: 95000  },
      { id: "2862c220-0103-498c-8df7-86c5a36f8272", billing_period: "semi_annual", amount: 90000  },
      { id: "2f6c6e39-77ca-4e0b-ac38-d5fa79e8cc40", billing_period: "annual",      amount: 80000  },
    ],
  },
  {
    id: "d4e5f6a7-0003-0003-0003-000000000003", name: "Google Ads Scale", description: null,
    prices: [
      { id: "bbd1a786-3822-49cf-9e80-65184b5e1f95", billing_period: "monthly",     amount: 200000 },
      { id: "cb232b49-1153-48c6-920e-393cec252419", billing_period: "quarterly",   amount: 190000 },
      { id: "546d7d7a-4388-49ef-bd8c-4608941c744f", billing_period: "semi_annual", amount: 180000 },
      { id: "44fc082f-c6aa-408e-a195-889aa6b7aaa1", billing_period: "annual",      amount: 160000 },
    ],
  },
];

const PERIOD_MAP: Record<string, { period_unit: string; period: number }> = {
  monthly:     { period_unit: "MONTH", period: 1 },
  quarterly:   { period_unit: "MONTH", period: 3 },
  semi_annual: { period_unit: "MONTH", period: 6 },
  annual:      { period_unit: "YEAR",  period: 1 },
};

async function getToken(): Promise<string> {
  const res = await fetch(`${AIRWALLEX_BASE}/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  return (await res.json()).token;
}

async function createProduct(token: string, name: string) {
  const res = await fetch(`${AIRWALLEX_BASE}/billing/products/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, active: true, request_id: crypto.randomUUID() }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`  Full response (${res.status}):`, text);
    throw new Error(`createProduct "${name}" failed`);
  }
  return JSON.parse(text);
}

async function createPrice(token: string, productId: string, amount: number, billingPeriod: string) {
  const period = PERIOD_MAP[billingPeriod];
  const payload = {
    product_id: productId,
    pricing_model: "FLAT",
    flat_amount: amount / 100,
    currency: CURRENCY,
    billing_type: "IN_ADVANCE",
    recurring: { period_unit: period.period_unit, period: period.period },
    active: true,
    request_id: crypto.randomUUID(),
  };
  console.log("  sending price payload:", JSON.stringify(payload));
  const res = await fetch(`${AIRWALLEX_BASE}/billing/prices/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  createPrice full response (${res.status}):`, text);
    throw new Error(`createPrice (${billingPeriod}) failed`);
  }
  return res.json();
}

async function main() {
  console.log("Authenticating with Airwallex sandbox...");
  const token = await getToken();
  console.log("OK\n");


  const pkgUpdates: string[] = [];
  const priceUpdates: string[] = [];

  for (const pkg of packages) {
    console.log(`→ ${pkg.name}`);
    const product = await createProduct(token, pkg.name);
    pkgUpdates.push(`UPDATE service_packages SET airwallex_product_id = '${product.id}' WHERE id = '${pkg.id}';`);
    console.log(`  product: ${product.id}`);

    for (const price of pkg.prices) {
      const created = await createPrice(token, product.id, price.amount, price.billing_period);
      priceUpdates.push(`UPDATE service_prices SET airwallex_price_id = '${created.id}' WHERE id = '${price.id}';`);
      console.log(`  price (${price.billing_period}): ${created.id}`);
    }
    console.log();
  }

  console.log("\n-- Run this SQL in Supabase SQL editor --\n");
  console.log([...pkgUpdates, ...priceUpdates].join("\n"));
}

main().catch((e) => { console.error(e.message); process.exit(1); });