"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Bell, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface TopBarProps {
  user?: {
    full_name?: string;
    email?: string;
    role?: string;
    organisation?: { name?: string };
  } | null;
}

export default function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell size={16} className="text-gray-500" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                </div>
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
                  <p className="text-xs text-gray-300 mt-0.5">No notifications for now.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => { setOpen(!open); setNotifOpen(false); }}
            className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ background: "linear-gradient(135deg, #E8405A, #F4845F)" }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.full_name ?? "User"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.organisation?.name}</p>
            </div>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
