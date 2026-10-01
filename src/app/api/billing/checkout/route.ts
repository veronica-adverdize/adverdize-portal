import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBillingCheckout } from "@/lib/airwallex";
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

  const adminClient = createAdminClient();

  const { data: price } = await adminClient
    .from("service_prices")
    .select("airwallex_price_id, service_id")
    .eq("id", price_id)
    .eq("is_active", true)
    .single();

  if (!price?.airwallex_price_id) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
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