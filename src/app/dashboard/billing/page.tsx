import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, RefreshCw, XCircle, ArrowUpDown } from "lucide-react";
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
        <h1 className="text-xl font-display font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your subscriptions and payment methods.</p>
      </div>

      {params.success && (
        <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
          Subscription activated successfully. Welcome aboard!
        </div>
      )}

      {(subscriptions?.length ?? 0) === 0 ? (
        <div className="card p-8 text-center">
          <CreditCard size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">No active subscriptions</p>
          <p className="text-xs text-gray-400 mb-4">Browse our services to get started.</p>
          <Link href="/dashboard/services" className="btn-primary">
            Browse services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions?.map((sub) => (
            <div key={sub.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {sub.service?.name}
                    </h3>
                    <span className={sub.status === "active" ? "badge-active" : "badge-warning"}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 capitalize">
                    SGD {((sub.price?.amount ?? 0) / 100).toLocaleString()} ·{" "}
                    {sub.price?.billing_period?.replace("_", " ")}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Renews{" "}
                  {new Date(sub.current_period_end).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {sub.cancel_at_period_end && (
                <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  Cancels at end of current billing period.
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
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

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Invoice history</h3>
            <p className="text-xs text-gray-400 mt-0.5">View and download past invoices</p>
          </div>
          <Link href="/dashboard/billing/invoices" className="btn-outline text-xs">
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
