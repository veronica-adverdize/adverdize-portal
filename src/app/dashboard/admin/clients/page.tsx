import { Users, TrendingUp, DollarSign, PauseCircle, XCircle, Package, Search } from "lucide-react";

export default function AdminClientsPage() {
  const mockClients = [
    { name: "Acme Corp", email: "billing@acmecorp.com", service: "Social Media Management", plan: "Monthly", status: "active", mrr: 1200 },
    { name: "TechStart Pte Ltd", email: "admin@techstart.sg", service: "SEO", plan: "Quarterly", status: "active", mrr: 950 },
    { name: "Sunrise Retail", email: "ops@sunrise.com", service: "Google Ads", plan: "Monthly", status: "active", mrr: 800 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all client accounts and subscriptions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Clients", icon: Users, color: "#E05C83", bg: "rgba(224,92,131,0.08)" },
          { label: "Active Subscriptions", icon: Package, color: "#F4845F", bg: "rgba(244,132,95,0.08)" },
          { label: "Monthly Recurring Revenue", icon: DollarSign, color: "#16a34a", bg: "rgba(74,222,128,0.08)" },
        ].map(({ label, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-2" />
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">All Clients</h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-48 opacity-50">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input disabled placeholder="Search clients..." className="bg-transparent text-xs text-gray-400 outline-none w-full cursor-not-allowed" />
          </div>
        </div>

        {/* Mock table — greyed out */}
        <div className="divide-y divide-gray-50 opacity-40 pointer-events-none select-none">
          {mockClients.map((client) => (
            <div key={client.name} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                >
                  {client.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-400">{client.email}</p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-gray-500">{client.service} · {client.plan}</div>
              <div className="text-xs font-semibold text-gray-900">SGD {client.mrr.toLocaleString()}/mo</div>
              <span className="badge-active">{client.status}</span>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300">
                  <PauseCircle size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300">
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5 pt-4 border-t border-gray-50">
          Live client data will appear here once Airwallex is connected. Pause and cancel actions will be enabled at that point.
        </p>
      </div>

      {/* Upcoming features */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <TrendingUp size={15} style={{ color: "#E05C83" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Admin Controls — Coming Soon</h2>
            <p className="text-xs text-gray-400 mt-0.5">Full client management once Airwallex is connected</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            "View client details",
            "Pause subscriptions",
            "Cancel subscriptions",
            "Assign services",
            "Apply promo codes",
            "View client invoices",
            "Override billing date",
            "Send manual invoice",
            "Xero invoice sync",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#E05C83" }} />
              {feat}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}