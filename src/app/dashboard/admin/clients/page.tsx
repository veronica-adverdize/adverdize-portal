import { Users, TrendingUp, DollarSign, Package } from "lucide-react";
import AdminSubscriptionActions from "@/components/admin/AdminSubscriptionActions";
import { createAdminClient } from "@/lib/supabase/admin";

async function getClientsData() {
  const supabase = createAdminClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select(`
      id,
      name,
      airwallex_customer_id,
      subscriptions (
        id,
        status,
        cancel_at_period_end,
        current_period_end,
        price:service_prices!price_id (
          amount,
          currency,
          billing_period,
          service_package:service_packages!service_package_id ( name )
        )
      )
    `)
    .neq("id", "00000000-0000-0000-0000-000000000001") // exclude Adverdize internal org
    .order("name");

  type SubPrice = {
    amount: number;
    currency: string;
    billing_period: string;
    service_package: { name: string } | null;
  };

  type OrgSub = {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
    price: SubPrice | null;
  };

  // Convert amount to monthly equivalent based on billing period
  function toMonthly(amount: number, period: string): number {
    switch (period) {
      case "quarterly": return amount / 3;
      case "semi_annual": return amount / 6;
      case "annual": return amount / 12;
      default: return amount; // monthly
    }
  }

  const clients = (orgs ?? []).map((org) => {
    const subs = (org.subscriptions ?? []) as unknown as OrgSub[];
    const activeSubs = subs.filter(
      (s) => s.status === "active" || s.status === "past_due"
    );

    // Calculate total MRR across all active subs for this org
    const mrr = activeSubs.reduce((sum, s) => {
      if (!s.price) return sum;
      const monthly = toMonthly(s.price.amount / 100, s.price.billing_period);
      return sum + monthly;
    }, 0);

    // Show all service names
    const packageNames = activeSubs
      .map((s) => s.price?.service_package?.name)
      .filter(Boolean) as string[];

    const primarySub = activeSubs[0] ?? null;
    const status = primarySub?.status ?? "no_subscription";

    return {
      id: org.id,
      name: org.name,
      airwallexCustomerId: org.airwallex_customer_id,
      subscriptionId: primarySub?.id ?? null,
      packageNames,
      activeSubCount: activeSubs.length,
      mrr: mrr > 0 ? mrr : null,
      status,
      cancelAtPeriodEnd: primarySub?.cancel_at_period_end ?? false,
    };
  });

  // Count ALL active subscriptions across all orgs, not just orgs with active status
  const activeCount = clients.reduce((sum, c) => sum + c.activeSubCount, 0);
  const totalMrr = clients.reduce((sum, c) => sum + (c.mrr ?? 0), 0);

  return { clients, activeCount, totalMrr };
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
        cancelling
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
        active
      </span>
    );
  }
  if (status === "past_due") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
        past due
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
        cancelled
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
      no plan
    </span>
  );
}

function periodLabel(period: string | null) {
  if (!period) return "";
  const map: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semi_annual: "Semi-Annual",
    annual: "Annual",
  };
  return map[period] ?? period;
}

export default async function AdminClientsPage() {
  const { clients, activeCount, totalMrr } = await getClientsData();

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all client accounts and subscriptions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(224,92,131,0.08)" }}>
              <Users size={15} style={{ color: "#E05C83" }} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(244,132,95,0.08)" }}>
              <Package size={15} style={{ color: "#F4845F" }} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalMrr > 0 ? `SGD ${totalMrr.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(74,222,128,0.08)" }}>
              <DollarSign size={15} style={{ color: "#16a34a" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Client table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">All Clients</h2>
          <span className="text-xs text-gray-400">{clients.length} organisation{clients.length !== 1 ? "s" : ""}</span>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-10">
            <Users size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No clients yet.</p>
            <p className="text-xs text-gray-300 mt-1">Clients will appear here once they sign up and subscribe.</p>
          </div>
        ) : (
          <>
            {/* Desktop column headers */}
            <div className="hidden sm:grid items-center gap-4 px-1 mb-2" style={{ gridTemplateColumns: "2fr 2fr 1fr 90px 56px" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Client</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Service</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">MRR</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
              <span />
            </div>

            {/* Mobile header */}
            <div className="sm:hidden grid grid-cols-3 gap-2 px-1 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Client</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">MRR</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
            </div>

            <div className="divide-y divide-gray-50">
              {clients.map((client) => (
                <div key={client.id}>
                  {/* Desktop row */}
                  <div
                    className="hidden sm:grid items-center gap-4 py-3.5 px-1"
                    style={{ gridTemplateColumns: "2fr 2fr 1fr 90px 56px" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                      >
                        {client.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                        {client.airwallexCustomerId ? (
                          <p className="text-xs text-gray-400 truncate font-mono">{client.airwallexCustomerId}</p>
                        ) : (
                          <p className="text-xs text-gray-300 truncate italic">No Airwallex ID</p>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      {client.packageNames.length > 0 ? (
                        client.packageNames.map((name, i) => (
                          <p key={i} className="text-xs text-gray-700 truncate font-medium">{name}</p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-300 italic">No service</p>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-gray-900">
                      {client.mrr != null ? `SGD ${Math.round(client.mrr).toLocaleString()}/mo` : "—"}
                    </div>

                    <div>
                      <StatusBadge status={client.status} cancelAtPeriodEnd={client.cancelAtPeriodEnd} />
                    </div>

                    <AdminSubscriptionActions
                      subscriptionId={client.subscriptionId ?? undefined}
                      cancelAtPeriodEnd={client.cancelAtPeriodEnd}
                      status={client.status}
                    />
                  </div>

                  {/* Mobile row — stacked layout */}
                  <div className="sm:hidden py-4 px-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                        >
                          {client.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                          {client.packageNames.length > 0 ? (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {client.packageNames.join(", ")}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300 italic mt-0.5">No service</p>
                          )}
                        </div>
                      </div>
                      <AdminSubscriptionActions
                        subscriptionId={client.subscriptionId ?? undefined}
                        cancelAtPeriodEnd={client.cancelAtPeriodEnd}
                        status={client.status}
                      />
                    </div>
                    <div className="flex items-center justify-between pl-12">
                      <p className="text-xs font-semibold text-gray-900">
                        {client.mrr != null ? `SGD ${Math.round(client.mrr).toLocaleString()}/mo` : "—"}
                      </p>
                      <StatusBadge status={client.status} cancelAtPeriodEnd={client.cancelAtPeriodEnd} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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
            <p className="text-xs text-gray-400 mt-0.5">More client management features on the way</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            "View client details",
            "Pause subscriptions",
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
