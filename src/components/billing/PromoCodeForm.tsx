"use client";

import { useState } from "react";

export default function PromoCodeForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/billing/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message ?? "Promo code applied successfully!" });
        setCode("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Invalid promo code." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="input flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="btn-primary text-xs shrink-0 disabled:opacity-50"
        >
          {loading ? "Applying..." : "Apply"}
        </button>
      </div>
      {message && (
        <p className={`text-xs mt-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
