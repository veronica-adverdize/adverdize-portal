import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProduct, createPrice } from "@/lib/airwallex";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminClient();
  const { data: raw } = await adminClient
    .from("service_packages")
    .select(`id, name, description, features, is_active, service_prices!service_id (id, billing_period, amount, currency, airwallex_price_id, is_active)`)
    .order("name");

  // Rename service_prices → prices so the client component can use a consistent shape
  const data = (raw ?? []).map((pkg) => ({
    ...pkg,
    prices: (pkg as Record<string, unknown>).service_prices ?? [],
    service_prices: undefined,
  }));

  return NextResponse.json(data ?? []);
}

type PriceInput = {
  billing_period: "monthly" | "quarterly" | "semi_annual" | "annual";
  amount: number;
  currency: string;
};

export async function POST(request: NextRequest) {
  // Verify the caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, features, prices } = await request.json() as {
    name: string;
    description?: string;
    features?: string[];
    prices: PriceInput[];
  };

  if (!name || !prices?.length) {
    return NextResponse.json({ error: "name and prices are required" }, { status: 400 });
  }

  // Create product in Airwallex
  const product = await createProduct({ name, description });

  // Create each price in Airwallex
  const createdPrices = await Promise.all(
    prices.map((p) =>
      createPrice({
        productId: product.id,
        amount: p.amount,
        currency: p.currency,
        billingPeriod: p.billing_period,
      })
    )
  );

  // Save to Supabase
  const adminClient = createAdminClient();

  const { data: pkg, error: pkgError } = await adminClient
    .from("service_packages")
    .insert({
      name,
      description: description ?? null,
      features: features ?? [],
      airwallex_product_id: product.id,
      is_active: true,
    })
    .select()
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json({ error: "Failed to save package" }, { status: 500 });
  }

  const priceRows = prices.map((p, i) => ({
    service_package_id: pkg.id,
    billing_period: p.billing_period,
    amount: p.amount,
    currency: p.currency,
    airwallex_price_id: createdPrices[i].id,
    is_active: true,
  }));

  const { error: priceError } = await adminClient
    .from("service_prices")
    .insert(priceRows);

  if (priceError) {
    return NextResponse.json({ error: "Package created but prices failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true, packageId: pkg.id });
}
