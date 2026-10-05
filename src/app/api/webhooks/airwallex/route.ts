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

  console.log(`Webhook received: timestamp=${timestamp}, sig_length=${signature.length}, payload_length=${payload.length}`);

  if (!verifyWebhookSignature(payload, signature, timestamp)) {
    console.error("Webhook signature verification failed");
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
  console.log(`[webhook] handleSubscriptionUpsert: sub.id=${sub.id}, billing_customer_id=${sub.billing_customer_id}, customer_id=${sub.customer_id}, resolved custId=${custId}`);

  const metadata =
    sub.metadata ??
    sub.subscription_data?.metadata ??
    {};

  const metadataOrganisationId =
    metadata.organisation_id ?? null;

  const metadataServiceId =
    metadata.service_id ?? null;

  const metadataPriceId =
    metadata.price_id ?? null;

  console.log("[webhook] Subscription metadata:", {
    organisation_id: metadataOrganisationId,
    service_id: metadataServiceId,
    price_id: metadataPriceId,
  });

  let organisationId = metadataOrganisationId;

  // Fallback to Airwallex customer mapping
  if (!organisationId) {
    const custId =
      sub.billing_customer_id ??
      sub.customer_id;

    if (custId) {
      const { data: org, error: orgErr } = await supabase
        .from("organisations")
        .select("id")
        .eq("airwallex_customer_id", custId)
        .maybeSingle();

      if (orgErr) {
        console.error("[webhook] Organisation lookup error:", orgErr);
      }

      organisationId = org?.id ?? null;
    }
  }

  let priceId = metadataPriceId;
  let serviceId = metadataServiceId;

  // const { data: org, error: orgErr } = await supabase
  //   .from("organisations")
  //   .select("id")
  //   .eq("airwallex_customer_id", custId)
  //   .maybeSingle();

  // if (orgErr) console.error(`[webhook] org lookup error:`, orgErr);
  // if (!org) console.warn(`[webhook] No org found for custId=${custId}`);

  // Resolve internal price and service from Airwallex price ID
  // New Billing API: items[].price.id (object), or line_items[].price_id (string)
  // Old recurring API: items[].price (string)
  const firstItem = sub.items?.[0] ?? sub.line_items?.[0];
  const airwallexPriceId =
    firstItem?.price_id ??
    (typeof firstItem?.price === "object" ? firstItem.price.id : firstItem?.price);

  if (!priceId && airwallexPriceId) {
    const { data: price } = await supabase
      .from("service_prices")
      .select("id, service_id")
      .eq("airwallex_price_id", airwallexPriceId)
      .maybeSingle();

    priceId = price?.id ?? null;
    serviceId = price?.service_id ?? serviceId;
  }

  console.log(`[webhook] firstItem keys=${firstItem ? Object.keys(firstItem).join(",") : "none"}, airwallexPriceId=${airwallexPriceId}`);

  const { data: price, error: priceErr } = airwallexPriceId
    ? await supabase
        .from("service_prices")
        .select("id, service_id")
        .eq("airwallex_price_id", airwallexPriceId)
        .maybeSingle()
    : { data: null, error: null };

  if (priceErr) console.error(`[webhook] price lookup error:`, priceErr);
  if (!price && airwallexPriceId) console.warn(`[webhook] No price found for airwallexPriceId=${airwallexPriceId}`);

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        airwallex_subscription_id: sub.id,

        // Metadata is preferred, Airwallex customer lookup is the fallback
        // organisation_id: organisationId ?? org?.id ?? null,
        organisation_id: organisationId ?? null,

        // Metadata is preferred, Airwallex price lookup is the fallback
        service_id: serviceId ?? price?.service_id ?? null,
        price_id: priceId ?? price?.id ?? null,

        status: sub.status?.toLowerCase() ?? "active",

        current_period_start:
          sub.current_period_starts_at ??
          sub.current_period_start ??
          null,

        current_period_end:
          sub.next_billing_at ??
          sub.current_period_ends_at ??
          sub.current_period_end ??
          null,

        cancel_at_period_end:
          sub.cancel_at_period_end ??
          false,
      },
      {
        onConflict: "airwallex_subscription_id",
      }
    );

    if (error) {
    console.error(
      "[webhook] Subscription upsert failed:",
      error
    );

    throw error;
  }

  console.log("[webhook] Subscription saved:", {
    subscription_id: sub.id,
    // organisation_id: organisationId ?? org?.id ?? null,
    organisation_id: organisationId ?? null,
    service_id: serviceId ?? price?.service_id ?? null,
    price_id: priceId ?? price?.id ?? null,
  });

  // await supabase.from("subscriptions").upsert(
  //   {
  //     airwallex_subscription_id: sub.id,
  //     organisation_id: org?.id ?? null,
  //     service_id: price?.service_id ?? null,
  //     price_id: price?.id ?? null,
  //     status: sub.status?.toLowerCase() ?? "active",
  //     current_period_start: sub.current_period_starts_at ?? sub.current_period_start ?? null,
  //     current_period_end: sub.next_billing_at ?? sub.current_period_ends_at ?? sub.current_period_end ?? null,
  //     cancel_at_period_end: sub.cancel_at_period_end ?? false,
  //   },
  //   { onConflict: "airwallex_subscription_id" }
  // );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// async function handleInvoicePaid(supabase: any, inv: any) {
//   // Resolve our subscription row from the Airwallex subscription ID on the invoice
//   const { data: subRow } = inv.subscription_id
//     ? await supabase
//         .from("subscriptions")
//         .select("id, organisation_id")
//         .eq("airwallex_subscription_id", inv.subscription_id)
//         .maybeSingle()
//     : { data: null };

//   await supabase.from("invoices").upsert(
//     {
//       airwallex_invoice_id: inv.id,
//       organisation_id: subRow?.organisation_id ?? null,
//       subscription_id: subRow?.id ?? null,
//       amount: Math.round((inv.total_amount ?? inv.amount_due ?? inv.amount_paid ?? 0) * 100),
//       currency: inv.currency ?? "SGD",
//       status: "paid",
//       paid_at: new Date().toISOString(),
//       invoice_url: inv.hosted_url ?? inv.pdf_url ?? inv.hosted_invoice_url ?? null,
//     },
//     { onConflict: "airwallex_invoice_id" }
//   );
// }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(supabase: any, inv: any) {
  console.log(
    `[webhook] handleInvoicePaid: invoice=${inv.id}, subscription_id=${inv.subscription_id}`
  );

  // First try to resolve the invoice through our existing subscription
  const { data: subRow } = inv.subscription_id
    ? await supabase
        .from("subscriptions")
        .select("id, organisation_id")
        .eq("airwallex_subscription_id", inv.subscription_id)
        .maybeSingle()
    : { data: null };

  // If the subscription exists, use its organisation
  let organisationId = subRow?.organisation_id ?? null;

  // If the subscription hasn't been created yet, resolve the
  // organisation directly from the Airwallex customer.
  if (!organisationId) {
    const customerId =
      inv.billing_customer_id ??
      inv.customer_id;

    console.log(
      `[webhook] Invoice customer ID: ${customerId}`
    );

    if (customerId) {
      const { data: org, error: orgErr } = await supabase
        .from("organisations")
        .select("id")
        .eq("airwallex_customer_id", customerId)
        .maybeSingle();

      if (orgErr) {
        console.error(
          "[webhook] Invoice organisation lookup error:",
          orgErr
        );
      }

      organisationId = org?.id ?? null;
    }
  }

  console.log(
    `[webhook] Invoice resolved organisation_id=${organisationId}, subscription_id=${subRow?.id ?? null}`
  );

  const { error } = await supabase
    .from("invoices")
    .upsert(
      {
        airwallex_invoice_id: inv.id,
        organisation_id: organisationId,
        subscription_id: subRow?.id ?? null,

        amount: Math.round(
          (
            inv.total_amount ??
            inv.amount_due ??
            inv.amount_paid ??
            0
          ) * 100
        ),

        currency: inv.currency ?? "SGD",
        status: "paid",

        paid_at:
          inv.paid_at ??
          new Date().toISOString(),

        invoice_url:
          inv.hosted_url ??
          inv.pdf_url ??
          inv.hosted_invoice_url ??
          null,
      },
      {
        onConflict: "airwallex_invoice_id",
      }
    );

  if (error) {
    console.error(
      "[webhook] Invoice upsert failed:",
      error
    );

    throw error;
  }

  console.log("[webhook] Invoice saved:", {
    invoice_id: inv.id,
    organisation_id: organisationId,
    subscription_id: subRow?.id ?? null,
  });
}