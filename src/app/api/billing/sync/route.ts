import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription, listInvoices } from "@/lib/airwallex";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminClient();

  // const { data: profile } = await adminClient
  //   .from("users")
  //   .select("organisation_id, organisation:organisations(airwallex_customer_id)")
  //   .eq("id", user.id)
  //   .single();

  // if (!profile?.organisation_id) {
  //   return NextResponse.json({ error: "No organisation" }, { status: 400 });
  // }

  // const customerId = (profile.organisation as { airwallex_customer_id?: string })?.airwallex_customer_id;

  const { data: profile } = await adminClient
    .from("users")
    .select("organisation_id, organisation:organisations(airwallex_customer_id)")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: "No organisation" }, { status: 400 });
  }

  const customerId = (profile.organisation as { airwallex_customer_id?: string })?.airwallex_customer_id;

  // Sync subscriptions
  const { data: subs } = await adminClient
    .from("subscriptions")
    .select("id, airwallex_subscription_id")
    .eq("organisation_id", profile.organisation_id);

  for (const sub of subs ?? []) {
    if (!sub.airwallex_subscription_id) continue;
    try {
      const awSub = await getSubscription(sub.airwallex_subscription_id);
      await adminClient
        .from("subscriptions")
        .update({
          status: (awSub.status ?? "ACTIVE").toLowerCase(),
          current_period_start: awSub.current_period_start_at ?? awSub.current_period_start ?? null,
          current_period_end: awSub.current_period_end_at ?? awSub.current_period_end ?? null,
          cancel_at_period_end: awSub.cancel_at_period_end ?? false,
        })
        .eq("id", sub.id);
    } catch (err) {
      console.error(`Failed to sync subscription ${sub.airwallex_subscription_id}:`, err);
    }
  }

  // Sync invoices
  if (customerId) {
    try {
      const invoiceRes = await listInvoices(customerId);
      const items = invoiceRes.items ?? invoiceRes.data ?? [];

      for (const inv of items) {
        const matchingSub = subs?.find(
          (s) => s.airwallex_subscription_id === inv.subscription_id
        );
        const isPaid = inv.payment_status?.toUpperCase() === "PAID";

        await adminClient.from("invoices").upsert(
          {
            airwallex_invoice_id: inv.id,
            organisation_id: profile.organisation_id,
            subscription_id: matchingSub?.id ?? null,
            amount: inv.total_amount ?? inv.amount_due ?? 0,
            currency: inv.currency ?? "USD",
            status: isPaid ? "paid" : "unpaid",
            paid_at: isPaid ? (inv.paid_at ?? inv.created_at ?? new Date().toISOString()) : null,
            invoice_url: inv.hosted_url ?? inv.pdf_url ?? null,
          },
          { onConflict: "airwallex_invoice_id" }
        );
      }
    } catch (err) {
      console.error("Failed to sync invoices:", err);
    }
  }

  return NextResponse.json({ success: true });
}
