"use client";

import { useState } from "react";

export default function AirwallexConnectionSection({
  connected,
  airwallexAccountId,
}: {
  connected: boolean;
  airwallexAccountId?: string | null;
}) {
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    setLoading(true);
    // Redirect to Airwallex OAuth with a return_to param so callback knows to go back to settings
    window.location.href = "/api/auth/airwallex?return_to=settings";
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100 overflow-hidden"
        >
          <img src="/logos/airwallex.png" alt="Airwallex" className="w-5 h-5 object-contain" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Airwallex Account</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {connected
              ? "Your Airwallex account is connected"
              : "Connect your Airwallex account to verify your customer status"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <img src="/logos/airwallex.png" alt="Airwallex" className="w-5 h-5 object-contain" />
          <p className="text-sm text-gray-600">
            {connected && airwallexAccountId
              ? `Account ${airwallexAccountId.slice(0, 8)}...`
              : "Not connected"}
          </p>
        </div>
        {connected ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
            Verified
          </span>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="btn-outline text-xs disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {connected
          ? "Your organisation is verified as an Airwallex customer. You may be eligible for special promotions."
          : "Existing Airwallex customers can connect their account to unlock exclusive promotions."}
      </p>
    </div>
  );
}
