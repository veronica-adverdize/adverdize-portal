"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      <div>
        <p className="text-sm font-medium text-gray-900">
          {user?.organisation?.name ?? "Client Portal"}
        </p>
        <p className="text-xs text-gray-400 capitalize">{user?.role?.replace("_", " ")}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E8405A, #F4845F)" }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user?.full_name ?? "User"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
