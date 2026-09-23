"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, CreditCard, Settings, Menu, X, Plug, BarChart3, Users } from "lucide-react";
import { clsx } from "clsx";
import type { UserRole } from "@/types";

const bottomNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Services", href: "/dashboard/services", icon: Package },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const clientMenuItems = [
  { section: "ACTIVITY", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  { section: "BILLING", items: [{ label: "Subscriptions", href: "/dashboard/billing", icon: CreditCard }] },
  { section: "SERVICES", items: [{ label: "Services", href: "/dashboard/services", icon: Package }] },
  { section: "ACCOUNT", items: [
    { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ]},
];

const adminMenuItems = [
  { section: "OVERVIEW", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  { section: "MANAGE", items: [
    { label: "Clients", href: "/dashboard/admin/clients", icon: Users },
    { label: "Services", href: "/dashboard/admin/services", icon: Package },
  ]},
  { section: "REPORTS", items: [{ label: "Analytics", href: "/dashboard/admin/reports", icon: BarChart3 }] },
  { section: "ACCOUNT", items: [
    { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ]},
];

interface MobileNavProps {
  role?: UserRole;
  userName?: string;
  orgName?: string;
}

export default function MobileNav({ role, userName, orgName }: MobileNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = role === "super_admin" || role === "staff";
  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* Off-canvas overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Off-canvas sidebar */}
      <div className={clsx(
        "fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
        menuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <img src="/images/adverdize-logo.png" alt="Adverdize" className="h-7 w-auto object-contain" />
          <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ background: "linear-gradient(135deg, #E8405A, #F4845F)" }}
            >
              {userName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-400">{orgName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {menuItems.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-semibold text-gray-400 tracking-wider px-3 mb-1">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active ? "text-brand-pink" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      style={active ? { backgroundColor: "rgba(232,64,90,0.08)" } : {}}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Icon
                  size={20}
                  style={active ? { color: "#E8405A" } : { color: "#9ca3af" }}
                />
                <span className={clsx("text-[10px] font-medium", active ? "text-brand-pink" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Menu size={20} className="text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
