export default function IntegrationsPage() {
  const integrations = [
    {
      name: "Xero",
      description: "Sync invoices and contacts automatically with your Xero account.",
      logo: "/logos/xero.webp",
      status: "pending",
      note: "Requires Xero OAuth credentials to activate.",
      docsUrl: "https://developer.xero.com",
    },
    {
      name: "Airwallex",
      description: "Payment processing, subscriptions, and billing management.",
      logo: "/logos/airwallex.png",
      status: "pending",
      note: "Credentials pending — contact your Adverdize account manager.",
      docsUrl: null,
    },
    {
      name: "Google",
      description: "Sign in with Google SSO for your team members.",
      logo: "/logos/google.png",
      status: "pending",
      note: "Google OAuth credentials pending from client.",
      docsUrl: null,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect Adverdize with your existing tools and software.
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="card p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 bg-gray-50 overflow-hidden">
                {integration.logo ? (
                  <img src={integration.logo} alt={integration.name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-gray-400">{integration.name[0]}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{integration.description}</p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                  {integration.note}
                </p>
              </div>
            </div>

            <button
              disabled
              className="btn-outline text-xs shrink-0 opacity-50 cursor-not-allowed"
            >
              Connect
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Need help setting up an integration?{" "}
        <a href="mailto:hello@adverdize.com" className="text-brand-pink hover:underline">
          Contact your account manager
        </a>
      </p>
    </div>
  );
}