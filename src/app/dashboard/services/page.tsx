"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Service categories and which DB package names map to each
const CATEGORIES = [
  {
    key: "seo",
    label: "Search Engine Optimisation",
    description: "Rank higher on Google and drive organic traffic to your business.",
    icon: "📈",
    match: (name: string) => name.toLowerCase().includes("seo") || name.toLowerCase().includes("search engine optim"),
  },
  {
    key: "social-ads",
    label: "Social Media Advertising",
    description: "Run high-converting paid ads across Facebook, Instagram, and more.",
    icon: "📣",
    match: (name: string) => name.toLowerCase().includes("social media advertising") || name.toLowerCase().includes("social media ads"),
  },
  {
    key: "google-ads",
    label: "Google Ads",
    description: "Get in front of customers actively searching for your services.",
    icon: "🔍",
    match: (name: string) => name.toLowerCase().includes("google ads") || name.toLowerCase().includes("search engine marketing"),
  },
  {
    key: "smm",
    label: "Social Media Management",
    description: "Consistent, high-quality content that grows your brand online.",
    icon: "📱",
    match: (name: string) => name.toLowerCase().includes("social media management"),
  },
];

type Price = {
  id: string;
  billing_period: string;
  amount: number;
  currency: string;
  airwallex_price_id: string;
};

type ServicePackage = {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: Price[];
};

// How to display billing periods — always show as monthly equivalent
const PERIOD_CONFIG: Record<string, { label: string; months: number; badge?: string }> = {
  monthly: { label: "Monthly", months: 1 },
  quarterly: { label: "Quarterly", months: 3, badge: "Save ~5%" },
  semi_annual: { label: "Semi-Annual", months: 6, badge: "Save ~10%" },
  annual: { label: "Annual", months: 12, badge: "Save ~20%" },
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      const { data: pkgs } = await supabase
        .from("service_packages")
        .select("*, prices:service_prices(*)")
        .eq("is_active", true)
        .order("created_at");

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("service_id")
        .eq("organisation_id", profile?.organisation_id)
        .eq("status", "active");

      setServices(pkgs || []);
      setSubscribedIds(new Set(subs?.map((s) => s.service_id)));
      setLoading(false);
    }
    load();
  }, []);

  function getServicesForCategory(catKey: string): ServicePackage[] {
    const cat = CATEGORIES.find((c) => c.key === catKey);
    if (!cat) return [];
    return services.filter((s) => cat.match(s.name));
  }

  function getPriceForPeriod(service: ServicePackage, period: string): Price | undefined {
    return service.prices?.find((p) => p.billing_period === period);
  }

  function formatMonthlyEquivalent(amount: number, months: number): string {
    const perMonth = amount / months / 100;
    return `SGD ${perMonth.toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function formatBilledAs(amount: number, months: number): string {
    if (months === 1) return "";
    const total = (amount / 100) * months;
    return `Billed as SGD ${total.toLocaleString("en-SG")} every ${months === 3 ? "3 months" : months === 6 ? "6 months" : "year"}`;
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Category view — show service plans
  if (activeCategory) {
    const cat = CATEGORIES.find((c) => c.key === activeCategory)!;
    const catServices = getServicesForCategory(activeCategory);
    const availablePeriods = ["monthly", "quarterly", "semi_annual", "annual"].filter(period =>
      catServices.some(s => getPriceForPeriod(s, period))
    );

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
            All services
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">{cat.label}</span>
        </div>

        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">{cat.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
        </div>

        {/* Billing period toggle */}
        {availablePeriods.length > 1 && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
            {availablePeriods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {PERIOD_CONFIG[period]?.label}
                {PERIOD_CONFIG[period]?.badge && selectedPeriod !== period && (
                  <span className="ml-1.5 text-xs text-brand-pink">{PERIOD_CONFIG[period].badge}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {catServices.map((service) => {
            const isActive = subscribedIds.has(service.id);
            const price = getPriceForPeriod(service, selectedPeriod);
            const config = PERIOD_CONFIG[selectedPeriod];

            return (
              <div
                key={service.id}
                className={`card p-6 flex flex-col ${isActive ? "ring-2 ring-brand-pink" : ""}`}
              >
                {isActive && (
                  <div className="flex justify-end mb-2">
                    <span className="badge-active">Active</span>
                  </div>
                )}

                <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{service.description}</p>

                {price && config && (
                  <div className="mt-4 mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-display font-bold text-gray-900">
                        {formatMonthlyEquivalent(price.amount, config.months)}
                      </span>
                      <span className="text-xs text-gray-400">/ mo</span>
                    </div>
                    {config.months > 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatBilledAs(price.amount, config.months)}
                      </p>
                    )}
                    {config.badge && (
                      <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {config.badge}
                      </span>
                    )}
                  </div>
                )}

                {!price && (
                  <div className="mt-4 mb-1">
                    <span className="text-sm text-gray-400">Price not available</span>
                  </div>
                )}

                <ul className="space-y-1.5 flex-1 mt-4 mb-5">
                  {service.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <Check size={12} className="text-brand-pink mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <Link href="/dashboard/billing" className="btn-outline w-full text-center">
                    Manage subscription
                  </Link>
                ) : (
                  <Link
                    href={price ? `/dashboard/billing/checkout?service=${service.id}&period=${selectedPeriod}` : "#"}
                    className={`btn-primary w-full text-center ${!price ? "opacity-40 pointer-events-none" : ""}`}
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

  // Default view — show 4 service categories
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Services</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a service to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const catServices = getServicesForCategory(cat.key);
          const activeCount = catServices.filter((s) => subscribedIds.has(s.id)).length;
          const planCount = catServices.length;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="card p-6 text-left hover:border-brand-pink/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl mb-3">{cat.icon}</div>
                {activeCount > 0 && (
                  <span className="badge-active">{activeCount} active</span>
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-pink transition-colors">
                {cat.label}
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{cat.description}</p>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                {planCount} {planCount === 1 ? "plan" : "plans"} available →
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
