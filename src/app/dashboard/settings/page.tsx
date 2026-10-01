import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { User, Building2, Lock, Settings2, AlertTriangle, Chrome, Bell } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";

export default async function SettingsPage() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Use admin client for data queries (server component only)
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
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

      {/* Google SSO — coming soon */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(224,92,131,0.08)" }}
            >
              <Chrome size={15} style={{ color: "#E05C83" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Google Sign-In</h2>
              <p className="text-xs text-gray-400 mt-0.5">Link your Google account for SSO login</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 opacity-50">
          <div className="flex items-center gap-3">
            <img src="/logos/google.png" alt="Google" className="w-5 h-5 object-contain" />
            <p className="text-sm text-gray-600">Connect Google account</p>
          </div>
          <button disabled className="btn-outline text-xs cursor-not-allowed">
            Connect
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Once connected, you can sign in with your Google account instead of a password. Google OAuth credentials are pending setup.
        </p>
      </div>

      {/* Notifications — coming soon */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
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
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wide">
            COMING SOON
          </span>
        </div>
        <div className="divide-y divide-gray-50 opacity-50 pointer-events-none">
          {[
            { label: "Invoice paid", desc: "When your monthly invoice is auto-charged" },
            { label: "Subscription changes", desc: "Plan upgrades, downgrades or cancellations" },
            { label: "Campaign reports", desc: "Monthly performance summary from your Adverdize team" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-gray-200 shrink-0" />
            </div>
          ))}
        </div>
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