import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={profile?.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
