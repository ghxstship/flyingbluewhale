import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { isAdmin, isManagerPlus, requireSession } from "@/lib/auth";
import { AccessGate } from "./AccessGate";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CAPABILITY_DESCRIPTION, CAPABILITY_LABEL, GRANTABLE_CAPABILITIES } from "@/lib/rbac/capabilities";
import { computeHolders, type HeldVia } from "@/lib/rbac/holders";
import { CapabilitiesClient, type MatrixCell, type MatrixRow, type UserGrantRow } from "./CapabilitiesClient";
import { fetchCapabilityGraph } from "./data";

/**
 * Capabilities — the administration ADR-0015 was missing (backlog P1.1).
 *
 * Three pieces on one surface:
 *   (a) the role × capability matrix over crew_roles × role_capability_grants,
 *   (b) per-person time-boxed grants over user_capability_grants,
 *   (c) the live "who holds what" view — resolved through the same logic as
 *       `public.effective_capabilities()` + the static floor (see
 *       src/lib/rbac/holders.ts), including the grandfather blanket while
 *       `orgs.capability_grants_enforced` is false.
 *
 * The enforcement flip lives on its own subpage (./enforcement) because it
 * must never happen without a who-loses-access preview (backlog P2.4).
 */
export const dynamic = "force-dynamic";

const VIA_LABEL: Record<HeldVia, string> = {
  base: "Role floor",
  role: "Crew role",
  person: "Personal",
  blanket: "Legacy blanket",
};

const VIA_VARIANT: Record<HeldVia, "default" | "success" | "warning" | "info" | "brand" | "muted"> = {
  base: "muted",
  role: "brand",
  person: "info",
  blanket: "warning",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.capabilities.eyebrow", undefined, "Settings · Team & Access")}
          title={t("console.settings.capabilities.title", undefined, "Capabilities")}
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
  const fmt = await getRequestFormatters();

  // Reads are MANAGER-band ("why was Bob refused at the gate"), writes admin
  // (RLS: 20260715171424_capability_grants_admin_band). Nav hides the entry
  // below manager, but the deployed-target e2e walked a member straight to
  // the URL and the whole grant graph rendered — so the page refuses too.
  if (!isManagerPlus(session)) return <AccessGate need="manager" />;
  const canEdit = isAdmin(session);
  const supabase = await createClient();

  const graph = await fetchCapabilityGraph(supabase, session.orgId);
  const now = new Date();

  const catalog = GRANTABLE_CAPABILITIES.map((c) => ({
    value: c,
    label: CAPABILITY_LABEL[c],
    description: CAPABILITY_DESCRIPTION[c],
  }));

  // ── (a) the matrix ────────────────────────────────────────────────────────
  const cellsByRole = new Map<string, Record<string, MatrixCell>>();
  for (const g of graph.roleGrants) {
    const cells = cellsByRole.get(g.crewRoleId) ?? {};
    cells[g.capability] = { grantId: g.id, shiftDerivable: g.shiftDerivable };
    cellsByRole.set(g.crewRoleId, cells);
  }
  const matrix: MatrixRow[] = graph.roles.map((r) => ({
    roleId: r.id,
    roleName: r.name,
    crewCount: graph.crewCountByRole.get(r.id) ?? 0,
    cells: cellsByRole.get(r.id) ?? {},
  }));

  // ── (b) individual grants, annotated with liveness ───────────────────────
  const userGrants: UserGrantRow[] = graph.userGrants.map((g) => {
    const from = g.validFrom ? Date.parse(g.validFrom) : null;
    const until = g.validUntil ? Date.parse(g.validUntil) : null;
    const live = (from === null || from <= now.getTime()) && (until === null || until > now.getTime());
    const window =
      from === null && until === null
        ? t("console.settings.capabilities.always", undefined, "No end date")
        : `${from ? fmt.date(g.validFrom as string) : "—"} → ${until ? fmt.date(g.validUntil as string) : "—"}`;
    return {
      id: g.id,
      capability: g.capability,
      email: graph.emailByUser.get(g.userId) ?? g.userId,
      window,
      live,
      lapsed: until !== null && until <= now.getTime(),
      reason: g.reason,
    };
  });

  // ── (c) who holds what, right now, under the CURRENT enforcement rule ────
  const holders = computeHolders({
    members: graph.members,
    crewRoleIdsByUser: graph.crewRoleIdsByUser,
    roleNameById: graph.roleNameById,
    roleGrants: graph.roleGrants,
    userGrants: graph.userGrants,
    enforced: graph.enforced,
    now,
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.capabilities.eyebrow", undefined, "Settings · Team & Access")}
        title={t("console.settings.capabilities.title", undefined, "Capabilities")}
        subtitle={t(
          "console.settings.capabilities.subtitle",
          undefined,
          "Add-on permissions on top of what a role already has. Grant them to a role, or to one person for a set window.",
        )}
      />
      <div className="page-content space-y-6">
        {!canEdit && (
          <div className="ps-alert ps-alert--info" role="status">
            {t(
              "console.settings.capabilities.readOnly",
              undefined,
              "You can see what this workspace grants. Changing it needs admin access.",
            )}
          </div>
        )}

        {/* Enforcement status. Deliberately first — this is the rule everything
            below is read under. The flip itself lives on the preview page and
            nowhere else: it must never happen without showing who loses. */}
        <div className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-sm font-semibold">
                {t("console.settings.capabilities.enforcement", undefined, "Enforcement")}
              </h2>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">
                {graph.enforced
                  ? t(
                      "console.settings.capabilities.enforcedBody",
                      undefined,
                      "Grants are live. People hold what their role floor gives them, plus what is granted below, and nothing else.",
                    )
                  : t(
                      "console.settings.capabilities.grandfatheredBody",
                      undefined,
                      "Grants are not enforced yet. Everyone who could scan before still scans everything, so nothing below has bitten. Configure the grants you want, then review the flip.",
                    )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={graph.enforced ? "success" : "warning"}>
                {graph.enforced
                  ? t("console.settings.capabilities.enforced", undefined, "Enforced")
                  : t("console.settings.capabilities.grandfathered", undefined, "Grandfathered")}
              </Badge>
              {canEdit && (
                <Link href="/studio/settings/capabilities/enforcement" className="ps-btn ps-btn--sm">
                  {t("console.settings.capabilities.reviewFlip", undefined, "Review the flip")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {graph.roles.length === 0 && (
          <EmptyState
            size="compact"
            title={t("console.settings.capabilities.noRoles.title", undefined, "No Roles Yet")}
            description={t(
              "console.settings.capabilities.noRoles.body",
              undefined,
              "Capabilities are granted to a role or a person. Add the roles your crew actually work as in the role catalog, then grant from here.",
            )}
            action={
              <Link href="/studio/settings/capabilities/roles" className="ps-btn ps-btn--sm">
                {t("console.settings.capabilities.openRoleCatalog", undefined, "Open the role catalog")}
              </Link>
            }
          />
        )}

        <CapabilitiesClient
          canEdit={canEdit}
          catalog={catalog}
          matrix={matrix}
          members={graph.members.map((m) => ({ id: m.userId, email: m.email }))}
          userGrants={userGrants}
        />

        {/* Who holds what — the resolved answer, not the configuration. */}
        <div className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.capabilities.whoHoldsWhat", undefined, "Who Holds What")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.capabilities.whoHoldsWhatBody",
              undefined,
              "Resolved the same way a live request resolves it: static role floor, plus crew-role grants, plus personal grants inside their window, plus the legacy blanket while enforcement is off.",
            )}
          </p>
          {holders.length === 0 ? (
            <p className="mt-4 text-xs text-[var(--p-text-3)]">
              {t("console.settings.capabilities.noMembers", undefined, "No members.")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">{t("console.settings.capabilities.person", undefined, "Person")}</th>
                    <th className="text-left">{t("console.settings.capabilities.access", undefined, "Access")}</th>
                    {catalog.map((c) => (
                      <th key={c.value} className="text-center" title={c.description}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holders.map((h) => (
                    <tr key={h.userId}>
                      <td>
                        <span className="font-medium">{h.email}</span>
                        {h.grantingRoles.length > 0 && (
                          <span className="ml-2 text-xs text-[var(--p-text-3)]">{h.grantingRoles.join(", ")}</span>
                        )}
                      </td>
                      <td className="text-xs text-[var(--p-text-2)]">
                        {h.persona !== h.role ? `${h.role} · ${h.persona}` : h.role}
                      </td>
                      {h.holdings.map((holding) => (
                        <td key={holding.capability} className="text-center">
                          {holding.held && holding.via ? (
                            <Badge variant={VIA_VARIANT[holding.via]}>{VIA_LABEL[holding.via]}</Badge>
                          ) : (
                            <span className="text-[var(--p-text-3)]">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.capabilities.reference", undefined, "What Each One Means")}
          </h2>
          <ul className="mt-3 space-y-2">
            {catalog.map((c) => (
              <li key={c.value} className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <Badge variant="muted">{c.label}</Badge>
                  <code className="font-mono text-xs text-[var(--p-text-3)]">{c.value}</code>
                </span>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">{c.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
