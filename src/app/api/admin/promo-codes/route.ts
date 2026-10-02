import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" || profile?.role === "staff" ? user : null;
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: codes, error } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
  }

  // Get redemption counts per code
  const { data: redemptions } = await admin
    .from("promo_redemptions")
    .select("promo_code_id");

  const countMap: Record<string, number> = {};
  for (const r of redemptions ?? []) {
    countMap[r.promo_code_id] = (countMap[r.promo_code_id] || 0) + 1;
  }

  const result = (codes ?? []).map((c) => ({
    ...c,
    redemption_count: countMap[c.id] || 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code, description, discount_type, discount_value, max_redemptions, expires_at } = body;

  if (!code || !discount_type || discount_value == null) {
    return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
  }

  if (!["percentage", "fixed"].includes(discount_type)) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'fixed'" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("promo_codes")
    .insert({
      code: code.toUpperCase().trim(),
      description: description || null,
      discount_type,
      discount_value,
      max_redemptions: max_redemptions || null,
      expires_at: expires_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A promo code with this code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (fields.description !== undefined) updates.description = fields.description || null;
  if (fields.discount_type !== undefined) updates.discount_type = fields.discount_type;
  if (fields.discount_value !== undefined) updates.discount_value = fields.discount_value;
  if (fields.is_active !== undefined) updates.is_active = fields.is_active;
  if (fields.max_redemptions !== undefined) updates.max_redemptions = fields.max_redemptions || null;
  if (fields.expires_at !== undefined) updates.expires_at = fields.expires_at || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("promo_codes")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("promo_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to deactivate promo code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
