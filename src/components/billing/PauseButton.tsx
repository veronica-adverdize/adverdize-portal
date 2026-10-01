"use client";

import { useState } from "react";
import { PauseCircle } from "lucide-react";

export default function PauseButton({ subscriptionId }: { subscriptionId?: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handlePause() {
    if (!subscriptionId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/billing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pause", subscription_id: subscriptionId }),
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
      <p className="text-xs text-green-600 font-medium">
        Pause request submitted. Our team will process this shortly.
      </p>
    );
  }

  return (
    <button
      onClick={handlePause}
      disabled={loading || !subscriptionId}
      className="btn-outline text-xs gap-1.5 disabled:opacity-50"
    >
      <PauseCircle size={13} />
      {loading ? "Submitting..." : "Request pause"}
    </button>
  );
}
