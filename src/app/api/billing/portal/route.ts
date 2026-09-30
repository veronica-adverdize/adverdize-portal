import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/airwallex";
import { rateLimit, API_RATE_LIMIT } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, API_RATE_LIMIT);
  if (limited) return limited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Look up customer_id from the user's own org — never trust it from the client
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 400 });
  }

  const { data: org } = await supabase
    .from("organisations")
    .select("airwallex_customer_id")
    .eq("id", profile.organisation_id)
    .single();

  if (!org?.airwallex_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const session = await createCustomerPortalSession({
    customerId: org.airwallex_customer_id,
    returnUrl: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}