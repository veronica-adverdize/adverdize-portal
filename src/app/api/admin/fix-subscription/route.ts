import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSubscription } from "@/lib/airwallex";

function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Temporary endpoint to fetch subscription from Airwallex and link it
// DELETE THIS FILE after use
export async function GET() {
  const subId = "sub_sgpvdhcjmhmsr1yeueg";

  try {
    const airwallexSub = await getSubscription(subId);
    const supabase = getServiceRoleClient();

    // Extract customer and price info
    const custId = airwallexSub.billing_customer_id ?? airwallexSub.customer_id;
    const firstItem = airwallexSub.items?.[0] ?? airwallexSub.line_items?.[0];
    const priceId =
      firstItem?.price_id ??
      (typeof firstItem?.price === "object" ? firstItem.price.id : firstItem?.price);

    // Look up org
    const { data: org } = await supabase
      .from("organisations")
      .select("id")
      .eq("airwallex_customer_id", custId)
      .maybeSingle();

    // Look up price
    const { data: price } = priceId
      ? await supabase
          .from("service_prices")
          .select("id, service_id")
          .eq("airwallex_price_id", priceId)
          .maybeSingle()
      : { data: null };

    // Update the subscription
    if (org || price) {
      await supabase
        .from("subscriptions")
        .update({
          organisation_id: org?.id ?? undefined,
          service_id: price?.service_id ?? undefined,
          price_id: price?.id ?? undefined,
        })
        .eq("airwallex_subscription_id", subId);
    }

    return NextResponse.json({
      airwallex_data: {
        id: airwallexSub.id,
        status: airwallexSub.status,
        billing_customer_id: airwallexSub.billing_customer_id,
        customer_id: airwallexSub.customer_id,
        resolved_custId: custId,
        first_item_keys: firstItem ? Object.keys(firstItem) : null,
        first_item: firstItem,
        resolved_priceId: priceId,
      },
      db_lookups: {
        org_found: !!org,
        org_id: org?.id,
        price_found: !!price,
        price_id: price?.id,
        service_id: price?.service_id,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
