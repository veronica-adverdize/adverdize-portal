"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function CancelButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleCancel() {
    setLoading(true);
    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_id: subscriptionId }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to cancel subscription. Please try again.");
    }
    setLoading(false);
    setConfirm(false);
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cancel at period end?</span>
        <button onClick={handleCancel} disabled={loading} className="btn-danger text-xs">
          {loading ? "Cancelling..." : "Confirm"}
        </button>
        <button onClick={() => setConfirm(false)} className="btn-outline text-xs">
          Keep
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} className="btn-danger text-xs gap-1.5">
      <XCircle size={13} />
      Cancel plan
    </button>
  );
}
