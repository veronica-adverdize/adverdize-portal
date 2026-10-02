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

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Promo code is required" }, { status: 400 });

  const adminClient = createAdminClient();

  // Look up the promo code
  const { data: promo } = await adminClient
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!promo) {
    return NextResponse.json({ error: "Invalid or expired promo code." }, { status: 400 });
  }

  // Check if already redeemed by this user's org
  const { data: profile } = await adminClient
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const { data: existing } = await adminClient
    .from("promo_redemptions")
    .select("id")
    .eq("promo_code_id", promo.id)
    .eq("organisation_id", profile?.organisation_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "This promo code has already been applied to your account." }, { status: 400 });
  }

  // Record the redemption
  await adminClient.from("promo_redemptions").insert({
    promo_code_id: promo.id,
    organisation_id: profile?.organisation_id,
    redeemed_by: user.id,
  });

  return NextResponse.json({
    message: `Promo code "${promo.code}" applied! ${promo.description ?? ""}`.trim(),
  });
}
