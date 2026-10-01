"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Package, Tag, Plus, Eye, EyeOff, X, Loader2, Check, Pencil, ArrowRight } from "lucide-react";

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

const PERIOD_ORDER = ["monthly", "quarterly", "semi_annual", "annual"];
const PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
};

function periodLabel(period: string) {
  return PERIOD_LABELS[period] ?? period;
}

function StatusBadge({ hasPlaceholder }: { hasPlaceholder: boolean }) {
  if (hasPlaceholder) {
    return (
      <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 rounded px-1">
        placeholder
      </span>
    );
  }
  return null;
}

type NewPrice = {
  billing_period: "monthly" | "quarterly" | "semi_annual" | "annual";
  amount: string;
  enabled: boolean;
};

const DEFAULT_PRICES: NewPrice[] = [
  { billing_period: "monthly", amount: "", enabled: true },
  { billing_period: "quarterly", amount: "", enabled: false },
  { billing_period: "semi_annual", amount: "", enabled: false },
  { billing_period: "annual", amount: "", enabled: false },
];

function CreatePackageModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [prices, setPrices] = useState<NewPrice[]>(DEFAULT_PRICES.map((p) => ({ ...p })));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFeature() {
    const val = featureInput.trim();
    if (val && !features.includes(val)) {
      setFeatures((f) => [...f, val]);
      setFeatureInput("");
    }
  }

  function removeFeature(feat: string) {
    setFeatures((f) => f.filter((x) => x !== feat));
  }

  function togglePeriod(idx: number) {
    setPrices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, enabled: !p.enabled } : p))
    );
  }

  function setAmount(idx: number, val: string) {
    setPrices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, amount: val } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const activePrices = prices.filter((p) => p.enabled);
    if (!name.trim()) return setError("Package name is required.");
    if (activePrices.length === 0) return setError("At least one billing cycle is required.");
    const missingAmount = activePrices.find((p) => !p.amount || isNaN(Number(p.amount)));
    if (missingAmount) return setError(`Enter an amount for the ${periodLabel(missingAmount.billing_period)} price.`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          features,
          prices: activePrices.map((p) => ({
            billing_period: p.billing_period,
            amount: Math.round(Number(p.amount) * 100), // convert to cents
            currency: "SGD",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create package");
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Service Package</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Package name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starter Ad Management"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#E05C83" } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary shown to clients"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Features</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                placeholder="e.g. Monthly Reporting"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((f) => (
                  <span key={f} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                    <Check size={10} className="text-green-500 shrink-0" />
                    {f}
                    <button type="button" onClick={() => removeFeature(f)} className="text-gray-300 hover:text-gray-500 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing cycles & prices <span className="text-gray-400 font-normal">(SGD/mo)</span></label>
            <div className="space-y-2">
              {prices.map((p, idx) => (
                <div key={p.billing_period} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${p.enabled ? "border-pink-200 bg-pink-50/40" : "border-gray-100 bg-gray-50"}`}>
                  <button
                    type="button"
                    onClick={() => togglePeriod(idx)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${p.enabled ? "border-pink-400 bg-pink-400" : "border-gray-300 bg-white"}`}
                  >
                    {p.enabled && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-sm text-gray-700 w-28 shrink-0">{periodLabel(p.billing_period)}</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs text-gray-400">SGD</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.amount}
                      onChange={(e) => setAmount(idx, e.target.value)}
                      disabled={!p.enabled}
                      placeholder="0.00"
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none disabled:opacity-40 disabled:bg-transparent"
                    />
                    <span className="text-xs text-gray-400">/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary text-sm gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Create package"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPackageModal({
  pkg,
  onClose,
  onUpdated,
}: {
  pkg: ServicePackage;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(pkg.name);
  const [description, setDescription] = useState(pkg.description ?? "");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>(pkg.features ?? []);
  const [prices, setPrices] = useState<NewPrice[]>(() => {
    return DEFAULT_PRICES.map((dp) => {
      const existing = pkg.prices.find((p) => p.billing_period === dp.billing_period);
      return {
        billing_period: dp.billing_period,
        amount: existing ? (existing.amount / 100).toString() : "",
        enabled: !!existing,
      };
    });
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFeature() {
    const val = featureInput.trim();
    if (val && !features.includes(val)) {
      setFeatures((f) => [...f, val]);
      setFeatureInput("");
    }
  }

  function removeFeature(feat: string) {
    setFeatures((f) => f.filter((x) => x !== feat));
  }

  function togglePeriod(idx: number) {
    setPrices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, enabled: !p.enabled } : p))
    );
  }

  function setAmount(idx: number, val: string) {
    setPrices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, amount: val } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const activePrices = prices.filter((p) => p.enabled);
    if (!name.trim()) return setError("Package name is required.");
    if (activePrices.length === 0) return setError("At least one billing cycle is required.");
    const missingAmount = activePrices.find((p) => !p.amount || isNaN(Number(p.amount)));
    if (missingAmount) return setError(`Enter an amount for the ${periodLabel(missingAmount.billing_period)} price.`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pkg.id,
          name: name.trim(),
          description: description.trim() || null,
          features,
          prices: activePrices.map((p) => ({
            billing_period: p.billing_period,
            amount: Math.round(Number(p.amount) * 100),
            currency: "SGD",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update package");
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Service Package</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Package name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starter Ad Management"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#E05C83" } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary shown to clients"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Features</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                placeholder="e.g. Monthly Reporting"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((f) => (
                  <span key={f} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                    <Check size={10} className="text-green-500 shrink-0" />
                    {f}
                    <button type="button" onClick={() => removeFeature(f)} className="text-gray-300 hover:text-gray-500 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing cycles & prices <span className="text-gray-400 font-normal">(SGD/mo)</span></label>
            <div className="space-y-2">
              {prices.map((p, idx) => (
                <div key={p.billing_period} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${p.enabled ? "border-pink-200 bg-pink-50/40" : "border-gray-100 bg-gray-50"}`}>
                  <button
                    type="button"
                    onClick={() => togglePeriod(idx)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${p.enabled ? "border-pink-400 bg-pink-400" : "border-gray-300 bg-white"}`}
                  >
                    {p.enabled && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-sm text-gray-700 w-28 shrink-0">{periodLabel(p.billing_period)}</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs text-gray-400">SGD</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.amount}
                      onChange={(e) => setAmount(idx, e.target.value)}
                      disabled={!p.enabled}
                      placeholder="0.00"
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none disabled:opacity-40 disabled:bg-transparent"
                    />
                    <span className="text-xs text-gray-400">/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary text-sm gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function loadPackages() {
    setLoading(true);
    const res = await fetch("/api/admin/packages");
    if (res.ok) {
      const data = await res.json();
      setPackages(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadPackages(); }, []);

  function handleCreated() {
    setShowModal(false);
    startTransition(() => { loadPackages(); });
  }

  function handleUpdated() {
    setEditingPkg(null);
    startTransition(() => { loadPackages(); });
  }

  async function toggleVisibility(pkg: ServicePackage) {
    setTogglingId(pkg.id);
    try {
      await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pkg.id, is_active: !pkg.is_active }),
      });
      startTransition(() => { loadPackages(); });
    } catch {
      // silently fail
    } finally {
      setTogglingId(null);
    }
  }

  const activePackages = packages.filter((p) => p.is_active);
  const inactivePackages = packages.filter((p) => !p.is_active);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {showModal && (
        <CreatePackageModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      {editingPkg && (
        <EditPackageModal pkg={editingPkg} onClose={() => setEditingPkg(null)} onUpdated={handleUpdated} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-400 mt-1">
            {packages.length} service package{packages.length !== 1 ? "s" : ""} configured.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs gap-1.5"
        >
          <Plus size={13} />
          New package
        </button>
      </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-10">
            <Package size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No packages yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create your first service package to get started.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-xs gap-1.5">
              <Plus size={13} />
              New package
            </button>
          </div>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingPkg(pkg)}
                      title="Edit package"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleVisibility(pkg)}
                      disabled={togglingId === pkg.id}
                      title="Hide from clients"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      {togglingId === pkg.id ? <Loader2 size={13} className="animate-spin" /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pkg.prices
                    .slice()
                    .sort((a, b) => PERIOD_ORDER.indexOf(a.billing_period) - PERIOD_ORDER.indexOf(b.billing_period))
                    .map((price) => {
                      const isPlaceholder = !price.airwallex_price_id || price.airwallex_price_id.startsWith("placeholder_");
                      return (
                        <div
                          key={price.id}
                          className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border ${
                            !isPlaceholder ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <span className="text-gray-500">{periodLabel(price.billing_period)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="font-semibold text-gray-700">
                            {price.currency} {(price.amount / 100).toLocaleString()}/mo
                          </span>
                          <StatusBadge hasPlaceholder={isPlaceholder} />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            {inactivePackages.length > 0 && (
              <div className="pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Hidden from clients
                </p>
                {inactivePackages.map((pkg) => (
                  <div key={pkg.id} className="py-3 opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          Hidden
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingPkg(pkg)}
                          title="Edit package"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleVisibility(pkg)}
                          disabled={togglingId === pkg.id}
                          title="Show to clients"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                        >
                          {togglingId === pkg.id ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                        </button>
                      </div>
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
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-5 pt-4 border-t border-gray-50">
          Prices shown in <span className="font-medium text-amber-500">amber</span> have placeholder IDs and aren't linked to Airwallex yet.
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
              <p className="text-xs text-gray-400 mt-0.5">Create and manage discount codes for clients</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Manage all your promo codes from the dedicated page — create new codes, edit discounts, set expiry dates, and track redemptions.
        </p>
        <Link
          href="/dashboard/admin/promo-codes"
          className="btn-primary text-xs gap-1.5 w-full justify-center"
        >
          Manage Promo Codes
          <ArrowRight size={13} />
        </Link>
      </div>

    </div>
  );
}
