import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { isAdmin, isManagerPlus, requireSession } from "@/lib/auth";
import { AccessGate } from "../AccessGate";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CAPABILITY_LABEL, type GrantableCapability, GRANTABLE_CAPABILITIES } from "@/lib/rbac/capabilities";
import { fetchCapabilityGraph } from "../data";
import { RolesClient, type RoleRow } from "./RolesClient";

/**
 * Crew role catalog (backlog P1.2): list, rename, merge.
 *
 * The catalog was backfilled from free-text `crew_members.role`, and
 * `slugify_role()` never fuzzy-matches — so "Stage Manager" and "Stage
 * Manager - cosmicMEADOW" are two entries until an operator decides they are
 * one job. That decision merges permissions, which is why it lives here with
 * a side-by-side compare and not in a regex.
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.capabilities.roles.eyebrow", undefined, "Settings · Capabilities")}
          title={t("console.settings.capabilities.roles.title", undefined, "Crew Roles")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.capabilities.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  if (!isManagerPlus(session)) return <AccessGate need="manager" />;
  const canManage = isManagerPlus(session);
  const canMerge = isAdmin(session);
  const supabase = await createClient();
  const graph = await fetchCapabilityGraph(supabase, session.orgId);

  const labelFor = (c: string) =>
    (GRANTABLE_CAPABILITIES as readonly string[]).includes(c) ? CAPABILITY_LABEL[c as GrantableCapability] : c;

  const grantsByRole = new Map<string, RoleRow["grants"]>();
  for (const g of graph.roleGrants) {
    const list = grantsByRole.get(g.crewRoleId) ?? [];
    list.push({ capability: g.capability, label: labelFor(g.capability), shiftDerivable: g.shiftDerivable });
    grantsByRole.set(g.crewRoleId, list);
  }

  const roles: RoleRow[] = graph.roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    crewCount: graph.crewCountByRole.get(r.id) ?? 0,
    grants: grantsByRole.get(r.id) ?? [],
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.capabilities.roles.eyebrow", undefined, "Settings · Capabilities")}
        title={t("console.settings.capabilities.roles.title", undefined, "Crew Roles")}
        subtitle={t(
          "console.settings.capabilities.roles.subtitle",
          undefined,
          "The job catalog capability grants attach to. Rename freely; merge deliberately, because merging roles merges permissions.",
        )}
      />
      <div className="page-content space-y-6">
        {!canManage && (
          <div className="ps-alert ps-alert--info" role="status">
            {t(
              "console.settings.capabilities.roles.readOnly",
              undefined,
              "You can see the catalog. Editing it needs manager access, and merging needs admin access.",
            )}
          </div>
        )}

        <RolesClient roles={roles} canManage={canManage} canMerge={canMerge} />

        <p className="text-xs text-[var(--p-text-3)]">
          <Link href="/studio/settings/capabilities" className="underline">
            {t("console.settings.capabilities.backToCapabilities", undefined, "Back to Capabilities")}
          </Link>
        </p>
      </div>
    </>
  );
}
