import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, FileText } from "lucide-react";

export default function AdminReportsPage() {
  const stats = [
    { label: "Monthly Recurring Revenue", abbr: "MRR", icon: DollarSign, color: "#E05C83", bg: "rgba(224,92,131,0.08)" },
    { label: "Total Revenue (All Time)", abbr: "Revenue", icon: TrendingUp, color: "#F4845F", bg: "rgba(244,132,95,0.08)" },
    { label: "Active Clients", abbr: "Clients", icon: Users, color: "#16a34a", bg: "rgba(74,222,128,0.08)" },
    { label: "Churn Rate", abbr: "Churn", icon: ArrowUpRight, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  ];

  const mockMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const mockValues = [65, 70, 68, 78, 82, 90];
  const maxVal = Math.max(...mockValues);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Revenue, subscriptions, and growth metrics.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, abbr, icon: Icon, color, bg }) => (
          <div key={abbr} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* MRR chart placeholder */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <BarChart3 size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Revenue Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly recurring revenue trend</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>

        {/* Placeholder bar chart */}
        <div className="flex items-end gap-2 h-36 opacity-30 pointer-events-none select-none px-2">
          {mockMonths.map((month, i) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${(mockValues[i] / maxVal) * 120}px`,
                  background: i === mockMonths.length - 1
                    ? "linear-gradient(180deg, #E05C83, #F4845F)"
                    : "#E5E7EB",
                }}
              />
              <span className="text-[10px] text-gray-400">{month}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 pt-4 border-t border-gray-50">
          Live revenue data will appear here once Airwallex is connected.
        </p>
      </div>

      {/* Top services */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
          >
            <TrendingUp size={15} style={{ color: "#F4845F" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Top Services by Revenue</h2>
            <p className="text-xs text-gray-400 mt-0.5">Which packages generate the most MRR</p>
          </div>
        </div>

        <div className="space-y-3 opacity-30 pointer-events-none select-none">
          {[
            { name: "Social Media Management", pct: 100, color: "#E05C83" },
            { name: "SEO", pct: 79, color: "#F4845F" },
            { name: "Google Ads", pct: 67, color: "#6366f1" },
            { name: "Social Media Ads", pct: 54, color: "#10b981" },
          ].map((service) => (
            <div key={service.name}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">{service.name}</p>
                <div className="h-3 w-14 bg-gray-100 rounded" />
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${service.pct}%`, backgroundColor: service.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Xero sync */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logos/xero.webp" alt="Xero" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Xero Invoice Sync</h2>
              <p className="text-xs text-gray-400 mt-0.5">Auto-generate invoices in Xero from Airwallex payments</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-100 tracking-wide">
            PENDING SETUP
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: FileText, label: "Auto-create invoices", desc: "Invoice generated in Xero on every successful payment" },
            { icon: Users, label: "Client sync", desc: "Contacts synced from portal to Xero automatically" },
            { icon: DollarSign, label: "Revenue reconciliation", desc: "Match Airwallex payments to Xero transactions" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 opacity-60">
              <Icon size={15} className="text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Xero integration requires OAuth credentials. Contact your Adverdize account manager to get this set up.
        </p>
      </div>

    </div>
  );
}