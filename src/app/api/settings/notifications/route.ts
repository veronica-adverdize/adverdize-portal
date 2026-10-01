import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("notification_preferences")
    .select("preferences")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ preferences: data?.preferences ?? null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, enabled } = await request.json();
  if (!key || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Get existing preferences
  const { data: existing } = await adminClient
    .from("notification_preferences")
    .select("preferences")
    .eq("user_id", user.id)
    .single();

  const currentPrefs = existing?.preferences ?? {
    invoice_paid: true,
    subscription_changes: true,
    campaign_reports: true,
  };

  const updatedPrefs = { ...currentPrefs, [key]: enabled };

  if (existing) {
    await adminClient
      .from("notification_preferences")
      .update({ preferences: updatedPrefs, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  } else {
    await adminClient
      .from("notification_preferences")
      .insert({ user_id: user.id, preferences: updatedPrefs });
  }

  return NextResponse.json({ success: true, preferences: updatedPrefs });
}
