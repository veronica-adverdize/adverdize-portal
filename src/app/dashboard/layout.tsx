import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  const mergedProfile = {
    ...profile,
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? "User",
    email: profile?.email ?? user.email ?? "",
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar role={profile?.role} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={mergedProfile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile nav — visible on mobile only */}
      <MobileNav
        role={profile?.role}
        userName={mergedProfile.full_name}
        orgName={profile?.organisation?.name}
      />
    </div>
  );
}
