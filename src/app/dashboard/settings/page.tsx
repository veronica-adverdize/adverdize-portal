import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Building2, Lock, Settings2, AlertTriangle } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const email = profile?.email ?? user.email ?? "";
  const companyName = profile?.organisation?.name ?? user.user_metadata?.company_name ?? "";

  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and organisation settings.</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <User size={15} style={{ color: "#E05C83" }} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="flex items-center gap-4 pb-5 border-b border-gray-50">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{fullName || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input bg-gray-50" defaultValue={fullName} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" defaultValue={email} disabled />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          To update your name or email, contact your Adverdize account manager.
        </p>
      </div>

      {/* Organisation */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <Building2 size={15} style={{ color: "#E05C83" }} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Organisation</h2>
        </div>
        <div>
          <label className="label">Company name</label>
          <input className="input bg-gray-50" defaultValue={companyName} disabled />
        </div>
        <p className="text-xs text-gray-400">
          Organisation details are managed by Adverdize.
        </p>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <Lock size={15} style={{ color: "#E05C83" }} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Password</h2>
        </div>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-400 font-medium">Password change coming soon</p>
          <p className="text-xs text-gray-400 mt-1">
            For now, use the forgot password flow on the login page to reset your password.
          </p>
        </div>
      </div>

      {/* Subscription management */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
          >
            <Settings2 size={15} style={{ color: "#E05C83" }} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Subscription Management</h2>
        </div>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-400 font-medium">Pause &amp; cancel options coming soon</p>
          <p className="text-xs text-gray-400 mt-1">
            Subscription pause and cancellation will be available once Airwallex is connected.
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 space-y-5 border-red-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <h2 className="text-sm font-semibold text-red-500">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account</p>
            <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and all data.</p>
          </div>
          <button disabled className="btn-danger opacity-50 cursor-not-allowed text-xs">
            Delete account
          </button>
        </div>
      </div>

    </div>
  );
}