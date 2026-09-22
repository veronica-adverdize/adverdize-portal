import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, CreditCard, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, service:service_packages(*), price:service_prices(*)")
    .eq("organisation_id", profile?.organisation_id)
    .eq("status", "active");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("organisation_id", profile?.organisation_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const activeCount = subscriptions?.length ?? 0;
  const unpaidCount = invoices?.filter((i) => i.status === "unpaid").length ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">
          Good to see you, {profile?.full_name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s a summary of your account with Adverdize.
        </p>
      </div>

      {unpaidCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {unpaidCount} unpaid invoice{unpaidCount > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Please settle outstanding invoices to avoid service interruption.{" "}
              <Link href="/dashboard/billing/invoices" className="underline">
                View invoices
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Active services",
            value: activeCount,
            icon: Package,
            href: "/dashboard/services",
            color: "#E8405A",
          },
          {
            label: "Unpaid invoices",
            value: unpaidCount,
            icon: AlertCircle,
            href: "/dashboard/billing/invoices",
            color: unpaidCount > 0 ? "#F59E0B" : "#6B7280",
          },
          {
            label: "Total invoices",
            value: invoices?.length ?? 0,
            icon: FileText,
            href: "/dashboard/billing/invoices",
            color: "#6B7280",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="card p-5 hover:border-gray-200 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-3xl font-display font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Active services</h2>
            <Link href="/dashboard/services" className="text-xs text-brand-pink hover:underline">
              Manage
            </Link>
          </div>

          {activeCount === 0 ? (
            <div className="text-center py-8">
              <Package size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active services yet.</p>
              <Link href="/dashboard/services" className="btn-primary mt-3 text-xs">
                Browse services
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions?.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.service?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {sub.price?.billing_period?.replace("_", " ")} · SGD {(sub.price?.amount / 100).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge-active">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent invoices</h2>
            <Link href="/dashboard/billing/invoices" className="text-xs text-brand-pink hover:underline">
              View all
            </Link>
          </div>

          {(invoices?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <FileText size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No invoices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices?.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      SGD {(inv.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(inv.created_at).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={
                      inv.status === "paid" ? "badge-active" : "badge-warning"
                    }
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
