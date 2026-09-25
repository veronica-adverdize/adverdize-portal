"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Plug,
} from "lucide-react";
import type { UserRole } from "@/types";

const clientNav = [
  {
    section: "ACTIVITY",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "BILLING",
    items: [
      { label: "Subscriptions", href: "/dashboard/billing", icon: CreditCard },
    ],
  },
  {
    section: "SERVICES",
    items: [
      { label: "Services", href: "/dashboard/services", icon: Package },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const adminNav = [
  {
    section: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "MANAGE",
    items: [
      { label: "Clients", href: "/dashboard/admin/clients", icon: Users },
      { label: "Services", href: "/dashboard/admin/services", icon: Package },
    ],
  },
  {
    section: "REPORTS",
    items: [
      { label: "Analytics", href: "/dashboard/admin/reports", icon: BarChart3 },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  role?: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "super_admin";
  const nav = isAdmin ? adminNav : clientNav;

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <img
          src="/images/adverdize-logo.png"
          alt="Adverdize"
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-semibold text-gray-300 tracking-widest px-3 mb-1.5">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "text-[#E05C83]"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                    )}
                    style={active ? { backgroundColor: "rgba(224,92,131,0.08)" } : {}}
                  >
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-300">© 2026 Adverdize</p>
      </div>
    </aside>
  );
}