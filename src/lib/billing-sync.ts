import { getSubscription, listInvoices } from "@/lib/airwallex";
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

  // Sync subscriptions — pull latest period dates from Airwallex
  const { data: subs } = await adminClient
    .from("subscriptions")
    .select("id, airwallex_subscription_id")
    .eq("organisation_id", organisationId);

  for (const sub of subs ?? []) {
    if (!sub.airwallex_subscription_id) continue;
    try {
      const awSub = await getSubscription(sub.airwallex_subscription_id);
      await adminClient
        .from("subscriptions")
        .update({
          status: awSub.status?.toLowerCase() ?? "active",
          current_period_start: awSub.current_period_start ?? null,
          current_period_end: awSub.current_period_end ?? null,
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

      await adminClient.from("invoices").upsert(
        {
          airwallex_invoice_id: inv.id,
          organisation_id: organisationId,
          subscription_id: matchingSub?.id ?? null,
          amount: inv.amount_due ?? inv.total ?? 0,
          currency: inv.currency ?? "SGD",
          status: inv.payment_status?.toLowerCase() === "paid" ? "paid" : "unpaid",
          paid_at:
            inv.payment_status?.toLowerCase() === "paid"
              ? (inv.paid_at ?? inv.finalized_at ?? new Date().toISOString())
              : null,
          invoice_url: inv.hosted_invoice_url ?? inv.invoice_url ?? null,
        },
        { onConflict: "airwallex_invoice_id" }
      );
    }
  } catch (err) {
    console.error("Sync invoices failed:", err);
  }
}
