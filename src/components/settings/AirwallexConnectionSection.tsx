"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AirwallexConnectionSection({
  connected,
  airwallexAccountId,
}: {
  connected: boolean;
  airwallexAccountId?: string | null;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);
  const [showConfirm, setShowConfirm] = useState(false);

  const airwallexParam = searchParams.get("airwallex");
  const errorParam = searchParams.get("error");

  function handleConnect() {
    setLoading(true);
    window.location.href = "/api/auth/airwallex?return_to=settings";
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/airwallex/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setIsConnected(false);
        setShowConfirm(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disconnect. Please try again.");
      }
    } catch {
      alert("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100 overflow-hidden">
          <img
            src="/logos/airwallex.png"
            alt="Airwallex"
            className="w-5 h-5 object-contain"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Airwallex Account
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isConnected
              ? "Your Airwallex account is connected"
              : "Connect your Airwallex account to verify your customer status"}
          </p>
        </div>
      </div>

      {airwallexParam === "connected" && (
        <div className="rounded-lg bg-green-50 border border-green-100 p-3">
          <p className="text-xs text-green-700 font-medium">
            Airwallex account connected successfully!
          </p>
        </div>
      )}

      {errorParam && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-xs text-red-600 font-medium">{errorParam}</p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <img
            src="/logos/airwallex.png"
            alt="Airwallex"
            className="w-5 h-5 object-contain"
          />
          <p className="text-sm text-gray-600">
            {isConnected && airwallexAccountId
              ? `Account ${airwallexAccountId.slice(0, 8)}...`
              : "Not connected"}
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
              Verified
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Disconnect
            </button>
          </div>
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

      {showConfirm && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 space-y-3">
          <p className="text-xs text-red-700 font-medium">
            Are you sure you want to disconnect your Airwallex account? You may
            lose eligibility for Airwallex customer promotions.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting..." : "Yes, disconnect"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {isConnected
          ? "Your organisation is verified as an Airwallex customer. You may be eligible for special promotions."
          : "Existing Airwallex customers can connect their account to unlock exclusive promotions. An Owner, Admin, or Finance Admin on your Airwallex account must authorise the connection."}
      </p>
    </div>
  );
}
