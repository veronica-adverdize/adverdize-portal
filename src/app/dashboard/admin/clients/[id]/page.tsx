import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CreditCard,
  Receipt,
  Tag,
  Clock,
  ExternalLink,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminSubscriptionActions from "@/components/admin/AdminSubscriptionActions";
import AdminPromoApply from "@/components/admin/AdminPromoApply";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-600 border-green-100",
    trialing: "bg-blue-50 text-blue-600 border-blue-100",
    past_due: "bg-red-50 text-red-600 border-red-100",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    paused: "bg-amber-50 text-amber-600 border-amber-100",
    paid: "bg-green-50 text-green-600 border-green-100",
    unpaid: "bg-red-50 text-red-600 border-red-100",
    void: "bg-gray-100 text-gray-400 border-gray-200",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-green-50 text-green-600 border-green-100",
    rejected: "bg-red-50 text-red-600 border-red-100",
    completed: "bg-blue-50 text-blue-600 border-blue-100",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-400 border-gray-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function periodLabel(period: string) {
  const map: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semi_annual: "Semi-Annual",
    annual: "Annual",
  };
  return map[period] ?? period;
}

function formatCents(amount: number, currency = "SGD") {
  return `${currency} ${(amount / 100).toLocaleString("en-SG", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch org
  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, airwallex_customer_id, created_at, logo_url")
    .eq("id", id)
    .single();

  if (!org) notFound();

  // Fetch all related data in parallel
  const [
    { data: members },
    { data: subscriptions },
    { data: invoices },
    { data: promoRedemptions },
    { data: changeRequests },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("organisation_id", id)
      .order("full_name"),
    supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        cancel_at_period_end,
        current_period_start,
        current_period_end,
        created_at,
        price:service_prices!price_id (
          amount,
          currency,
          billing_period,
          service_package:service_packages!service_package_id ( name )
        )
      `)
      .eq("organisation_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, amount, currency, status, invoice_url, paid_at, created_at")
      .eq("organisation_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("promo_redemptions")
      .select(`
        id,
        created_at,
        redeemed_by,
        promo_code:promo_codes!promo_code_id ( code, description, discount_type, discount_value )
      `)
      .eq("organisation_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("change_requests")
      .select("id, request_type, status, admin_notes, created_at, updated_at, requested_by")
      .eq("organisation_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Determine overall org status from subscriptions
  const activeSub = (subscriptions ?? []).find(
    (s) => s.status === "active" || s.status === "trialing"
  );
  const orgStatus = activeSub ? activeSub.status : (subscriptions?.length ? "inactive" : "no_subscription");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/clients"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
          >
            {org.name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-gray-900 truncate">{org.name}</h1>
              <StatusBadge status={orgStatus} />
            </div>
            {org.airwallex_customer_id && (
              <p className="text-xs text-gray-400 font-mono truncate">{org.airwallex_customer_id}</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Info + Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} style={{ color: "#E05C83" }} />
            <h2 className="text-sm font-semibold text-gray-900">Client Info</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Organisation Name</dt>
              <dd className="text-sm text-gray-700 mt-0.5">{org.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Airwallex Customer ID</dt>
              <dd className="text-sm text-gray-700 mt-0.5 font-mono">
                {org.airwallex_customer_id || <span className="text-gray-300 italic">Not linked</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Created</dt>
              <dd className="text-sm text-gray-700 mt-0.5">{formatDate(org.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: "#F4845F" }} />
              <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
            </div>
            <span className="text-xs text-gray-400">{(members ?? []).length} member{(members ?? []).length !== 1 ? "s" : ""}</span>
          </div>
          {(members ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No members found.</p>
          ) : (
            <div className="space-y-2.5">
              {(members ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{m.full_name || m.email}</p>
                    {m.full_name && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                    {m.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: "#E05C83" }} />
            <h2 className="text-sm font-semibold text-gray-900">Subscriptions</h2>
          </div>
          <span className="text-xs text-gray-400">{(subscriptions ?? []).length} total</span>
        </div>

        {(subscriptions ?? []).length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No subscriptions.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid items-center gap-4 px-1 mb-2" style={{ gridTemplateColumns: "2fr 1fr 1fr 90px 1fr 56px" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Service</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Billing</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Amount</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Period End</span>
                <span />
              </div>
              <div className="divide-y divide-gray-50">
                {(subscriptions ?? []).map((sub: any) => (
                  <div key={sub.id} className="grid items-center gap-4 py-3 px-1" style={{ gridTemplateColumns: "2fr 1fr 1fr 90px 1fr 56px" }}>
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {sub.price?.service_package?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{sub.price ? periodLabel(sub.price.billing_period) : "-"}</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {sub.price ? formatCents(sub.price.amount, sub.price.currency) : "-"}
                    </p>
                    <div>
                      <StatusBadge status={sub.cancel_at_period_end ? "cancelling" : sub.status} />
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(sub.current_period_end)}</p>
                    <AdminSubscriptionActions
                      subscriptionId={sub.id}
                      cancelAtPeriodEnd={sub.cancel_at_period_end}
                      status={sub.status}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {(subscriptions ?? []).map((sub: any) => (
                <div key={sub.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {sub.price?.service_package?.name ?? "Unknown"}
                    </p>
                    <StatusBadge status={sub.cancel_at_period_end ? "cancelling" : sub.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{sub.price ? periodLabel(sub.price.billing_period) : "-"}</span>
                    <span className="font-semibold text-gray-900">
                      {sub.price ? formatCents(sub.price.amount, sub.price.currency) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Ends {formatDate(sub.current_period_end)}</span>
                    <AdminSubscriptionActions
                      subscriptionId={sub.id}
                      cancelAtPeriodEnd={sub.cancel_at_period_end}
                      status={sub.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Invoices */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt size={15} style={{ color: "#F4845F" }} />
            <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          </div>
          <span className="text-xs text-gray-400">{(invoices ?? []).length} total</span>
        </div>

        {(invoices ?? []).length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No invoices.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid items-center gap-4 px-1 mb-2" style={{ gridTemplateColumns: "1fr 1fr 90px 1fr 40px" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Amount</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Paid At</span>
                <span />
              </div>
              <div className="divide-y divide-gray-50">
                {(invoices ?? []).map((inv) => (
                  <div key={inv.id} className="grid items-center gap-4 py-3 px-1" style={{ gridTemplateColumns: "1fr 1fr 90px 1fr 40px" }}>
                    <p className="text-xs text-gray-500">{formatDate(inv.created_at)}</p>
                    <p className="text-xs font-semibold text-gray-900">{formatCents(inv.amount, inv.currency)}</p>
                    <div><StatusBadge status={inv.status} /></div>
                    <p className="text-xs text-gray-500">{inv.paid_at ? formatDate(inv.paid_at) : "-"}</p>
                    <div>
                      {inv.invoice_url && (
                        <a
                          href={inv.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {(invoices ?? []).map((inv) => (
                <div key={inv.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">{formatDate(inv.created_at)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{formatCents(inv.amount, inv.currency)}</p>
                    {inv.invoice_url && (
                      <a
                        href={inv.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        View <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Promo Codes */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={15} style={{ color: "#E05C83" }} />
          <h2 className="text-sm font-semibold text-gray-900">Promo Codes</h2>
        </div>

        {/* Redeemed promos */}
        {(promoRedemptions ?? []).length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Redeemed</p>
            <div className="space-y-2">
              {(promoRedemptions ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-mono font-semibold text-gray-900">{r.promo_code?.code ?? "Unknown"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.promo_code?.description ?? ""}{" "}
                      {r.promo_code && (
                        <span className="font-medium">
                          ({r.promo_code.discount_type === "percentage"
                            ? `${r.promo_code.discount_value}% off`
                            : formatCents(r.promo_code.discount_value)})
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDate(r.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply new promo */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Apply New Promo</p>
          <AdminPromoApply orgId={org.id} />
        </div>
      </div>

      {/* Change Requests */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: "#F4845F" }} />
            <h2 className="text-sm font-semibold text-gray-900">Change Requests</h2>
          </div>
          <span className="text-xs text-gray-400">{(changeRequests ?? []).length} total</span>
        </div>

        {(changeRequests ?? []).length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No change requests.</p>
        ) : (
          <div className="space-y-3">
            {(changeRequests ?? []).map((cr) => (
              <div key={cr.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">{cr.request_type}</span>
                    <StatusBadge status={cr.status} />
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(cr.created_at)}</p>
                </div>
                {cr.admin_notes && (
                  <p className="text-xs text-gray-500 mt-1">{cr.admin_notes}</p>
                )}
                {cr.updated_at !== cr.created_at && (
                  <p className="text-[10px] text-gray-400 mt-2">Updated {formatDate(cr.updated_at)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
