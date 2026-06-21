import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { ChevronLeft } from "lucide-react";
import { CompaniesView, type Vendor } from "./CompaniesView";

export const dynamic = "force-dynamic";

/**
 * /m/directory/companies — Vendors.
 *
 * COMPVSS kit `tab==="company"` (design truth app.jsx 2394-2442). Reads org
 * `vendors` (category / trade_categories / rating). The prototype's per-vendor
 * "Scope of Work" + "Department" + "RFP" come from the RFP/job-board system that
 * isn't wired to vendors yet, so scope falls back to the vendor tagline/bio and
 * the trade grouping uses `category` (the single-value column) with
 * `trade_categories[]` surfaced as chips.
 */
export default async function CompaniesPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("vendors")
    .select(
      "id, name, category, trade_categories, contact_email, contact_phone, tagline, bio, website_url, rating_avg, rating_count, logo_url",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(200);

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const vendors: Vendor[] = (data ?? []).map((v) => {
    const trades = Array.isArray(v.trade_categories) ? (v.trade_categories as string[]) : [];
    return {
      id: v.id as string,
      name: (v.name as string) ?? t("m.companies.unnamed", undefined, "Unnamed Vendor"),
      trade: (v.category as string) ?? trades[0] ?? t("m.companies.general", undefined, "General"),
      trades,
      logo: initials((v.name as string) ?? "?"),
      scope: (v.tagline as string) || (v.bio as string) || "",
      phone: (v.contact_phone as string) ?? "",
      email: (v.contact_email as string) ?? "",
      site: (v.website_url as string) ?? "",
      ratingAvg: typeof v.rating_avg === "number" ? v.rating_avg : null,
      ratingCount: typeof v.rating_count === "number" ? v.rating_count : 0,
    };
  });

  const eyebrow = t("m.companies.count", { n: vendors.length }, `${vendors.length} On Project`);

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/directory">
        <ChevronLeft size={17} /> {t("m.directory.title", undefined, "Team Roster")}
      </a>
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.companies.title", undefined, "Vendors")}
      </h1>
      <CompaniesView
        vendors={vendors}
        labels={{
          search: t("m.companies.search", undefined, "Search Vendors, Trade, Scope…"),
          emptyTitle: t("m.companies.empty", undefined, "No Vendors"),
          emptyBody: t("m.companies.emptyBody", undefined, "No organizations match."),
          call: t("m.companies.call", undefined, "Call"),
          email: t("m.companies.email", undefined, "Email"),
        }}
      />
    </div>
  );
}
