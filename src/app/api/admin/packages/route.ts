import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProduct, createPrice, updateProduct, deactivatePrice } from "@/lib/airwallex";

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

  // Get the package so we have its Airwallex product ID
  const { data: pkg } = await adminClient
    .from("service_packages")
    .select("airwallex_product_id")
    .eq("id", id)
    .single();

  // Sync product changes to Airwallex
  if (pkg?.airwallex_product_id && (name !== undefined || description !== undefined || is_active !== undefined)) {
    try {
      const awUpdate: Record<string, unknown> = {};
      if (name !== undefined) awUpdate.name = name;
      if (description !== undefined) awUpdate.description = description ?? "";
      if (is_active !== undefined) awUpdate.active = is_active;
      await updateProduct(pkg.airwallex_product_id, awUpdate as Parameters<typeof updateProduct>[1]);
    } catch (err) {
      console.error("Airwallex product update failed:", err);
      // Continue — still save locally so admin isn't blocked
    }
  }

  // Update package fields in Supabase
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
    const { data: existingPrices } = await adminClient
      .from("service_prices")
      .select("id, billing_period, amount, airwallex_price_id")
      .eq("service_id", id);

    const existingMap = new Map(
      (existingPrices ?? []).map((p) => [p.billing_period, p])
    );

    for (const p of prices) {
      const existing = existingMap.get(p.billing_period);

      if (existing && existing.amount === p.amount) {
        // Same amount — just make sure it's active
        await adminClient
          .from("service_prices")
          .update({ is_active: true })
          .eq("id", existing.id);
      } else if (existing && existing.amount !== p.amount) {
        // Amount changed — deactivate old price in Airwallex, create new one
        if (existing.airwallex_price_id && !existing.airwallex_price_id.startsWith("placeholder")) {
          try {
            await deactivatePrice(existing.airwallex_price_id);
          } catch (err) {
            console.error("Airwallex deactivate price failed:", err);
          }
        }

        let newAirwallexPriceId = `placeholder_${id}_${p.billing_period}`;
        if (pkg?.airwallex_product_id) {
          try {
            const newPrice = await createPrice({
              productId: pkg.airwallex_product_id,
              amount: p.amount,
              currency: p.currency,
              billingPeriod: p.billing_period,
            });
            newAirwallexPriceId = newPrice.id;
          } catch (err) {
            console.error("Airwallex create price failed:", err);
          }
        }

        // Update the existing row with new amount and new Airwallex ID
        await adminClient
          .from("service_prices")
          .update({ amount: p.amount, airwallex_price_id: newAirwallexPriceId, is_active: true })
          .eq("id", existing.id);
      } else {
        // Brand new billing period — create in Airwallex
        let newAirwallexPriceId = `placeholder_${id}_${p.billing_period}`;
        if (pkg?.airwallex_product_id) {
          try {
            const newPrice = await createPrice({
              productId: pkg.airwallex_product_id,
              amount: p.amount,
              currency: p.currency,
              billingPeriod: p.billing_period,
            });
            newAirwallexPriceId = newPrice.id;
          } catch (err) {
            console.error("Airwallex create price failed:", err);
          }
        }

        await adminClient.from("service_prices").insert({
          service_id: id,
          billing_period: p.billing_period,
          amount: p.amount,
          currency: p.currency,
          airwallex_price_id: newAirwallexPriceId,
          is_active: true,
        });
      }
    }

    // Deactivate removed billing periods in both Airwallex and Supabase
    const activePeriods = prices.map((p) => p.billing_period);
    const toDeactivate = (existingPrices ?? []).filter(
      (p) => !activePeriods.includes(p.billing_period)
    );

    for (const old of toDeactivate) {
      if (old.airwallex_price_id && !old.airwallex_price_id.startsWith("placeholder")) {
        try {
          await deactivatePrice(old.airwallex_price_id);
        } catch (err) {
          console.error("Airwallex deactivate price failed:", err);
        }
      }
    }

    if (toDeactivate.length > 0) {
      await adminClient
        .from("service_prices")
        .update({ is_active: false })
        .in("id", toDeactivate.map((p) => p.id));
    }
  }

  return NextResponse.json({ success: true });
}
