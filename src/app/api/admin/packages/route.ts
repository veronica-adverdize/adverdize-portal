import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProduct, createPrice } from "@/lib/airwallex";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

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
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

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

type PriceUpdate = {
  id?: string;
  billing_period: "monthly" | "quarterly" | "semi_annual" | "annual";
  amount: number;
  currency: string;
};

export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id, name, description, features, is_active, prices } = await request.json() as {
    id: string;
    name?: string;
    description?: string | null;
    features?: string[];
    is_active?: boolean;
    prices?: PriceUpdate[];
  };

  if (!id) {
    return NextResponse.json({ error: "Package id is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Update package fields
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (features !== undefined) updates.features = features;
  if (is_active !== undefined) updates.is_active = is_active;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminClient
      .from("service_packages")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
    }
  }

  // Update prices if provided
  if (prices && prices.length > 0) {
    // Get existing prices for this package
    const { data: existingPrices } = await adminClient
      .from("service_prices")
      .select("id, billing_period")
      .eq("service_id", id);

    const existingMap = new Map(
      (existingPrices ?? []).map((p) => [p.billing_period, p.id])
    );

    for (const p of prices) {
      const existingId = existingMap.get(p.billing_period);

      if (existingId) {
        // Update existing price row amount
        await adminClient
          .from("service_prices")
          .update({ amount: p.amount, is_active: true })
          .eq("id", existingId);
      } else {
        // Insert new price row (placeholder Airwallex ID for now)
        await adminClient.from("service_prices").insert({
          service_id: id,
          billing_period: p.billing_period,
          amount: p.amount,
          currency: p.currency,
          airwallex_price_id: `placeholder_${id}_${p.billing_period}`,
          is_active: true,
        });
      }
    }

    // Deactivate prices for billing periods not included
    const activePeriods = prices.map((p) => p.billing_period);
    const toDeactivate = (existingPrices ?? [])
      .filter((p) => !activePeriods.includes(p.billing_period))
      .map((p) => p.id);

    if (toDeactivate.length > 0) {
      await adminClient
        .from("service_prices")
        .update({ is_active: false })
        .in("id", toDeactivate);
    }
  }

  return NextResponse.json({ success: true });
}
