"use client";

import { useState, useEffect, useTransition } from "react";
import { Tag, Plus, X, Loader2, Pencil, Ticket, Users, Hash } from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
  max_redemptions: number | null;
  expires_at: string | null;
  created_at: string;
  redemption_count: number;
};

function formatDiscount(type: string, value: number) {
  if (type === "percentage") return `${value}%`;
  return `SGD ${value}`;
}

function getStatus(code: PromoCode): "active" | "inactive" | "expired" {
  if (!code.is_active) return "inactive";
  if (code.expires_at && new Date(code.expires_at) < new Date()) return "expired";
  return "active";
}

function StatusBadge({ status }: { status: "active" | "inactive" | "expired" }) {
  const styles = {
    active: "bg-green-50 text-green-600 border-green-100",
    inactive: "bg-gray-50 text-gray-400 border-gray-100",
    expired: "bg-amber-50 text-amber-600 border-amber-100",
  };
  const labels = { active: "Active", inactive: "Inactive", expired: "Expired" };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function PromoModal({
  promo,
  onClose,
  onSaved,
}: {
  promo?: PromoCode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!promo;
  const [code, setCode] = useState(promo?.code ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(promo?.discount_type ?? "percentage");
  const [discountValue, setDiscountValue] = useState(promo?.discount_value?.toString() ?? "");
  const [maxRedemptions, setMaxRedemptions] = useState(promo?.max_redemptions?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(promo?.expires_at ? promo.expires_at.slice(0, 10) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !code.trim()) return setError("Code is required.");
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      return setError("Enter a valid discount value.");
    }
    if (discountType === "percentage" && Number(discountValue) > 100) {
      return setError("Percentage cannot exceed 100.");
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        discount_type: discountType,
        discount_value: Number(discountValue),
        description: description.trim() || null,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expires_at: expiresAt ? new Date(expiresAt + "T23:59:59Z").toISOString() : null,
      };

      if (isEdit) {
        payload.id = promo.id;
      } else {
        payload.code = code.toUpperCase().trim();
      }

      const res = await fetch("/api/admin/promo-codes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Promo Code" : "New Promo Code"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code */}
          <div>
            <label className="label mb-1.5">Code</label>
            {isEdit ? (
              <p className="text-sm font-mono font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                {promo.code}
              </p>
            ) : (
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="input"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Welcome offer for new clients"
              className="input"
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Discount type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                className="input"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (SGD)</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5">
                {discountType === "percentage" ? "Value (%)" : "Value (SGD)"}
              </label>
              <input
                type="number"
                min="0"
                step={discountType === "percentage" ? "1" : "0.01"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 50"}
                className="input"
              />
            </div>
          </div>

          {/* Max redemptions */}
          <div>
            <label className="label mb-1.5">
              Max redemptions <span className="text-gray-400 font-normal">(leave blank for unlimited)</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
              className="input"
            />
          </div>

          {/* Expires at */}
          <div>
            <label className="label mb-1.5">
              Expiry date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary text-sm gap-2">
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create code"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes");
      if (res.ok) setCodes(await res.json());
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => { loadCodes(); }, []);

  function handleSaved() {
    setShowModal(false);
    setEditingCode(null);
    startTransition(() => { loadCodes(); });
  }

  async function handleDeactivate(id: string) {
    setDeactivatingId(id);
    try {
      await fetch("/api/admin/promo-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      startTransition(() => { loadCodes(); });
    } catch {
      // ignore
    } finally {
      setDeactivatingId(null);
    }
  }

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => getStatus(c) === "active").length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.redemption_count, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showModal && <PromoModal onClose={() => setShowModal(false)} onSaved={handleSaved} />}
      {editingCode && (
        <PromoModal promo={editingCode} onClose={() => setEditingCode(null)} onSaved={handleSaved} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Promo Codes</h1>
          <p className="text-sm text-gray-400 mt-1">Manage discount codes for clients.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs gap-1.5">
          <Plus size={13} />
          New code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <Hash size={15} style={{ color: "#E05C83" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Codes</p>
            <p className="text-lg font-bold text-gray-900">{totalCodes}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(34,197,94,0.08)" }}
          >
            <Ticket size={15} style={{ color: "#22c55e" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Active Codes</p>
            <p className="text-lg font-bold text-gray-900">{activeCodes}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
          >
            <Users size={15} style={{ color: "#F4845F" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Redemptions</p>
            <p className="text-lg font-bold text-gray-900">{totalRedemptions}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,132,95,0.08)" }}
          >
            <Tag size={15} style={{ color: "#F4845F" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">All Promo Codes</h2>
            <p className="text-xs text-gray-400 mt-0.5">View and manage your discount codes</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-10">
            <Tag size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No promo codes yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create your first promo code to get started.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-xs gap-1.5">
              <Plus size={13} />
              New code
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left pb-3 pr-4">Code</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left pb-3 pr-4">Description</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left pb-3 pr-4">Discount</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left pb-3 pr-4">Redemptions</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left pb-3 pr-4">Status</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {codes.map((c) => {
                    const status = getStatus(c);
                    return (
                      <tr key={c.id}>
                        <td className="py-3 pr-4">
                          <span className="text-sm font-mono font-semibold text-gray-900">{c.code}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-500">{c.description || "—"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-gray-700">
                            {formatDiscount(c.discount_type, c.discount_value)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-600">
                            {c.redemption_count}
                            {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingCode(c)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            {status === "active" && (
                              <button
                                onClick={() => handleDeactivate(c.id)}
                                disabled={deactivatingId === c.id}
                                title="Deactivate"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                              >
                                {deactivatingId === c.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <X size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {codes.map((c) => {
                const status = getStatus(c);
                return (
                  <div key={c.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-semibold text-gray-900">{c.code}</span>
                      <StatusBadge status={status} />
                    </div>
                    {c.description && (
                      <p className="text-xs text-gray-500">{c.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <span className="font-medium text-gray-700">{formatDiscount(c.discount_type, c.discount_value)}</span> off
                      </span>
                      <span>
                        {c.redemption_count}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""} used
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        onClick={() => setEditingCode(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      {status === "active" && (
                        <button
                          onClick={() => handleDeactivate(c.id)}
                          disabled={deactivatingId === c.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deactivatingId === c.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <X size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
