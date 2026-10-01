import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { Package, CreditCard, ArrowRight, CheckCircle2, BarChart3, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { syncBillingData } from "@/lib/billing-sync";

export default async function DashboardPage() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Use admin client for data queries (server component — never exposed to browser)
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  // Sync latest billing data from Airwallex
  if (profile?.organisation_id) {
    await syncBillingData(adminClient, profile.organisation_id, profile.organisation);
  }

  const { data: subscriptions } = await adminClient
    .from("subscriptions")
    .select("*, service:service_packages(*), price:service_prices!price_id(*)")
    .eq("organisation_id", profile?.organisation_id)
    .eq("status", "active");

  const activeCount = subscriptions?.length ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Here&apos;s a summary of your account with Adverdize.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Active Services</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-1">{activeCount}</p>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.1)" }}
            >
              <Package size={16} style={{ color: "#E05C83" }} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Next Billing</p>
              {subscriptions && subscriptions.length > 0 && subscriptions[0].current_period_end ? (
                <>
                  <p className="text-lg font-display font-bold text-gray-900 mt-1">
                    {new Date(subscriptions[0].current_period_end).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    SGD {((subscriptions[0] as { price?: { amount?: number } }).price?.amount ? ((subscriptions[0] as { price?: { amount?: number } }).price!.amount! / 100).toLocaleString() : "—")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-display font-bold text-gray-900 mt-1">—</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activeCount > 0 ? "Billing date pending" : "No active subscription"}</p>
                </>
              )}
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(244,132,95,0.1)" }}
            >
              <CreditCard size={16} style={{ color: "#F4845F" }} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Account Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <p className="text-sm font-semibold text-gray-900">Active</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{profile?.organisation?.name}</p>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(74,222,128,0.1)" }}
            >
              <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Active subscriptions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Your Subscriptions</h2>
          <Link
            href="/dashboard/services"
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: "#E05C83" }}
          >
            Browse services <ArrowRight size={12} />
          </Link>
        </div>

        {activeCount === 0 ? (
          <div className="text-center py-10">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No active subscriptions yet</p>
            <p className="text-xs text-gray-400 mt-1">Subscribe to a service to get started.</p>
            <Link href="/dashboard/services" className="btn-primary mt-4 text-xs inline-flex">
              Browse services
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscriptions?.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
                  >
                    <Package size={14} style={{ color: "#E05C83" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.service?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      SGD {(sub.price?.amount / 100).toLocaleString()}/mo · {sub.price?.billing_period?.replace("_", " ")} plan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-active">Active</span>
                  <Link href="/dashboard/billing" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign performance — coming soon */}
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
              <h2 className="text-sm font-semibold text-gray-900">Campaign Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time stats from your active campaigns</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {["Impressions", "Clicks", "Ad Spend"].map((label) => (
            <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-2">{label}</p>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">
          Live campaign data will appear here once your services are active and reporting is configured.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
          >
            <Zap size={15} style={{ color: "#F4845F" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage your services in one click</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/billing"
            className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-700">Upgrade Plan</p>
            <p className="text-xs text-gray-400 mt-0.5">Move to a higher tier mid-cycle</p>
          </Link>
          <Link
            href="/dashboard/services"
            className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-700">Add Service</p>
            <p className="text-xs text-gray-400 mt-0.5">Subscribe to an additional service</p>
          </Link>
          <Link
            href="/dashboard/billing"
            className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-700">Apply Promo Code</p>
            <p className="text-xs text-gray-400 mt-0.5">Enter a discount or referral code</p>
          </Link>
        </div>
      </div>

      {/* Billing & Invoices */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <TrendingUp size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Billing &amp; Invoices</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your payment history and upcoming charges</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: "#E05C83" }}
          >
            View billing <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Manage your payment methods, view invoices, apply promo codes and more from the{" "}
          <Link href="/dashboard/billing" className="underline" style={{ color: "#E05C83" }}>
            billing page
          </Link>.
        </p>
      </div>

    </div>
  );
}