import { Package, Tag, Plus, Eye, EyeOff } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type Price = {
  id: string;
  billing_period: string;
  amount: number;
  currency: string;
  airwallex_price_id: string | null;
  is_active: boolean;
};

type ServicePackage = {
  id: string;
  name: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  prices: Price[];
};

async function getServicesData(): Promise<ServicePackage[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("service_packages")
    .select(`
      id,
      name,
      description,
      features,
      is_active,
      service_prices (
        id,
        billing_period,
        amount,
        currency,
        airwallex_price_id,
        is_active
      )
    `)
    .order("name");

  return (data ?? []).map((pkg) => ({
    ...pkg,
    prices: (pkg.service_prices ?? []).sort((a: Price, b: Price) => {
      const order = ["monthly", "quarterly", "semi_annual", "annual"];
      return order.indexOf(a.billing_period) - order.indexOf(b.billing_period);
    }),
  }));
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

export default async function AdminServicesPage() {
  const packages = await getServicesData();

  // Group by category prefix for cleaner display
  const activePackages = packages.filter((p) => p.is_active);
  const inactivePackages = packages.filter((p) => !p.is_active);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-400 mt-1">
            {packages.length} service package{packages.length !== 1 ? "s" : ""} configured.
          </p>
        </div>
        <button
          disabled
          className="btn-primary text-xs gap-1.5 opacity-50 cursor-not-allowed"
        >
          <Plus size={13} />
          New package
        </button>
      </div>

      {/* Package list */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <Package size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Service Packages</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your current service offerings and pricing</p>
            </div>
          </div>
        </div>

        {packages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No packages found.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activePackages.map((pkg) => (
              <div key={pkg.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <button
                      disabled
                      title="Toggle visibility (coming soon)"
                      className="p-1.5 rounded-lg text-gray-300 opacity-40 cursor-not-allowed"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pkg.prices.map((price) => (
                    <div
                      key={price.id}
                      className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border ${
                        price.airwallex_price_id && !price.airwallex_price_id.startsWith("placeholder_")
                          ? "bg-green-50 border-green-100"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <span className="text-gray-500">{periodLabel(price.billing_period)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-semibold text-gray-700">
                        {price.currency} {(price.amount / 100).toLocaleString()}/mo
                      </span>
                      {price.airwallex_price_id && price.airwallex_price_id.startsWith("placeholder_") && (
                        <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 rounded px-1">
                          placeholder
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {inactivePackages.length > 0 && (
              <>
                <div className="pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Hidden from clients
                  </p>
                  {inactivePackages.map((pkg) => (
                    <div key={pkg.id} className="py-3 opacity-50">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          Hidden
                        </span>
                        <button disabled className="p-1 rounded text-gray-300 cursor-not-allowed">
                          <EyeOff size={12} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.prices.map((price) => (
                          <div
                            key={price.id}
                            className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5"
                          >
                            <span className="text-gray-500">{periodLabel(price.billing_period)}</span>
                            <span className="text-gray-300">·</span>
                            <span className="font-semibold text-gray-700">
                              {price.currency} {(price.amount / 100).toLocaleString()}/mo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-5 pt-4 border-t border-gray-50">
          Prices with <span className="text-amber-500 font-medium">placeholder</span> IDs are not yet linked to live Airwallex products.
          Package editing will be enabled once Airwallex is connected.
        </p>
      </div>

      {/* Promo codes */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
            >
              <Tag size={15} style={{ color: "#F4845F" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Promo Codes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create discount codes for clients</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>

        <div className="text-center py-8">
          <Tag size={24} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">No promo codes yet.</p>
          <p className="text-xs text-gray-300 mt-1">Promo code management will be available once Airwallex is fully configured.</p>
        </div>

        <button disabled className="btn-outline text-xs gap-1.5 w-full opacity-50 cursor-not-allowed">
          <Plus size={13} />
          Create promo code
        </button>
      </div>

    </div>
  );
}