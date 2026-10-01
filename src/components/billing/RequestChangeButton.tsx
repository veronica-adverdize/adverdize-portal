"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function RequestChangeButton({
  type,
  subscriptionId,
}: {
  type: "upgrade" | "downgrade";
  subscriptionId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRequest() {
    if (!subscriptionId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/billing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subscription_id: subscriptionId }),
      });
      if (res.ok) setSent(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 p-4">
        <p className="text-xs font-semibold text-green-700">
          {type === "upgrade" ? "Upgrade" : "Downgrade"} request submitted
        </p>
        <p className="text-xs text-green-600 mt-0.5">Our team will be in touch shortly.</p>
      </div>
    );
  }

  const Icon = type === "upgrade" ? ArrowUp : ArrowDown;

  return (
    <button
      onClick={handleRequest}
      disabled={loading || !subscriptionId}
      className="rounded-lg border border-gray-200 p-4 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors w-full disabled:opacity-50"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} style={{ color: type === "upgrade" ? "#E05C83" : "#F4845F" }} />
        <p className="text-xs font-semibold text-gray-700">
          {type === "upgrade" ? "Upgrade Plan" : "Downgrade Plan"}
        </p>
      </div>
      <p className="text-xs text-gray-400">
        {type === "upgrade"
          ? "Switch to a higher tier. Pro-rated charges apply for the remainder of your billing cycle."
          : "Switch to a lower tier. Change takes effect at the start of your next billing cycle."}
      </p>
      <p className="text-[10px] font-medium mt-2" style={{ color: "#E05C83" }}>
        {loading ? "Submitting..." : "Request change →"}
      </p>
    </button>
  );
}
