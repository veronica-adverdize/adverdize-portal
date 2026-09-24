import { Construction } from "lucide-react";

export default function AdminServicesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Services</h1>
        <p className="text-sm text-gray-500 mt-0.5">Build and manage service packages and pricing.</p>
      </div>

      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Construction size={24} className="text-amber-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Package Builder — Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Create, edit and manage service packages, pricing tiers, and discount codes. Available once Airwallex is connected.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {["Create packages", "Edit pricing", "Set billing periods", "Discount codes", "Toggle visibility", "Archive packages"].map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
