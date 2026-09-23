import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and organisation settings.</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" defaultValue={profile?.full_name ?? ""} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={profile?.email ?? ""} disabled />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          To update your name or email, contact your Adverdize account manager.
        </p>
      </div>

      {/* Organisation */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Organisation</h2>
        <div>
          <label className="label">Company name</label>
          <input className="input" defaultValue={profile?.organisation?.name ?? ""} disabled />
        </div>
        <p className="text-xs text-gray-400">
          Organisation details are managed by Adverdize.
        </p>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Password</h2>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-400 font-medium">Password change coming soon</p>
          <p className="text-xs text-gray-400 mt-1">
            For now, use the forgot password flow on the login page to reset your password.
          </p>
        </div>
      </div>

      {/* Subscription management */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Subscription Management</h2>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-400 font-medium">Pause & cancel options coming soon</p>
          <p className="text-xs text-gray-400 mt-1">
            Subscription pause and cancellation will be available once Airwallex is connected.
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 space-y-4 border-red-100">
        <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
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