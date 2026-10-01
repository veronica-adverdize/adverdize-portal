"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, XCircle } from "lucide-react";

export default function AdminSubscriptionActions({
  subscriptionId,
  cancelAtPeriodEnd,
  status,
}: {
  subscriptionId: string | undefined;
  cancelAtPeriodEnd: boolean;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"cancel" | "pause" | null>(null);
  const [loading, setLoading] = useState(false);

  const canAct =
    subscriptionId &&
    (status === "active" || status === "past_due") &&
    !cancelAtPeriodEnd;

  async function runAction(action: "cancel" | "cancel_now" | "pause") {
    if (!subscriptionId) return;
    setLoading(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_id: subscriptionId, action }),
    });
    setLoading(false);
    setConfirming(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error ?? "Action failed");
    }
  }

  if (confirming === "pause") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => runAction("pause")}
          disabled={loading}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-colors"
        >
          {loading ? "…" : "Confirm Pause"}
        </button>
        <button
          onClick={() => setConfirming(null)}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          Keep
        </button>
      </div>
    );
  }

  if (confirming === "cancel") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => runAction("cancel")}
          disabled={loading}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
        >
          {loading ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(null)}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        disabled={!canAct}
        title={canAct ? "Pause subscription" : "No active subscription"}
        onClick={() => canAct && setConfirming("pause")}
        className={`p-1.5 rounded-lg transition-colors ${
          canAct
            ? "text-amber-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
            : "text-gray-300 opacity-40 cursor-not-allowed"
        }`}
      >
        <PauseCircle size={14} />
      </button>
      <button
        disabled={!canAct}
        title={canAct ? "Cancel subscription at period end" : "No active subscription"}
        onClick={() => canAct && setConfirming("cancel")}
        className={`p-1.5 rounded-lg transition-colors ${
          canAct
            ? "text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            : "text-gray-300 opacity-40 cursor-not-allowed"
        }`}
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}
