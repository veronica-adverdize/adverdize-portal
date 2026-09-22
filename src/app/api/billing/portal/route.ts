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

  const { customer_id } = await request.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const session = await createCustomerPortalSession({
    customerId: customer_id,
    returnUrl: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
