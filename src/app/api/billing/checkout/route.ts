import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAirwallexCustomer,
  createBillingCheckout,
} from "@/lib/airwallex";
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
  const { price_id, promo_code } = body;

  if (!price_id) {
    return NextResponse.json({ error: "price_id is required" }, { status: 400 });
  }

  const { data: price } = await supabase
    .from("service_prices")
    .select("airwallex_price_id, service_id")
    .eq("id", price_id)
    .eq("is_active", true)
    .single();

  if (!price) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  let airwallexCustomerId = profile?.organisation?.airwallex_customer_id;

  if (!airwallexCustomerId) {
    const customer = await createAirwallexCustomer({
      email: user.email!,
      name: profile?.organisation?.name ?? profile?.full_name,
    });
    airwallexCustomerId = customer.id;

    await supabase
      .from("organisations")
      .update({ airwallex_customer_id: airwallexCustomerId })
      .eq("id", profile?.organisation_id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const session = await createBillingCheckout({
    customerId: airwallexCustomerId,
    priceId: price.airwallex_price_id,
    successUrl: `${appUrl}/dashboard/billing?success=1`,
    cancelUrl: `${appUrl}/dashboard/services`,
    promoCode: promo_code,
  });

  return NextResponse.json({ url: session.url });
}
