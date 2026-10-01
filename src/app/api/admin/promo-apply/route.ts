import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? user : null;
}

// POST /api/admin/promo-apply — apply a promo code to a client org
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { organisation_id, code } = await request.json() as {
    organisation_id: string;
    code: string;
  };

  if (!organisation_id || !code) {
    return NextResponse.json(
      { error: "organisation_id and code are required" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Look up promo code (case-insensitive)
  const { data: promo, error: promoErr } = await adminClient
    .from("promo_codes")
    .select("*")
    .ilike("code", code)
    .single();

  if (promoErr || !promo) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  // Check active
  if (!promo.is_active) {
    return NextResponse.json({ error: "Promo code is inactive" }, { status: 400 });
  }

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
  }

  // Check max redemptions
  if (promo.max_redemptions != null) {
    const { count } = await adminClient
      .from("promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promo.id);

    if ((count ?? 0) >= promo.max_redemptions) {
      return NextResponse.json(
        { error: "Promo code has reached its redemption limit" },
        { status: 400 }
      );
    }
  }

  // Check org hasn't already redeemed
  const { count: existingCount } = await adminClient
    .from("promo_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promo_code_id", promo.id)
    .eq("organisation_id", organisation_id);

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "This organisation has already redeemed this promo code" },
      { status: 400 }
    );
  }

  // Insert redemption
  const { error: insertErr } = await adminClient
    .from("promo_redemptions")
    .insert({
      promo_code_id: promo.id,
      organisation_id,
      redeemed_by: user.id,
    });

  if (insertErr) {
    return NextResponse.json(
      { error: "Failed to apply promo code" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Applied ${promo.code} — ${promo.discount_type === "percentage" ? `${promo.discount_value}% off` : `SGD ${(promo.discount_value / 100).toFixed(2)} off`}`,
    promo: {
      id: promo.id,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      description: promo.description,
    },
  });
}
