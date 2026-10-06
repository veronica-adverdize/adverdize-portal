import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get user's org
  const { data: profile } = await admin
    .from("users")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) {
    return NextResponse.json(
      { error: "No organisation found" },
      { status: 400 }
    );
  }

  // Only admins can disconnect
  if (!["super_admin", "client_admin", "staff"].includes(profile.role)) {
    return NextResponse.json(
      { error: "Only admins can disconnect Airwallex" },
      { status: 403 }
    );
  }

  // Remove the connection record
  await admin
    .from("airwallex_connections")
    .delete()
    .eq("organisation_id", profile.organisation_id);

  // Clear the org's Airwallex fields
  await admin
    .from("organisations")
    .update({
      airwallex_account_id: null,
      airwallex_connected_at: null,
    })
    .eq("id", profile.organisation_id);

  return NextResponse.json({ success: true });
}
