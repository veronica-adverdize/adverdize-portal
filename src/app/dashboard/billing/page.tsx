import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, ArrowUpDown, Package, FileText } from "lucide-react";
import Link from "next/link";
import CancelButton from "@/components/billing/CancelButton";
import PortalButton from "@/components/billing/PortalButton";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id, organisation:organisations(airwallex_customer_id)")
    .eq("id", user.id)
    .single();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, service:service_packages(*), price:service_prices(*)")
    .eq("organisation_id", profile?.organisation_id)
    .in("status", ["active", "past_due", "trialing"]);

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
                        SGD {((sub.price?.amount ?? 0) / 100).toLocaleString()} ·{" "}
                        {sub.price?.billing_period?.replace("_", " ")} plan
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    Renews{" "}
                    {new Date(sub.current_period_end).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
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
              <p className="text-xs text-gray-400 mt-0.5">View and download past invoices</p>
            </div>
          </div>
          <Link href="/dashboard/billing/invoices" className="btn-outline text-xs">
            View all
          </Link>
        </div>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
          <CreditCard size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">Invoice history coming soon</p>
          <p className="text-xs text-gray-400 mt-1">
            Available once Airwallex billing is connected to your account.
          </p>
        </div>
      </div>

    </div>
  );
}