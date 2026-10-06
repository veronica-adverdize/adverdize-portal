import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const AIRWALLEX_AUTH_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://www.airwallex.com/oauth/authorize"
    : "https://www.sandbox.airwallex.com/oauth/authorize";

export async function GET(request: Request) {
  const clientId = process.env.AIRWALLEX_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Airwallex OAuth is not configured" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const ALLOWED_RETURN_TO = ["settings"];
  const rawReturnTo = url.searchParams.get("return_to") ?? "";
  const returnTo = ALLOWED_RETURN_TO.includes(rawReturnTo) ? rawReturnTo : "";
  const state = crypto.randomBytes(32).toString("hex");
  const redirectUri = `${origin}/api/auth/airwallex/callback`;

  // Store state in a cookie for CSRF validation
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "r:awx_billing",
  });

  const authUrl = `${AIRWALLEX_AUTH_URL}?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("airwallex_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  // Remember where to redirect after callback
  if (returnTo) {
    response.cookies.set("airwallex_return_to", returnTo, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
