"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Loader2 } from "lucide-react";

export default function AdminPromoApply({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/promo-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: orgId, code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to apply promo code");
      } else {
        setSuccess(data.message ?? "Promo code applied");
        setCode("");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
      <div className="flex-1 w-full sm:w-auto">
        <label className="label mb-1 block">Promo Code</label>
        <div className="relative">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="input pl-9 w-full"
            disabled={loading}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
      </button>
      {error && <p className="text-xs text-red-500 sm:self-center">{error}</p>}
      {success && <p className="text-xs text-green-600 sm:self-center">{success}</p>}
    </form>
  );
}
