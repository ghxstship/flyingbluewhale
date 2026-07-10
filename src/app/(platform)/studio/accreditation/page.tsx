import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Accreditation hub — B-16: label-only tiles upgraded with a one-line
 * description and a live org-scoped count per backing store
 * (`count: "exact", head: true` — no rows fetched to count).
 */

type Tile = {
  href: string;
  label: string;
  description: string;
  countKey?: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const tiles: Tile[] = [
    {
      href: "/studio/accreditation/policy",
      label: t("console.accreditation.policyLabel", undefined, "Policy"),
      description: t("console.accreditation.desc.policy", undefined, "Category access matrix across zones"),
    },
    {
      href: "/studio/accreditation/categories",
      label: t("console.accreditation.categoriesLabel", undefined, "Categories"),
      description: t("console.accreditation.desc.categories", undefined, "Badge categories and their privileges"),
      countKey: "accreditation_categories",
    },
    {
      href: "/studio/accreditation/zones",
      label: t("console.accreditation.zonesLabel", undefined, "Zones"),
      description: t("console.accreditation.desc.zones", undefined, "Controlled areas and access levels"),
      countKey: "venue_zones",
    },
    {
      href: "/studio/accreditation/vetting",
      label: t("console.accreditation.vettingLabel", undefined, "Vetting"),
      description: t("console.accreditation.desc.vetting", undefined, "Applications through screening to approval"),
      countKey: "accreditations",
    },
    {
      href: "/studio/accreditation/print",
      label: t("console.accreditation.printQueue", undefined, "Print queue"),
      description: t("console.accreditation.desc.print", undefined, "Approved badges awaiting production"),
    },
    {
      href: "/studio/accreditation/scans",
      label: t("console.accreditation.scansLabel", undefined, "Scans"),
      description: t("console.accreditation.desc.scans", undefined, "Gate scan journal, accepted and denied"),
      countKey: "access_scans",
    },
    {
      href: "/studio/accreditation/changes",
      label: t("console.accreditation.changesLabel", undefined, "Changes"),
      description: t("console.accreditation.desc.changes", undefined, "Upgrades, downgrades, and reissues"),
      countKey: "accreditation_changes",
    },
  ];

  const counts = new Map<string, number>();
  if (hasSupabase) {
    const session = await requireSession();
    const tables = [
      "accreditation_categories",
      "venue_zones",
      "accreditations",
      "access_scans",
      "accreditation_changes",
    ] as const;
    const results = await Promise.all(tables.map((table) => countOrgScoped(table, session.orgId)));
    results.forEach((count, i) => counts.set(tables[i], count));
  }

  return (
    <>
      <ModuleHeader
        title={t("console.accreditation.title", undefined, "Accreditation")}
        subtitle={t("console.accreditation.subtitle", undefined, "Who gets in, where, and on whose say-so")}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const count = tile.countKey ? counts.get(tile.countKey) : undefined;
            return (
              <Link key={tile.href} className="surface hover-lift p-4" href={tile.href}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium">{tile.label}</div>
                  {count != null && (
                    <div className="font-mono text-xs text-[var(--p-text-2)] tabular-nums">{fmt.number(count)}</div>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.description}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
