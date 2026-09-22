"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  FileText,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";
import type { UserRole } from "@/types";

const clientNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Services", href: "/dashboard/services", icon: Package },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Invoices", href: "/dashboard/billing/invoices", icon: FileText },
];

const adminNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/dashboard/admin/clients", icon: Users },
  { label: "Services", href: "/dashboard/admin/services", icon: Package },
  { label: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
];

interface SidebarProps {
  role?: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "super_admin" || role === "staff";
  const nav = isAdmin ? adminNav : clientNav;

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/images/adverdize-logo.png" alt="Adverdize" className="h-9 w-auto" />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
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
                  ? "bg-brand-pink/8 text-brand-pink"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
              style={active ? { backgroundColor: "rgba(232,64,90,0.08)" } : {}}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
