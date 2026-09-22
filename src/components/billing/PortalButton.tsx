"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export default function PortalButton({ customerId }: { customerId?: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    if (!customerId) return;
    setLoading(true);
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return (
    <button onClick={handlePortal} disabled={loading || !customerId} className="btn-outline text-xs gap-1.5">
      <CreditCard size={13} />
      {loading ? "Loading..." : "Update payment method"}
    </button>
  );
}
