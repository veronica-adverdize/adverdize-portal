import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, API_RATE_LIMIT } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, API_RATE_LIMIT);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, subscription_id } = await request.json();

  if (!type || !subscription_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["upgrade", "downgrade", "pause"].includes(type)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Verify the subscription belongs to this user's org
  const { data: profile } = await adminClient
    .from("users")
    .select("organisation_id, full_name, email")
    .eq("id", user.id)
    .single();

  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("id, organisation_id, service:service_packages(name)")
    .eq("id", subscription_id)
    .eq("organisation_id", profile?.organisation_id)
    .single();

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  // Store the request
  await adminClient.from("change_requests").insert({
    organisation_id: profile?.organisation_id,
    subscription_id,
    requested_by: user.id,
    request_type: type,
    status: "pending",
  });

  return NextResponse.json({ success: true });
}
