import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyWebhookSignature } from "@/lib/airwallex";

async function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-airwallex-signature") ?? "";

  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload);
  const supabase = await getServiceRoleClient();

  const eventId = event.id;
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("airwallex_event_id", eventId)
    .single();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  await supabase.from("webhook_events").insert({ airwallex_event_id: eventId });

  switch (event.name) {
    case "subscription.created":
    case "subscription.updated": {
      const sub = event.data;
      await supabase.from("subscriptions").upsert(
        {
          airwallex_subscription_id: sub.id,
          status: sub.status.toLowerCase(),
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
        },
        { onConflict: "airwallex_subscription_id" }
      );
      break;
    }

    case "subscription.cancelled": {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("airwallex_subscription_id", event.data.id);
      break;
    }

    case "invoice.payment_succeeded": {
      const inv = event.data;
      await supabase.from("invoices").upsert(
        {
          airwallex_invoice_id: inv.id,
          amount: inv.amount_due,
          currency: inv.currency,
          status: "paid",
          paid_at: new Date().toISOString(),
          invoice_url: inv.hosted_invoice_url,
        },
        { onConflict: "airwallex_invoice_id" }
      );
      break;
    }

    case "invoice.payment_failed": {
      await supabase
        .from("invoices")
        .update({ status: "unpaid" })
        .eq("airwallex_invoice_id", event.data.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
