import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("Search: failed to create supabase client", e);
    return NextResponse.json({ results: getPageResults(q, false) });
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (!authUser) {
    console.error("Search: no auth user", authError);
    // Still return page results even without auth
    return NextResponse.json({ results: getPageResults(q, false) });
  }

  const { data: dbUser, error: dbError } = await supabase
    .from("users")
    .select("role, organisation_id")
    .eq("id", authUser.id)
    .single();

  if (!dbUser) {
    console.error("Search: user not found in db", dbError);
    return NextResponse.json({ results: getPageResults(q, false) });
  }

  const isAdmin = dbUser.role === "super_admin" || dbUser.role === "staff";
  const pattern = `%${q}%`;

  type SearchResult = {
    type: string;
    id: string;
    title: string;
    subtitle?: string;
    href: string;
  };

  const results: SearchResult[] = [];

  // Services — available to everyone
  const { data: services } = await supabase
    .from("service_packages")
    .select("id, name, description")
    .ilike("name", pattern)
    .eq("is_active", true)
    .limit(5);

  if (services) {
    for (const s of services) {
      results.push({
        type: "service",
        id: s.id,
        title: s.name,
        subtitle: s.description?.slice(0, 60),
        href: isAdmin
          ? `/dashboard/admin/services`
          : `/dashboard/services`,
      });
    }
  }

  if (isAdmin) {
    // Clients/orgs — admin only
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name")
      .ilike("name", pattern)
      .limit(5);

    if (orgs) {
      for (const o of orgs) {
        results.push({
          type: "client",
          id: o.id,
          title: o.name,
          href: `/dashboard/admin/clients/${o.id}`,
        });
      }
    }

    // Users — admin only
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(5);

    if (users) {
      for (const u of users) {
        results.push({
          type: "user",
          id: u.id,
          title: u.full_name || u.email,
          subtitle: u.email,
          href: `/dashboard/admin/clients`,
        });
      }
    }

    // Promo codes — admin only
    const { data: promos } = await supabase
      .from("promo_codes")
      .select("id, code, description")
      .ilike("code", pattern)
      .limit(5);

    if (promos) {
      for (const p of promos) {
        results.push({
          type: "promo",
          id: p.id,
          title: p.code,
          subtitle: p.description?.slice(0, 60),
          href: `/dashboard/admin/promo-codes`,
        });
      }
    }

    // All subscriptions — admin
    const { data: adminSubs } = await supabase
      .from("subscriptions")
      .select("id, status, service:service_packages(name), organisation:organisations(name)")
      .eq("status", "active")
      .limit(5);

    if (adminSubs) {
      for (const sub of adminSubs) {
        const serviceName =
          (sub.service as unknown as { name: string })?.name ?? "";
        const orgName =
          (sub.organisation as unknown as { name: string })?.name ?? "";
        if (
          serviceName.toLowerCase().includes(q.toLowerCase()) ||
          orgName.toLowerCase().includes(q.toLowerCase())
        ) {
          results.push({
            type: "subscription",
            id: sub.id,
            title: `${serviceName}`,
            subtitle: `${orgName} · ${sub.status}`,
            href: `/dashboard/admin/clients`,
          });
        }
      }
    }
  } else {
    // Client subscriptions — own org only
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, status, service:service_packages(name)")
      .eq("organisation_id", dbUser.organisation_id)
      .limit(5);

    if (subs) {
      for (const sub of subs) {
        const serviceName =
          (sub.service as unknown as { name: string })?.name ?? "";
        if (serviceName.toLowerCase().includes(q.toLowerCase())) {
          results.push({
            type: "subscription",
            id: sub.id,
            title: serviceName,
            subtitle: sub.status,
            href: `/dashboard/billing`,
          });
        }
      }
    }

    // Client invoices — own org only
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, amount, currency, status, created_at")
      .eq("organisation_id", dbUser.organisation_id)
      .limit(5);

    if (invoices) {
      for (const inv of invoices) {
        const label = `${inv.currency} ${inv.amount} — ${inv.status}`;
        if (label.toLowerCase().includes(q.toLowerCase())) {
          results.push({
            type: "invoice",
            id: inv.id,
            title: `Invoice ${inv.currency} ${inv.amount}`,
            subtitle: inv.status,
            href: `/dashboard/billing/invoices`,
          });
        }
      }
    }
  }

  results.push(...getPageResults(q, isAdmin));

  console.log(`Search: q="${q}" isAdmin=${isAdmin} results=${results.length}`);
  return NextResponse.json({ results: results.slice(0, 15) });
  } catch (e) {
    console.error("Search: unexpected error", e);
    return NextResponse.json({ results: getPageResults(q!, false) });
  }
}

function getPageResults(q: string, isAdmin: boolean) {
  const common = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Billing", href: "/dashboard/billing" },
    { title: "Integrations", href: "/dashboard/integrations" },
    { title: "Settings", href: "/dashboard/settings" },
  ];

  const adminPages = [
    { title: "Clients", href: "/dashboard/admin/clients" },
    { title: "Services", href: "/dashboard/admin/services" },
    { title: "Analytics", href: "/dashboard/admin/reports" },
    { title: "Promo Codes", href: "/dashboard/admin/promo-codes" },
  ];

  const clientPages = [
    { title: "Services", href: "/dashboard/services" },
    { title: "Invoices", href: "/dashboard/billing/invoices" },
  ];

  const pages = [...common, ...(isAdmin ? adminPages : clientPages)];

  return pages
    .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({
      type: "page",
      id: p.href,
      title: p.title,
      href: p.href,
    }));
}
