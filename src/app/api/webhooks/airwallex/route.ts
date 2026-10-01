import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyWebhookSignature } from "@/lib/airwallex";

function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-signature") ?? "";
  const timestamp = request.headers.get("x-timestamp") ?? "";

  if (!verifyWebhookSignature(payload, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload);
  const supabase = getServiceRoleClient();

  // Deduplicate by event ID
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("airwallex_event_id", event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Record the event upfront so we don't double-process on retry
  await supabase.from("webhook_events").insert({
    airwallex_event_id: event.id,
    event_type: event.name,
  });

  try {
    await handleEvent(supabase, event);

    await supabase
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("airwallex_event_id", event.id);
  } catch (err) {
    // Log the error but still return 200 so Airwallex stops retrying.
    // The missing processed_at serves as a signal that it failed.
    console.error(`Webhook handler error for ${event.name}:`, err);
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(supabase: any, event: any) {
  // Old API (<=2025-04-25) nests resource under data.object
  // New API (>=2025-06-16) puts resource directly in data
  const obj = event.data?.object ?? event.data;

  switch (event.name) {
    // Subscription events (both API versions)
    case "subscription.created":
    case "subscription.updated":    // old API
    case "subscription.modified":   // new API (>=2025-06-16)
    case "subscription.active":     // new API
    case "subscription.in_trial":   // new API
      await handleSubscriptionUpsert(supabase, obj);
      break;

    case "subscription.cancelled":
    case "subscription.unpaid":     // new API
      await supabase
        .from("subscriptions")
        .update({ status: event.name === "subscription.unpaid" ? "unpaid" : "cancelled", cancel_at_period_end: false })
        .eq("airwallex_subscription_id", obj.id);
      break;

    // Invoice paid (old API: invoice.paid, new API: invoice.payment.paid)
    case "invoice.paid":
    case "invoice.payment.paid":
      await handleInvoicePaid(supabase, obj);
      break;

    // Invoice failed (old API: invoice.payment_failed)
    case "invoice.payment_failed":
    case "invoice.payment_attempt_failed":
      await supabase
        .from("invoices")
        .update({ status: "unpaid" })
        .eq("airwallex_invoice_id", obj.id);
      break;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpsert(supabase: any, sub: any) {
  // Resolve organisation from Airwallex customer ID
  // Billing API uses "billing_customer_id", recurring API uses "customer_id"
  const custId = sub.billing_customer_id ?? sub.customer_id;
  const { data: org } = await supabase
    .from("organisations")
    .select("id")
    .eq("airwallex_customer_id", custId)
    .single();

  // Resolve internal price and service from Airwallex price ID
  // Billing API nests price under items[].price.id, recurring uses items[].price as string
  const firstItem = sub.items?.[0] ?? sub.line_items?.[0];
  const airwallexPriceId = typeof firstItem?.price === "object" ? firstItem.price.id : firstItem?.price;
  const { data: price } = airwallexPriceId
    ? await supabase
        .from("service_prices")
        .select("id, service_id")
        .eq("airwallex_price_id", airwallexPriceId)
        .single()
    : { data: null };

  await supabase.from("subscriptions").upsert(
    {
      airwallex_subscription_id: sub.id,
      organisation_id: org?.id ?? null,
      service_id: price?.service_id ?? null,
      price_id: price?.id ?? null,
      status: sub.status?.toLowerCase() ?? "active",
      current_period_start: sub.current_period_starts_at ?? sub.current_period_start ?? null,
      current_period_end: sub.next_billing_at ?? sub.current_period_ends_at ?? sub.current_period_end ?? null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    },
    { onConflict: "airwallex_subscription_id" }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(supabase: any, inv: any) {
  // Resolve our subscription row from the Airwallex subscription ID on the invoice
  const { data: subRow } = inv.subscription_id
    ? await supabase
        .from("subscriptions")
        .select("id, organisation_id")
        .eq("airwallex_subscription_id", inv.subscription_id)
        .single()
    : { data: null };

  await supabase.from("invoices").upsert(
    {
      airwallex_invoice_id: inv.id,
      organisation_id: subRow?.organisation_id ?? null,
      subscription_id: subRow?.id ?? null,
      amount: Math.round((inv.total_amount ?? inv.amount_due ?? inv.amount_paid ?? 0) * 100),
      currency: inv.currency ?? "SGD",
      status: "paid",
      paid_at: new Date().toISOString(),
      invoice_url: inv.hosted_url ?? inv.pdf_url ?? inv.hosted_invoice_url ?? null,
    },
    { onConflict: "airwallex_invoice_id" }
  );
}
