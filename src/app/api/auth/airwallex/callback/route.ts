import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeAirwallexCode, getAirwallexAccount } from "@/lib/airwallex-oauth";
import { encrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

function getCookie(cookieHeader: string, name: string): string | undefined {
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookies = request.headers.get("cookie") ?? "";
  const savedState = getCookie(cookies, "airwallex_oauth_state");
  const returnTo = getCookie(cookies, "airwallex_return_to");
  const isConnectFlow = returnTo === "settings";

  // Where to send errors
  const errorBase = isConnectFlow ? "/dashboard/settings" : "/auth/login";

  if (error) {
    console.error("[airwallex-oauth] Authorization error:", error);
    const errorUrl = new URL(errorBase, origin);
    errorUrl.searchParams.set("error", "Airwallex authorization was denied");
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  if (!code || !state) {
    const errorUrl = new URL(errorBase, origin);
    errorUrl.searchParams.set("error", "Invalid Airwallex callback");
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  if (!savedState || savedState !== state) {
    console.error("[airwallex-oauth] State mismatch");
    const errorUrl = new URL(errorBase, origin);
    errorUrl.searchParams.set("error", "Invalid session state. Please try again.");
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  try {
    const redirectUri = `${origin}/api/auth/airwallex/callback`;
    const tokens = await exchangeAirwallexCode(code, redirectUri);
    const { access_token, refresh_token, account_id, expires_in } = tokens;

    if (!account_id) {
      throw new Error("No account_id returned from Airwallex");
    }

    const account = await getAirwallexAccount(access_token);
    const admin = createAdminClient();

    if (isConnectFlow) {
      // Connect flow: user is already logged in, link Airwallex to their org
      return await handleConnectFlow({
        origin,
        admin,
        accessToken: access_token,
        refreshToken: refresh_token,
        accountId: account_id,
        expiresIn: expires_in,
        request,
      });
    } else {
      // Login flow: find org by airwallex_customer_id, sign user in
      return await handleLoginFlow({
        origin,
        admin,
        accountId: account_id,
        accountEmail: account.primary_contact?.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });
    }
  } catch (err) {
    console.error("[airwallex-oauth] Callback error:", err);
    const errorUrl = new URL(errorBase, origin);
    errorUrl.searchParams.set("error", "Airwallex sign-in failed. Please try again.");
    return clearCookiesAndRedirect(errorUrl.toString());
  }
}

async function handleLoginFlow({
  origin,
  admin,
  accountId,
  accountEmail,
  accessToken,
  refreshToken,
  expiresIn,
}: {
  origin: string;
  admin: ReturnType<typeof createAdminClient>;
  accountId: string;
  accountEmail?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  // Find org by airwallex_customer_id or airwallex_account_id
  let org: { id: string } | null = null;

  const { data: orgByCustomerId } = await admin
    .from("organisations")
    .select("id")
    .eq("airwallex_customer_id", accountId)
    .single();
  org = orgByCustomerId;

  if (!org) {
    const { data: orgByAccountId } = await admin
      .from("organisations")
      .select("id")
      .eq("airwallex_account_id", accountId)
      .single();
    org = orgByAccountId;
  }

  if (!org) {
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set(
      "error",
      "No portal account is linked to this Airwallex account. Please sign in with Google or email first, then connect Airwallex in Settings."
    );
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  // Find user by exact email match only (no fallback to random admin)
  if (!accountEmail) {
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set(
      "error",
      "No email found on your Airwallex account. Please sign in with Google or email instead."
    );
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  const { data: emailUser } = await admin
    .from("users")
    .select("id")
    .eq("organisation_id", org.id)
    .eq("email", accountEmail)
    .single();

  const userId = emailUser?.id ?? null;

  if (!userId) {
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set(
      "error",
      "Your Airwallex email doesn't match any user in this organisation. Please sign in with Google or email, then connect Airwallex in Settings."
    );
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  // Store the connection
  await storeConnection(admin, org.id, accountId, accessToken, refreshToken, expiresIn, userId);

  // Generate magic link to sign user in
  const { data: userData } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userData!.email,
  });

  if (linkError || !linkData) {
    console.error("[airwallex-oauth] Magic link failed:", linkError);
    throw new Error("Failed to create login session");
  }

  const linkUrl = new URL(linkData.properties.action_link);
  const tokenHash = linkUrl.searchParams.get("token_hash") ?? linkUrl.searchParams.get("token");

  const verifyUrl = new URL("/auth/callback", origin);
  verifyUrl.searchParams.set("token_hash", tokenHash!);
  verifyUrl.searchParams.set("type", "magiclink");

  return clearCookiesAndRedirect(verifyUrl.toString());
}

async function handleConnectFlow({
  origin,
  admin,
  accessToken,
  refreshToken,
  accountId,
  expiresIn,
  request,
}: {
  origin: string;
  admin: ReturnType<typeof createAdminClient>;
  accessToken: string;
  refreshToken: string;
  accountId: string;
  expiresIn: number;
  request: Request;
}) {
  // Get current user from session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "Session expired. Please sign in again.");
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  // Get user's org
  const { data: profile } = await admin
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) {
    const errorUrl = new URL("/dashboard/settings", origin);
    errorUrl.searchParams.set("error", "No organisation found for your account.");
    return clearCookiesAndRedirect(errorUrl.toString());
  }

  // Store the connection
  await storeConnection(admin, profile.organisation_id, accountId, accessToken, refreshToken, expiresIn, user.id);

  const successUrl = new URL("/dashboard/settings", origin);
  successUrl.searchParams.set("airwallex", "connected");
  return clearCookiesAndRedirect(successUrl.toString());
}

async function storeConnection(
  admin: ReturnType<typeof createAdminClient>,
  organisationId: string,
  accountId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  userId: string
) {
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Update org with the verified Airwallex account
  await admin
    .from("organisations")
    .update({
      airwallex_account_id: accountId,
      airwallex_connected_at: new Date().toISOString(),
    })
    .eq("id", organisationId);

  // Upsert the connection tokens (encrypted at rest)
  await admin
    .from("airwallex_connections")
    .upsert(
      {
        organisation_id: organisationId,
        airwallex_account_id: accountId,
        access_token: encrypt(accessToken),
        refresh_token: encrypt(refreshToken),
        token_expires_at: tokenExpiresAt,
        connected_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organisation_id" }
    );
}

function clearCookiesAndRedirect(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.delete("airwallex_oauth_state");
  response.cookies.delete("airwallex_return_to");
  return response;
}
