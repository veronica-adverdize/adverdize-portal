import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAirwallexCustomer } from "@/lib/airwallex";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Auto-create Airwallex customer for new organisations
    if (data?.user) {
      try {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from("users")
          .select("organisation_id, organisation:organisations(id, name, airwallex_customer_id)")
          .eq("id", data.user.id)
          .single();

        const org = Array.isArray(profile?.organisation)
          ? profile.organisation[0]
          : profile?.organisation;

        if (org && !org.airwallex_customer_id) {
          const customer = await createAirwallexCustomer({
            email: data.user.email!,
            name: org.name ?? "Unknown",
            merchantCustomerId: org.id,
          });

          await adminClient
            .from("organisations")
            .update({ airwallex_customer_id: customer.id })
            .eq("id", org.id);

          console.log("[auth/callback] Created Airwallex customer:", customer.id);
        }
      } catch (err) {
        // Don't block login if Airwallex fails — checkout fallback will handle it
        console.error("[auth/callback] Airwallex customer creation failed:", err);
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}