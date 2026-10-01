import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { CreditCard, ArrowUpDown, Package, FileText, Tag, ArrowDownUp, PauseCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import CancelButton from "@/components/billing/CancelButton";
import PortalButton from "@/components/billing/PortalButton";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  noStore();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Use admin client for data queries (server component only)
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("users")
    .select("organisation_id, organisation:organisations(airwallex_customer_id)")
    .eq("id", user.id)
    .single();

  const { data: subscriptions } = await adminClient
    .from("subscriptions")
    .select("*, service:service_packages(*), price:service_prices!price_id(*)")
    .eq("organisation_id", profile?.organisation_id)
    .in("status", ["active", "past_due", "trialing"]);

  const { data: recentInvoices } = await adminClient
    .from("invoices")
    .select("id, amount, currency, status, paid_at, invoice_url")
    .eq("organisation_id", profile?.organisation_id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your subscriptions and payment methods.</p>
      </div>

      {params.success && (
        <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
          ✓ Subscription activated successfully. Welcome aboard!
        </div>
      )}

      {/* Subscriptions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Active Subscriptions</h2>
          <Link
            href="/dashboard/services"
            className="text-xs font-medium transition-colors"
            style={{ color: "#E05C83" }}
          >
            Browse services
          </Link>
        </div>

        {(subscriptions?.length ?? 0) === 0 ? (
          <div className="text-center py-10">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No active subscriptions</p>
            <p className="text-xs text-gray-400 mt-1">Browse our services to get started.</p>
            <Link href="/dashboard/services" className="btn-primary mt-4 text-xs inline-flex">
              Browse services
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscriptions?.map((sub) => (
              <div key={sub.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
                    >
                      <Package size={15} style={{ color: "#E05C83" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{sub.service?.name}</p>
                        <span className={sub.status === "active" ? "badge-active" : "badge-warning"}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        SGD {((sub.price?.amount ?? 0) / 100).toLocaleString()}/mo ·{" "}
                        {sub.price?.billing_period?.replace("_", " ")} plan
                      </p>
                    </div>
                  </div>
                  {sub.current_period_end && (
                    <p className="text-xs text-gray-400 shrink-0">
                      Renews{" "}
                      {new Date(sub.current_period_end).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {sub.cancel_at_period_end && (
                  <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                    Cancels at end of current billing period.
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                  <PortalButton
                    customerId={(profile?.organisation as { airwallex_customer_id?: string })?.airwallex_customer_id}
                  />
                  <Link
                    href={`/dashboard/billing/subscription?id=${sub.id}`}
                    className="btn-outline text-xs gap-1.5"
                  >
                    <ArrowUpDown size={13} />
                    Change plan
                  </Link>
                  {!sub.cancel_at_period_end && (
                    <CancelButton subscriptionId={sub.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment method — coming soon */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <CreditCard size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your saved card for automatic billing</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-7 rounded bg-gray-200 shrink-0" />
          <div>
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse mt-1.5" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Card management will be available via Airwallex once your account is connected. Your card details are stored securely by Airwallex — we never see or store them.
        </p>
      </div>

      {/* Mid-cycle changes — coming soon */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
            >
              <ArrowDownUp size={15} style={{ color: "#F4845F" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Mid-Cycle Changes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Upgrade or downgrade your plan anytime</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-dashed border-gray-200 p-4 opacity-50">
            <p className="text-xs font-semibold text-gray-700">Upgrade Plan</p>
            <p className="text-xs text-gray-400 mt-0.5">Switch to a higher tier. Pro-rated charges apply for the remainder of your billing cycle.</p>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 p-4 opacity-50">
            <p className="text-xs font-semibold text-gray-700">Downgrade Plan</p>
            <p className="text-xs text-gray-400 mt-0.5">Switch to a lower tier. Change takes effect at the start of your next billing cycle.</p>
          </div>
        </div>
      </div>

      {/* Promo code — coming soon */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <Tag size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Promo Code</h3>
              <p className="text-xs text-gray-400 mt-0.5">Apply a discount or referral code</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="flex gap-2 opacity-50">
          <input
            disabled
            placeholder="Enter promo code"
            className="input flex-1 cursor-not-allowed"
          />
          <button disabled className="btn-primary text-xs cursor-not-allowed opacity-80 shrink-0">
            Apply
          </button>
        </div>
      </div>

      {/* Pause subscription — coming soon */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
            >
              <PauseCircle size={15} style={{ color: "#F4845F" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Pause Subscription</h3>
              <p className="text-xs text-gray-400 mt-0.5">Temporarily pause billing without cancelling</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Pausing your subscription will stop billing for the selected period. Your account and data remain intact. Available once Airwallex is connected.
        </p>
      </div>

      {/* Invoice history */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <FileText size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Invoice History</h3>
              <p className="text-xs text-gray-400 mt-0.5">All invoices are auto-paid via your stored card</p>
            </div>
          </div>
          <Link href="/dashboard/billing/invoices" className="btn-outline text-xs">
            View all
          </Link>
        </div>

        {(recentInvoices?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <FileText size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">No invoices yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Invoices will appear here once your first payment is processed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentInvoices!.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inv.currency} {(inv.amount / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inv.paid_at
                      ? new Date(inv.paid_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
                      : "Pending"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={inv.status === "paid" ? "badge-active" : "badge-warning"}>
                    {inv.status}
                  </span>
                  {inv.invoice_url && (
                    <a
                      href={inv.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "#E05C83" }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}