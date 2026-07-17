import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { isAdmin, requireSession } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";
import { AccessGate } from "../AccessGate";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CAPABILITY_LABEL, GRANTABLE_CAPABILITIES, type GrantableCapability } from "@/lib/rbac/capabilities";
import { computeEnforcementDiff } from "@/lib/rbac/holders";
import { fetchCapabilityGraph } from "../data";
import { EnforcementForm } from "./EnforcementForm";

/**
 * The enforcement flip, preview-first (backlog P2.4, ADR-0015 "flipped from
 * an admin surface that first shows who would lose access").
 *
 * `orgs.capability_grants_enforced` FALSE means the legacy `check-in:*`
 * blanket is synthesized as `scan:*` — every crew member scans everything.
 * TRUE means configured grants are the source of truth. This page renders the
 * exact diff (legacy synthesis vs configured grants, both resolved through
 * the same logic as a live request) before offering the switch, and the
 * action re-measures the diff at submit time. There is no silent path.
 */
export const dynamic = "force-dynamic";

function capLabel(c: string): string {
  return (GRANTABLE_CAPABILITIES as readonly string[]).includes(c)
    ? CAPABILITY_LABEL[c as GrantableCapability]
    : c;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.capabilities.enforcementPage.eyebrow", undefined, "Settings · Capabilities")}
          title={t("console.settings.capabilities.enforcementPage.title", undefined, "Enforcement")}
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
  // Managers may STUDY the who-loses-access diff (it is the answer to "what
  // happens if we flip"); the flip control itself stays admin (canEdit) and
  // the action re-checks server-side. Members are refused outright.
  if (!isManagerPlus(session)) return <AccessGate need="manager" />;
  const canEdit = isAdmin(session);
  const supabase = await createClient();
  const graph = await fetchCapabilityGraph(supabase, session.orgId);

  const diff = computeEnforcementDiff({
    members: graph.members,
    crewRoleIdsByUser: graph.crewRoleIdsByUser,
    roleNameById: graph.roleNameById,
    roleGrants: graph.roleGrants,
    userGrants: graph.userGrants,
    now: new Date(),
  });
  const losing = diff.filter((d) => d.loses.length > 0);
  const keptByGrants = diff.filter(
    (d) => d.loses.length === 0 && d.post.some((c) => (c as string).startsWith("scan:")),
  );

  const enabling = !graph.enforced;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.capabilities.enforcementPage.eyebrow", undefined, "Settings · Capabilities")}
        title={t("console.settings.capabilities.enforcementPage.title", undefined, "Enforcement")}
        subtitle={t(
          "console.settings.capabilities.enforcementPage.subtitle",
          undefined,
          "Make configured grants the source of truth for scanning. Preview who is affected before anything changes.",
        )}
      />
      <div className="page-content space-y-6">
        <div className="surface p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={graph.enforced ? "success" : "warning"}>
              {graph.enforced
                ? t("console.settings.capabilities.enforced", undefined, "Enforced")
                : t("console.settings.capabilities.grandfathered", undefined, "Grandfathered")}
            </Badge>
            <p className="text-sm text-[var(--p-text-2)]">
              {graph.enforced
                ? t(
                    "console.settings.capabilities.enforcementPage.currentlyEnforced",
                    undefined,
                    "Grants are currently the source of truth. Turning this off restores the legacy blanket: everyone whose role could scan before enforcement scans everything again.",
                  )
                : t(
                    "console.settings.capabilities.enforcementPage.currentlyGrandfathered",
                    undefined,
                    "The legacy blanket is active: everyone who could scan before this system existed still scans everything. Enforcing makes the grants you configured the only source of scan access.",
                  )}
            </p>
          </div>
        </div>

        {enabling ? (
          <>
            {/* The consequence, before the switch. */}
            <div className="surface p-5">
              <h2 className="text-sm font-semibold">
                {t(
                  "console.settings.capabilities.enforcementPage.whoLoses",
                  undefined,
                  "Who Would Lose Access",
                )}
              </h2>
              {losing.length === 0 ? (
                <div className="mt-3">
                  <div className="ps-alert ps-alert--info" role="status">
                    {t(
                      "console.settings.capabilities.enforcementPage.nobodyLoses",
                      undefined,
                      "Nobody loses access. Everyone who scans today is covered by a role or personal grant, so this flip only removes the blanket nobody is standing on.",
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">
                    {t(
                      "console.settings.capabilities.enforcementPage.whoLosesBody",
                      undefined,
                      "These people hold scan access only through the legacy blanket. The moment grants are enforced they are refused at the scanner, until a role or personal grant covers them.",
                    )}
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="ps-table w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">
                            {t("console.settings.capabilities.person", undefined, "Person")}
                          </th>
                          <th className="text-left">
                            {t("console.settings.capabilities.access", undefined, "Access")}
                          </th>
                          <th className="text-left">
                            {t("console.settings.capabilities.enforcementPage.loses", undefined, "Loses")}
                          </th>
                          <th className="text-left">
                            {t("console.settings.capabilities.enforcementPage.keeps", undefined, "Keeps")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {losing.map((d) => (
                          <tr key={d.userId}>
                            <td className="font-medium">{d.email}</td>
                            <td className="text-xs text-[var(--p-text-2)]">
                              {d.persona !== d.role ? `${d.role} · ${d.persona}` : d.role}
                            </td>
                            <td>
                              <span className="flex flex-wrap gap-1">
                                {d.loses.map((c) => (
                                  <Badge key={c} variant="error">
                                    {capLabel(c)}
                                  </Badge>
                                ))}
                              </span>
                            </td>
                            <td>
                              {d.post.length === 0 ? (
                                <span className="text-xs text-[var(--p-text-3)]">
                                  {t(
                                    "console.settings.capabilities.enforcementPage.nothing",
                                    undefined,
                                    "Nothing",
                                  )}
                                </span>
                              ) : (
                                <span className="flex flex-wrap gap-1">
                                  {d.post.map((c) => (
                                    <Badge key={c} variant="muted">
                                      {capLabel(c)}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {keptByGrants.length > 0 && (
              <div className="surface p-5">
                <h2 className="text-sm font-semibold">
                  {t(
                    "console.settings.capabilities.enforcementPage.covered",
                    undefined,
                    "Covered By Grants",
                  )}
                </h2>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.settings.capabilities.enforcementPage.coveredBody",
                    undefined,
                    "These people keep scan access after the flip because a role or personal grant covers them.",
                  )}
                </p>
                <ul className="mt-3 space-y-1">
                  {keptByGrants.map((d) => (
                    <li key={d.userId} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{d.email}</span>
                      <span className="flex flex-wrap gap-1">
                        {d.post
                          .filter((c) => (c as string).startsWith("scan:") || c === "asset:custody")
                          .map((c) => (
                            <Badge key={c} variant="success">
                              {capLabel(c)}
                            </Badge>
                          ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">
              {t(
                "console.settings.capabilities.enforcementPage.whoRegains",
                undefined,
                "Who Would Regain The Blanket",
              )}
            </h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.settings.capabilities.enforcementPage.whoRegainsBody",
                undefined,
                "Turning enforcement off re-synthesizes the legacy blanket. These people would go back to scanning everything, whatever the grant tables say.",
              )}
            </p>
            {losing.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--p-text-3)]">
                {t(
                  "console.settings.capabilities.enforcementPage.nobodyRegains",
                  undefined,
                  "Nobody gains anything: every scanner is already fully covered by grants.",
                )}
              </p>
            ) : (
              <ul className="mt-3 space-y-1">
                {losing.map((d) => (
                  <li key={d.userId} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{d.email}</span>
                    <span className="flex flex-wrap gap-1">
                      {d.loses.map((c) => (
                        <Badge key={c} variant="warning">
                          {capLabel(c)}
                        </Badge>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="surface p-5">
          {canEdit ? (
            <EnforcementForm enabling={enabling} losers={enabling ? losing.length : 0} />
          ) : (
            <p className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.settings.capabilities.enforcementPage.adminOnly",
                undefined,
                "Flipping enforcement needs admin access.",
              )}
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--p-text-3)]">
            <Link href="/studio/settings/capabilities" className="underline">
              {t("console.settings.capabilities.backToCapabilities", undefined, "Back to Capabilities")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
