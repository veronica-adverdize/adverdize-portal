import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, FileText, CheckCircle, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

async function getReportsData() {
  const supabase = createAdminClient();

  // Parallel queries
  const [orgsResult, subsResult, invoicesResult] = await Promise.all([
    supabase
      .from("organisations")
      .select("id")
      .neq("id", "00000000-0000-0000-0000-000000000001"),
    supabase
      .from("subscriptions")
      .select("status, cancel_at_period_end, service_prices ( amount, billing_period )")
      .in("status", ["active", "past_due"]),
    supabase
      .from("invoices")
      .select("amount, currency, status, paid_at")
      .order("paid_at", { ascending: false })
      .limit(10),
  ]);

  const totalClients = orgsResult.data?.length ?? 0;

  type SubRow = {
    status: string;
    cancel_at_period_end: boolean;
    service_prices: { amount: number; billing_period: string }[] | null;
  };

  type InvoiceRow = {
    amount: number;
    currency: string;
    status: string;
    paid_at: string | null;
  };

  const allSubs = (subsResult.data ?? []) as unknown as SubRow[];
  const allInvoices = (invoicesResult.data ?? []) as unknown as InvoiceRow[];

  const activeSubs = allSubs.filter((s) => s.status === "active");
  const activeSubCount = activeSubs.length;

  // MRR: sum of active subscriptions' monthly-equivalent amounts
  // service_prices is an array from the join; take the first entry
  const mrr = activeSubs.reduce((sum, s) => {
    const price = Array.isArray(s.service_prices) ? s.service_prices[0] : null;
    if (!price) return sum;
    return sum + price.amount / 100;
  }, 0);

  // Total revenue from paid invoices
  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount / 100, 0);

  // Cancelling count
  const cancellingCount = allSubs.filter((s) => s.cancel_at_period_end).length;
  const churnRate = activeSubCount > 0
    ? Math.round((cancellingCount / activeSubCount) * 100)
    : 0;

  const recentInvoices: InvoiceRow[] = allInvoices.slice(0, 5);
  const totalInvoiceCount = allInvoices.length;

  return { totalClients, activeSubCount, mrr, totalRevenue, churnRate, recentInvoices, totalInvoiceCount };
}

export default async function AdminReportsPage() {
  const { totalClients, activeSubCount, mrr, totalRevenue, churnRate, recentInvoices, totalInvoiceCount } =
    await getReportsData();

  const hasData = activeSubCount > 0 || totalRevenue > 0;

  const stats = [
    {
      label: "Monthly Recurring Revenue",
      abbr: "MRR",
      icon: DollarSign,
      color: "#E05C83",
      bg: "rgba(224,92,131,0.08)",
      value: mrr > 0 ? `SGD ${mrr.toLocaleString()}` : "—",
    },
    {
      label: "Total Revenue (All Time)",
      abbr: "Revenue",
      icon: TrendingUp,
      color: "#F4845F",
      bg: "rgba(244,132,95,0.08)",
      value: totalRevenue > 0 ? `SGD ${totalRevenue.toLocaleString()}` : "—",
    },
    {
      label: "Active Clients",
      abbr: "Clients",
      icon: Users,
      color: "#16a34a",
      bg: "rgba(74,222,128,0.08)",
      value: String(totalClients),
    },
    {
      label: "Churn Rate",
      abbr: "Churn",
      icon: ArrowUpRight,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.08)",
      value: activeSubCount > 0 ? `${churnRate}%` : "—",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Revenue, subscriptions, and growth metrics.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, abbr, icon: Icon, color, bg, value }) => (
          <div key={abbr} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* MRR chart — placeholder until Airwallex is live */}
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
          {!hasData && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
              AWAITING DATA
            </span>
          )}
        </div>

        {hasData ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Revenue chart will render once monthly invoice history builds up.
          </p>
        ) : (
          <>
            {/* Placeholder bar chart */}
            <div className="flex items-end gap-2 h-36 opacity-20 pointer-events-none select-none px-2">
              {[65, 70, 68, 78, 82, 90].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${(v / 90) * 120}px`,
                      background: i === 5
                        ? "linear-gradient(180deg, #E05C83, #F4845F)"
                        : "#E5E7EB",
                    }}
                  />
                  <span className="text-[10px] text-gray-400">
                    {["Apr","May","Jun","Jul","Aug","Sep"][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4 pt-4 border-t border-gray-50">
              Live revenue data will appear here once clients are subscribed.
            </p>
          </>
        )}
      </div>

      {/* Recent invoices */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
          >
            <FileText size={15} style={{ color: "#F4845F" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last payments synced from Airwallex</p>
          </div>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No invoices yet.</p>
            <p className="text-xs text-gray-300 mt-1">Invoices will appear here once clients make payments.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentInvoices.map((inv, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  {inv.status === "paid" ? (
                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {inv.currency} {(inv.amount / 100).toLocaleString()}
                    </p>
                    {inv.paid_at && (
                      <p className="text-xs text-gray-400">
                        {new Date(inv.paid_at).toLocaleDateString("en-SG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                    inv.status === "paid"
                      ? "bg-green-50 text-green-600 border-green-100"
                      : inv.status === "open"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-red-50 text-red-500 border-red-100"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
          {totalInvoiceCount > 5 && (
            <div className="pt-4 mt-1 border-t border-gray-50 text-center">
              <Link
                href="/dashboard/admin/invoices"
                className="text-xs font-medium hover:underline"
                style={{ color: "#E05C83" }}
              >
                View all {totalInvoiceCount} invoices →
              </Link>
            </div>
          )}
        )}
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
