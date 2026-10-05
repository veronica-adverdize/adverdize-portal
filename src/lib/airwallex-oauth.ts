const TOKEN_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com/oauth/token"
    : "https://api.sandbox.airwallex.com/oauth/token";

const API_BASE =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api.sandbox.airwallex.com";

interface AirwallexTokenResponse {
  access_token: string;
  refresh_token: string;
  account_id: string;
  org_id?: string;
  expires_in: number;
  token_type: string;
}

interface AirwallexAccount {
  id: string;
  account_name?: string;
  primary_contact?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

export async function exchangeAirwallexCode(
  code: string,
  redirectUri: string
): Promise<AirwallexTokenResponse> {
  const clientId = process.env.AIRWALLEX_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.AIRWALLEX_OAUTH_CLIENT_SECRET!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[airwallex-oauth] Token exchange failed:", res.status, text);
    throw new Error(`Airwallex token exchange failed: ${res.status}`);
  }

  return res.json();
}

export async function getAirwallexAccount(
  accessToken: string
): Promise<AirwallexAccount> {
  const res = await fetch(`${API_BASE}/api/v1/account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[airwallex-oauth] Account fetch failed:", res.status, text);
    throw new Error(`Failed to fetch Airwallex account: ${res.status}`);
  }

  return res.json();
}

export async function refreshAirwallexToken(
  refreshToken: string
): Promise<AirwallexTokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.AIRWALLEX_OAUTH_CLIENT_ID!,
    client_secret: process.env.AIRWALLEX_OAUTH_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airwallex token refresh failed: ${res.status} ${text}`);
  }

  return res.json();
}
