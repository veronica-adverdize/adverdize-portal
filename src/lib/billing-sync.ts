import { getSubscription, listInvoices, listSubscriptions } from "@/lib/airwallex";
import { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncBillingData(
  adminClient: SupabaseClient,
  organisationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organisation: any
) {
  const customerId = organisation?.airwallex_customer_id;
  if (!customerId) return;

  // Discover new subscriptions from Airwallex that aren't in our DB yet
  try {
    const awSubsRes = await listSubscriptions(customerId);
    const awSubs = awSubsRes.items ?? awSubsRes.data ?? [];

    for (const awSub of awSubs) {
      if (!awSub.id) continue;
      // Check if we already have this subscription
      const { data: existing } = await adminClient
        .from("subscriptions")
        .select("id")
        .eq("airwallex_subscription_id", awSub.id)
        .maybeSingle();

      if (!existing) {
        // Resolve price from Airwallex price ID
        const firstItem = awSub.items?.[0];
        const awPriceId = typeof firstItem?.price === "object"
          ? firstItem.price.id
          : firstItem?.price;

        const { data: price } = awPriceId
          ? await adminClient
              .from("service_prices")
              .select("id, service_id")
              .eq("airwallex_price_id", awPriceId)
              .maybeSingle()
          : { data: null };

        const periodStart = awSub.current_period_starts_at ?? awSub.current_period_start ?? null;
        const periodEnd = awSub.current_period_ends_at ?? awSub.current_period_end ?? null;
        const nextBilling = awSub.next_billing_at ?? periodEnd;

        await adminClient.from("subscriptions").insert({
          airwallex_subscription_id: awSub.id,
          organisation_id: organisationId,
          service_id: price?.service_id ?? null,
          price_id: price?.id ?? null,
          status: (awSub.status ?? "ACTIVE").toLowerCase(),
          current_period_start: periodStart,
          current_period_end: nextBilling,
          cancel_at_period_end: awSub.cancel_at_period_end ?? false,
        });
      }
    }
  } catch (err) {
    console.error("Discover new subscriptions failed:", err);
  }

  // Now refresh all existing subscriptions with latest data
  const { data: subs } = await adminClient
    .from("subscriptions")
    .select("id, airwallex_subscription_id")
    .eq("organisation_id", organisationId);

  for (const sub of subs ?? []) {
    if (!sub.airwallex_subscription_id) continue;
    try {
      const awSub = await getSubscription(sub.airwallex_subscription_id);
      // Airwallex billing API uses "current_period_starts_at" / "current_period_ends_at"
      // while recurring API uses "current_period_start" / "current_period_end"
      const periodEnd = awSub.current_period_ends_at ?? awSub.current_period_end ?? null;
      const periodStart = awSub.current_period_starts_at ?? awSub.current_period_start ?? null;
      // next_billing_at is the most reliable for "Next Billing" display
      const nextBilling = awSub.next_billing_at ?? periodEnd;
      await adminClient
        .from("subscriptions")
        .update({
          status: (awSub.status ?? "ACTIVE").toLowerCase(),
          current_period_start: periodStart,
          current_period_end: nextBilling,
          cancel_at_period_end: awSub.cancel_at_period_end ?? false,
        })
        .eq("id", sub.id);
    } catch (err) {
      console.error(`Sync subscription ${sub.airwallex_subscription_id} failed:`, err);
    }
  }

  // Sync invoices — pull all invoices for this customer
  try {
    const invoiceRes = await listInvoices(customerId);
    const items = invoiceRes.items ?? invoiceRes.data ?? [];

    for (const inv of items) {
      const matchingSub = subs?.find(
        (s) => s.airwallex_subscription_id === inv.subscription_id
      );
      const isPaid = inv.payment_status?.toUpperCase() === "PAID";
      // Airwallex returns amounts in currency units (e.g. 500 = $500)
      // We store in cents to match service_prices convention
      const rawAmount = inv.total_amount ?? inv.amount_due ?? 0;
      const amountInCents = Math.round(rawAmount * 100);

      await adminClient.from("invoices").upsert(
        {
          airwallex_invoice_id: inv.id,
          organisation_id: organisationId,
          subscription_id: matchingSub?.id ?? null,
          amount: amountInCents,
          currency: inv.currency ?? "USD",
          status: isPaid ? "paid" : "unpaid",
          paid_at: isPaid ? (inv.paid_at ?? inv.finalized_at ?? inv.created_at ?? new Date().toISOString()) : null,
          invoice_url: inv.hosted_url ?? inv.pdf_url ?? null,
        },
        { onConflict: "airwallex_invoice_id" }
      );
    }
  } catch (err) {
    console.error("Sync invoices failed:", err);
  }
}
