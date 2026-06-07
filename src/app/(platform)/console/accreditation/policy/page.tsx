import Link from "next/link";
import { Check } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  color: string | null;
};

type ZoneRow = {
  id: string;
  code: string;
  name: string;
  allowed_categories: unknown;
  venue: { name: string | null } | null;
};

function categoriesAllowed(zoneList: unknown): string[] {
  if (!Array.isArray(zoneList)) return [];
  return zoneList.filter((x): x is string => typeof x === "string");
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.accreditation.policy.eyebrow", undefined, "Accreditation")}
          title={t("console.accreditation.policy.title", undefined, "Policy")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.policy.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: catData }, { data: zoneData }] = await Promise.all([
    supabase
      .from("accreditation_categories")
      .select("id, code, name, color")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(200),
    supabase
      .from("venue_zones")
      .select("id, code, name, allowed_categories, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(500),
  ]);

  const categories = (catData ?? []) as CategoryRow[];
  const zones = (zoneData ?? []) as unknown as ZoneRow[];

  const totalCells = categories.length * zones.length;
  const allowedCells = zones.reduce((s, z) => s + categoriesAllowed(z.allowed_categories).length, 0);
  const coverage = totalCells > 0 ? Math.round((allowedCells / totalCells) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.policy.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.policy.title", undefined, "Policy")}
        subtitle={`${categories.length} ${categories.length === 1 ? t("console.accreditation.policy.categorySingular", undefined, "category") : t("console.accreditation.policy.categoryPlural", undefined, "categories")} × ${zones.length} ${zones.length === 1 ? t("console.accreditation.policy.zoneSingular", undefined, "zone") : t("console.accreditation.policy.zonePlural", undefined, "zones")}${coverage != null ? ` · ${t("console.accreditation.policy.coverageSuffix", { coverage }, `${coverage}% coverage`)}` : ""}`}
        action={
          <Button href="/console/accreditation/categories" variant="secondary" size="sm">
            {t("console.accreditation.policy.manageCategories", undefined, "Manage Categories")}
          </Button>
        }
      />
      <div className="page-content">
        {categories.length === 0 || zones.length === 0 ? (
          <EmptyState
            title={t("console.accreditation.policy.emptyTitle", undefined, "Need Categories + Zones First")}
            description={t(
              "console.accreditation.policy.emptyDescription",
              undefined,
              "The matrix derives from accreditation categories crossed with venue zones. Author at least one of each before the policy renders.",
            )}
            action={
              <div className="flex items-center gap-2">
                <Link href="/console/accreditation/categories/new" className="ps-btn ps-btn--sm">
                  {t("console.accreditation.policy.newCategory", undefined, "+ New Category")}
                </Link>
                <Link href="/console/venues" className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("console.accreditation.policy.openVenues", undefined, "Open Venues")}
                </Link>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">
                    {t("console.accreditation.policy.zoneVenueHeader", undefined, "Zone — Venue")}
                  </th>
                  {categories.map((c) => (
                    <th key={c.id} className="text-center">
                      <span
                        className="inline-flex items-center gap-1 font-mono text-xs"
                        style={c.color ? { color: c.color } : undefined}
                        title={c.name}
                      >
                        {c.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const allowed = new Set(categoriesAllowed(z.allowed_categories));
                  return (
                    <tr key={z.id}>
                      <td>
                        <div className="text-sm font-medium">{z.name}</div>
                        <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                          {z.code} · {z.venue?.name ?? "—"}
                        </div>
                      </td>
                      {categories.map((c) => (
                        <td key={c.id} className="text-center">
                          {allowed.has(c.code) || allowed.has(c.id) ? (
                            <Badge
                              variant="success"
                              aria-label={t("console.accreditation.policy.allowed", undefined, "Allowed")}
                            >
                              <Check size={12} aria-hidden="true" strokeWidth={3} />
                            </Badge>
                          ) : (
                            <span
                              className="text-[var(--p-text-2)]"
                              aria-label={t("console.accreditation.policy.notAllowed", undefined, "Not allowed")}
                            >
                              ·
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          {t(
            "console.accreditation.policy.footnote",
            undefined,
            "A green cell means cardholders of the column's category are allowed in the row's zone. To edit, open the venue and use its Zones tab — each zone's allowed-categories list drives this matrix.",
          )}
        </p>
      </div>
    </>
  );
}
