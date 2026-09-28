import { Package, Tag, Plus, Pencil, Eye, EyeOff } from "lucide-react";

const mockPackages = [
  {
    name: "Social Media Management",
    plans: [
      { period: "Monthly", price: 1200 },
      { period: "Quarterly", price: 1100 },
      { period: "Semi-Annual", price: 1000 },
    ],
    visible: true,
  },
  {
    name: "Search Engine Optimisation (SEO)",
    plans: [
      { period: "Monthly", price: 950 },
      { period: "Quarterly", price: 880 },
      { period: "Semi-Annual", price: 820 },
    ],
    visible: true,
  },
  {
    name: "Search Engine Marketing (Google Ads)",
    plans: [
      { period: "Monthly", price: 800 },
      { period: "Quarterly", price: 750 },
      { period: "Semi-Annual", price: 700 },
    ],
    visible: true,
  },
  {
    name: "Social Media Ads",
    plans: [
      { period: "Monthly", price: 750 },
      { period: "Quarterly", price: 700 },
      { period: "Semi-Annual", price: 650 },
    ],
    visible: false,
  },
];

const mockPromoCodes = [
  { code: "WELCOME20", discount: "20% off", uses: 3, expiry: "31 Dec 2026" },
  { code: "Q4DEAL", discount: "SGD 100 off", uses: 0, expiry: "31 Oct 2026" },
];

export default function AdminServicesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-400 mt-1">Build and manage service packages and pricing.</p>
        </div>
        <button
          disabled
          className="btn-primary text-xs gap-1.5 opacity-50 cursor-not-allowed"
        >
          <Plus size={13} />
          New package
        </button>
      </div>

      {/* Package builder */}
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
              <h2 className="text-sm font-semibold text-gray-900">Package Builder</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create and manage your service offerings</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>

        <div className="divide-y divide-gray-50 opacity-40 pointer-events-none select-none">
          {mockPackages.map((pkg) => (
            <div key={pkg.name} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                  {!pkg.visible && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500">
                    {pkg.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.plans.map((plan) => (
                  <div key={plan.period} className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                    <span className="text-gray-500">{plan.period}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-gray-700">SGD {plan.price.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5 pt-4 border-t border-gray-50">
          Package editing will be enabled once Airwallex is connected. Prices shown are for illustration.
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

        <div className="divide-y divide-gray-50 opacity-40 pointer-events-none select-none mb-4">
          {mockPromoCodes.map((promo) => (
            <div key={promo.code} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-mono font-semibold text-gray-900">{promo.code}</p>
                <p className="text-xs text-gray-400 mt-0.5">{promo.discount} · Expires {promo.expiry}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">{promo.uses} uses</p>
                <button className="p-1.5 rounded-lg text-gray-300">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button disabled className="btn-outline text-xs gap-1.5 w-full opacity-50 cursor-not-allowed">
          <Plus size={13} />
          Create promo code
        </button>
      </div>

    </div>
  );
}