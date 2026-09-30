import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

async function checkAirwallexConnection(): Promise<boolean> {
  try {
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;
    if (!clientId || !apiKey) return false;

    const base =
      process.env.AIRWALLEX_ENV === "prod"
        ? "https://api.airwallex.com"
        : "https://api.sandbox.airwallex.com";

    const res = await fetch(`${base}/api/v1/authentication/login`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return res.ok;
  } catch {
    return false;
  }
}

export default async function IntegrationsPage() {
  const airwallexConnected = await checkAirwallexConnection();

  const integrations = [
    {
      name: "Xero",
      description: "Sync invoices and contacts automatically with your Xero account.",
      logo: "/logos/xero.webp",
      connected: false,
      note: "Requires Xero OAuth credentials to activate.",
      docsUrl: "https://developer.xero.com",
    },
    {
      name: "Airwallex",
      description: "Payment processing, subscriptions, and billing management.",
      logo: "/logos/airwallex.png",
      connected: airwallexConnected,
      note: airwallexConnected
        ? "Webhooks active. Subscriptions and invoices sync automatically."
        : "Credentials pending — contact your Adverdize account manager.",
      docsUrl: null,
    },
    {
      name: "Google",
      description: "Sign in with Google SSO for your team members.",
      logo: "/logos/google.png",
      connected: false,
      note: "Google OAuth credentials pending from client.",
      docsUrl: null,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-400 mt-1">
          Connect Adverdize with your existing tools and software.
        </p>
      </div>

      <div className="card p-6">
        <div className="divide-y divide-gray-50">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-start justify-between gap-4 py-5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 bg-gray-50 overflow-hidden">
                  {integration.logo ? (
                    <img src={integration.logo} alt={integration.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{integration.name[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                    {integration.connected ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{integration.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{integration.note}</p>
                  {integration.docsUrl && (
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs mt-1.5 transition-colors"
                      style={{ color: "#E05C83" }}
                    >
                      View docs <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              <button
                disabled
                className="btn-outline text-xs shrink-0 opacity-40 cursor-not-allowed"
              >
                {integration.connected ? "Manage" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Need help setting up an integration?{" "}
        <a
          href="mailto:hello@adverdize.com"
          className="transition-colors hover:underline"
          style={{ color: "#E05C83" }}
        >
          Contact your account manager
        </a>
      </p>

    </div>
  );
}