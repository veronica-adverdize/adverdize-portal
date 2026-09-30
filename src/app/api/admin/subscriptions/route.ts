import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/airwallex";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

// POST /api/admin/subscriptions — cancel or pause a client subscription
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subscription_id, action } = await request.json() as {
    subscription_id: string;
    action: "cancel" | "cancel_now";
  };

  if (!subscription_id || !action) {
    return NextResponse.json({ error: "subscription_id and action are required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Look up the subscription (no org restriction — admin can act on any)
  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("id, airwallex_subscription_id, status")
    .eq("id", subscription_id)
    .single();

  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  if (action === "cancel") {
    // Cancel at period end
    await cancelSubscription(sub.airwallex_subscription_id, true);
    await adminClient
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("id", subscription_id);
    return NextResponse.json({ success: true });
  }

  if (action === "cancel_now") {
    // Immediate cancel
    await cancelSubscription(sub.airwallex_subscription_id, false);
    await adminClient
      .from("subscriptions")
      .update({ status: "cancelled", cancel_at_period_end: false })
      .eq("id", subscription_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
