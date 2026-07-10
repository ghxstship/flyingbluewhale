import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Service Ops hub (ITIL tech-ops center). Retitled from "Operations" (B-17)
 * so it no longer collides with `/studio/operations` in ⌘K results and
 * breadcrumbs, and tiles upgraded with descriptions + live counts (B-16).
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
      href: "/studio/ops/toc",
      label: t("console.ops.tocLabel", undefined, "TOC"),
      description: t("console.ops.desc.toc", undefined, "Tech ops center and service health"),
    },
    {
      href: "/studio/ops/toc/problems",
      label: t("console.ops.problems", undefined, "Problems"),
      description: t("console.ops.desc.problems", undefined, "Root-cause investigations and known errors"),
      countKey: "itil_problems",
    },
    {
      href: "/studio/ops/toc/changes",
      label: t("console.ops.changes", undefined, "Changes"),
      description: t("console.ops.desc.changes", undefined, "Change requests, approvals, and windows"),
      countKey: "itil_changes",
    },
    {
      href: "/studio/settings/integrations",
      label: t("console.ops.integrations", undefined, "Integrations"),
      description: t("console.ops.desc.integrations", undefined, "Connected services and their health"),
    },
  ];

  const counts = new Map<string, number>();
  if (hasSupabase) {
    const session = await requireSession();
    const tables = ["itil_problems", "itil_changes"] as const;
    const results = await Promise.all(tables.map((table) => countOrgScoped(table, session.orgId)));
    results.forEach((count, i) => counts.set(tables[i], count));
  }

  return (
    <>
      <ModuleHeader
        title={t("console.ops.serviceOpsTitle", undefined, "Service Ops")}
        subtitle={t("console.ops.subtitle", undefined, "ITIL service management for show systems")}
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
