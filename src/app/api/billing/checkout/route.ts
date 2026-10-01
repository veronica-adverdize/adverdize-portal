import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBillingCheckout, createAirwallexCustomer } from "@/lib/airwallex";
import { rateLimit, CHECKOUT_RATE_LIMIT } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, CHECKOUT_RATE_LIMIT);
  if (limited) return limited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { price_id } = body;

  if (!price_id) {
    return NextResponse.json({ error: "price_id is required" }, { status: 400 });
  }

  // const adminClient = createAdminClient();

  // const { data: price } = await adminClient
  //   .from("service_prices")
  //   .select("airwallex_price_id, service_id")
  //   .eq("id", price_id)
  //   .eq("is_active", true)
  //   .single();

  // if (!price?.airwallex_price_id) {
  //   return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  // }
  const adminClient = createAdminClient();

  // Get the user's organisation + Airwallex customer
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select(`
      organisation_id,
      organisation:organisations (
        id,
        name,
        airwallex_customer_id
      )
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organisation_id) {
    console.error("[checkout] Organisation lookup failed:", profileError);

    return NextResponse.json(
      { error: "No organisation found for user" },
      { status: 400 }
    );
  }

  const organisation = Array.isArray(profile.organisation)
  ? profile.organisation[0]
  : profile.organisation;

  // Auto-create Airwallex customer if one doesn't exist yet
  let airwallexCustomerId = organisation?.airwallex_customer_id;

  if (!airwallexCustomerId) {
    try {
      const customerRes = await createAirwallexCustomer({
        email: user.email!,
        name: organisation?.name ?? "Unknown",
        merchantCustomerId: profile.organisation_id,
      });

      airwallexCustomerId = customerRes.id;

      // Save the Airwallex customer ID back to the organisation
      await adminClient
        .from("organisations")
        .update({ airwallex_customer_id: airwallexCustomerId })
        .eq("id", profile.organisation_id);

      console.log("[checkout] Auto-created Airwallex customer:", airwallexCustomerId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[checkout] Failed to create Airwallex customer:", msg);
      return NextResponse.json(
        { error: "Could not create billing account. Please try again." },
        { status: 500 }
      );
    }
  }

  // Get the selected price (including billing_period for subscription end date)
  const { data: price, error: priceError } = await adminClient
    .from("service_prices")
    .select("id, airwallex_price_id, service_id, billing_period")
    .eq("id", price_id)
    .eq("is_active", true)
    .single();

  if (priceError || !price?.airwallex_price_id) {
    console.error("[checkout] Price lookup failed:", priceError);

    return NextResponse.json(
      { error: "Invalid price" },
      { status: 400 }
    );
  }

  // Derive base URL — try env first, then request origin, then nextUrl
  const origin = request.headers.get("origin")
    ?? `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(/\/$/, "");
  console.log("[checkout] appUrl:", appUrl);

  let checkout;
  try {
    checkout = await createBillingCheckout({
      priceId: price.airwallex_price_id,
      billingCustomerId: airwallexCustomerId,
      organisationId: profile.organisation_id,
      serviceId: price.service_id,
      priceIdInternal: price.id,
      billingPeriod: price.billing_period,
      successUrl: `${appUrl}/dashboard/billing?success=1`,
      backUrl: `${appUrl}/dashboard/services`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout] Airwallex error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!checkout?.url) {
    return NextResponse.json({ error: "No checkout URL returned from Airwallex" }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url });
}