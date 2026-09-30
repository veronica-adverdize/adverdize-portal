"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Price {
  id: string;
  billing_period: string;
  amount: number;
  currency: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: Price[];
}

const periodLabels: Record<string, { label: string; sub: string }> = {
  monthly:     { label: "Monthly",                   sub: "" },
  quarterly:   { label: "Every month for 3 months",  sub: "3-month commitment" },
  semi_annual: { label: "Every month for 6 months",  sub: "6-month commitment" },
  annual:      { label: "Every month for 12 months", sub: "12-month commitment" },
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Airwallex?: any;
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("service");
  const initialPeriod = searchParams.get("period") ?? "monthly";

  const [service, setService] = useState<Service | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Embedded checkout state
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [checkoutMounted, setCheckoutMounted] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutElementRef = useRef<any>(null);

  useEffect(() => {
    if (!serviceId) return;
    const supabase = createClient();
    supabase
      .from("service_packages")
      .select("*, prices:service_prices!service_id(*)")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setService(data);
          // Try to select the period from URL param first, fallback to monthly
          const prices: Price[] = data.prices ?? [];
          const periodMatch = prices.find((p) => p.billing_period === initialPeriod);
          const monthly = prices.find((p) => p.billing_period === "monthly");
          if (periodMatch) setSelectedPriceId(periodMatch.id);
          else if (monthly) setSelectedPriceId(monthly.id);
        }
      });
  }, [serviceId, initialPeriod]);

  // Load Airwallex SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Airwallex) { setCheckoutReady(true); return; }

    const script = document.createElement("script");
    script.src = "https://checkout.airwallex.com/assets/bundle.x.min.js";
    script.async = true;
    script.onload = () => setCheckoutReady(true);
    document.head.appendChild(script);

    return () => {
      // cleanup not required — script stays cached
    };
  }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPriceId) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price_id: selectedPriceId,
        promo_code: promoCode || undefined,
        embedded: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const { client_secret } = data;

    if (!client_secret) {
      // Fallback: redirect mode (should not happen in embedded flow)
      window.location.href = data.url;
      return;
    }

    // Mount the embedded checkout
    await mountEmbeddedCheckout(client_secret);
    setLoading(false);
  }

  async function mountEmbeddedCheckout(clientSecret: string) {
    try {
      const airwallex = window.Airwallex;
      if (!airwallex) throw new Error("Airwallex SDK not loaded");

      const env = process.env.NEXT_PUBLIC_AIRWALLEX_ENV === "prod" ? "prod" : "demo";

      await airwallex.init({ env, enabledElements: ["billing"] });

      const element = await airwallex.createElement("embeddedCheckout", {
        client_secret: clientSecret,
      });

      checkoutElementRef.current = element;

      element.on("ready", () => {
        setCheckoutMounted(true);
      });

      element.on("success", () => {
        setCheckoutSuccess(true);
        // Give a moment then redirect
        setTimeout(() => {
          router.push("/dashboard/billing?success=1");
        }, 2000);
      });

      element.on("error", (err: { message?: string }) => {
        setError(err?.message ?? "Payment failed. Please try again.");
        setCheckoutMounted(false);
        checkoutElementRef.current = null;
      });

      element.mount("airwallex-checkout-container");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load payment form.";
      setError(msg);
      setLoading(false);
    }
  }

  const selectedPrice = service?.prices?.find((p) => p.id === selectedPriceId);

  if (!service) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  // Success state
  if (checkoutSuccess) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center space-y-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
        >
          <Check size={24} className="text-white" />
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900">Subscription activated!</h2>
        <p className="text-sm text-gray-500">Redirecting you to your billing dashboard…</p>
        <div className="w-6 h-6 rounded-full border-2 border-brand-pink border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  // Embedded checkout is showing
  if (checkoutMounted || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          {!loading && (
            <button
              onClick={() => {
                checkoutElementRef.current?.unmount?.();
                checkoutElementRef.current = null;
                setCheckoutMounted(false);
                setError("");
              }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">Complete payment</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {service.name} · SGD {((selectedPrice?.amount ?? 0) / 100).toLocaleString()}/mo
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 px-1">{error}</p>
        )}

        {loading && !checkoutMounted && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
          </div>
        )}

        {/* Airwallex mounts here */}
        <div
          id="airwallex-checkout-container"
          ref={checkoutContainerRef}
          style={{ minHeight: "720px", display: loading && !checkoutMounted ? "none" : "block" }}
        />
      </div>
    );
  }

  // Default: billing cycle selector + promo
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/services"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft size={15} />
          Back to services
        </Link>
        <h1 className="text-xl font-display font-bold text-gray-900">Subscribe to {service.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Choose your billing cycle and complete checkout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">What&apos;s included</h3>
          <ul className="space-y-2">
            {service.features?.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check size={12} className="text-brand-pink mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="card p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Select billing cycle</p>
            {service.prices
              ?.sort((a, b) => {
                const order = ["monthly", "quarterly", "semi_annual", "annual"];
                return order.indexOf(a.billing_period) - order.indexOf(b.billing_period);
              })
              .map((price) => {
                const meta = periodLabels[price.billing_period];
                return (
                  <label
                    key={price.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPriceId === price.id
                        ? "border-brand-pink bg-brand-pink/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="price"
                        value={price.id}
                        checked={selectedPriceId === price.id}
                        onChange={() => setSelectedPriceId(price.id)}
                        className="accent-brand-pink"
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{meta.label}</p>
                        {meta.sub && (
                          <span className="text-[10px] text-gray-400">{meta.sub}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      SGD {(price.amount / 100).toLocaleString()}
                      <span className="text-xs font-normal text-gray-400">/mo</span>
                    </span>
                  </label>
                );
              })}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Tag size={12} />
              Promo code (optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedPriceId || !checkoutReady}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Loading payment form…"
              : `Continue to payment · SGD ${((selectedPrice?.amount ?? 0) / 100).toLocaleString()}/mo`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Secured by Airwallex. Your payment details are encrypted.
          </p>
        </form>
      </div>
    </div>
  );
}
