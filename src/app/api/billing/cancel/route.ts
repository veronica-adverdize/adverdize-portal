import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/airwallex";
import { rateLimit, API_RATE_LIMIT } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, API_RATE_LIMIT);
  if (limited) return limited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription_id } = await request.json();
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("airwallex_subscription_id, organisation_id")
    .eq("id", subscription_id)
    .eq("organisation_id", profile?.organisation_id)
    .single();

  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  await cancelSubscription(sub.airwallex_subscription_id, true);

  await adminClient
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("id", subscription_id);

  return NextResponse.json({ success: true });
}
