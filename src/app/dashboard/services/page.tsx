import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import Link from "next/link";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const { data: services } = await supabase
    .from("service_packages")
    .select("*, prices:service_prices(*)")
    .eq("is_active", true)
    .order("created_at");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("service_id, status")
    .eq("organisation_id", profile?.organisation_id)
    .eq("status", "active");

  const subscribedServiceIds = new Set(subscriptions?.map((s) => s.service_id));

  const periodLabels: Record<string, string> = {
    monthly: "/ mo",
    quarterly: "/ 3 mo",
    semi_annual: "/ 6 mo",
    annual: "/ yr",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Services</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a plan that fits your growth goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {services?.map((service) => {
          const isActive = subscribedServiceIds.has(service.id);
          const monthlyPrice = service.prices?.find(
            (p: { billing_period: string }) => p.billing_period === "monthly"
          );

          return (
            <div
              key={service.id}
              className={`card p-5 flex flex-col ${isActive ? "ring-2 ring-brand-pink" : ""}`}
            >
              {isActive && (
                <div className="flex justify-end mb-2">
                  <span className="badge-active">Active</span>
                </div>
              )}

              <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{service.description}</p>

              {monthlyPrice && (
                <div className="mt-4 mb-4">
                  <span className="text-2xl font-display font-bold text-gray-900">
                    SGD {(monthlyPrice.amount / 100).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">/ mo</span>
                </div>
              )}

              <ul className="space-y-1.5 flex-1 mb-5">
                {service.features?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={12} className="text-brand-pink mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {service.prices && service.prices.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">Billing options</p>
                  {service.prices
                    .sort((a: { billing_period: string }, b: { billing_period: string }) => {
                      const order = ["monthly", "quarterly", "semi_annual", "annual"];
                      return order.indexOf(a.billing_period) - order.indexOf(b.billing_period);
                    })
                    .map((price: { id: string; billing_period: string; amount: number }) => (
                      <div key={price.id} className="flex justify-between text-xs">
                        <span className="text-gray-400 capitalize">
                          {price.billing_period.replace("_", " ")}
                        </span>
                        <span className="font-medium text-gray-700">
                          SGD {(price.amount / 100).toLocaleString()}
                          {periodLabels[price.billing_period]}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {isActive ? (
                <Link
                  href="/dashboard/billing"
                  className="btn-outline w-full text-center"
                >
                  Manage subscription
                </Link>
              ) : (
                <Link
                  href={`/dashboard/billing/checkout?service=${service.id}`}
                  className="btn-primary w-full text-center"
                >
                  Subscribe
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
