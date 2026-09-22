import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("organisation_id", profile?.organisation_id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your billing history with Adverdize.</p>
      </div>

      <div className="card overflow-hidden">
        {(invoices?.length ?? 0) === 0 ? (
          <div className="p-8 text-center">
            <FileText size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No invoices yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-400">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(inv.created_at).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    SGD {(inv.amount / 100).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={inv.status === "paid" ? "badge-active" : "badge-warning"}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.invoice_url ? (
                      <a
                        href={inv.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-pink hover:underline"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
