"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

const NOTIFICATION_TYPES = [
  { key: "invoice_paid", label: "Invoice paid", desc: "When your monthly invoice is auto-charged" },
  { key: "subscription_changes", label: "Subscription changes", desc: "Plan upgrades, downgrades or cancellations" },
  { key: "campaign_reports", label: "Campaign reports", desc: "Monthly performance summary from your Adverdize team" },
];

export default function NotificationPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    invoice_paid: true,
    subscription_changes: true,
    campaign_reports: true,
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferences) setPrefs(data.preferences);
      })
      .catch(() => {});
  }, []);

  async function toggle(key: string) {
    const newVal = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newVal }));
    setSaving(key);
    try {
      await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: newVal }),
      });
    } catch {
      setPrefs((p) => ({ ...p, [key]: !newVal }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
        >
          <Bell size={15} style={{ color: "#E05C83" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-400 mt-0.5">Choose what updates you receive</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {NOTIFICATION_TYPES.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              disabled={saving === item.key}
              className="shrink-0"
              style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 9999,
                backgroundColor: prefs[item.key] ? "#E05C83" : "#d1d5db",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s",
                  transform: prefs[item.key] ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
