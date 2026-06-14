export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import Link from "next/link";

/**
 * Credential Expiry Monitor — surfaces assignments whose credentials
 * expire within the next 30 days so operators can act before crew
 * members are locked out of a show.
 * Competitive parity: LASSO Alert Mode credential monitoring + Teambridge AI credentialing agents.
 */
export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          title={t("console.accreditation.expiring.title", undefined, "Expiring Credentials")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t(
              "console.accreditation.expiring.configureSupabase",
              undefined,
              "Configure Supabase.",
            )}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const today = new Date();
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  const todayStr = today.toISOString().slice(0, 10);
  const in30Str = in30.toISOString().slice(0, 10);

  // Fetch credential assignments for the org
  const { data: credAssignments } = await supabase
    .from("assignments")
    .select(
      "id, party_kind, party_user_id, catalog_item:master_catalog_items(name), project:projects(id, name), crew_member:crew_members(id, full_name)",
    )
    .eq("org_id", session.orgId)
    .eq("catalog_kind", "credential")
    .is("deleted_at", null);

  const assignmentIds = (credAssignments ?? []).map((a) => a.id);

  // Fetch credential details with expiry in the 30-day window
  const { data: details } = assignmentIds.length
    ? await supabase
        .from("credential_assignment_details")
        .select("assignment_id, expires_on, access_level")
        .in("assignment_id", assignmentIds)
        .not("expires_on", "is", null)
        .gte("expires_on", todayStr)
        .lte("expires_on", in30Str)
        .order("expires_on", { ascending: true })
    : { data: [] };

  type AssignmentRow = {
    id: string;
    party_kind: string;
    party_user_id: string | null;
    catalog_item: { name: string } | null;
    project: { id: string; name: string } | null;
    crew_member: { id: string; full_name: string } | null;
  };

  type DetailRow = {
    assignment_id: string;
    expires_on: string;
    access_level: string | null;
  };

  const assignmentMap = new Map(((credAssignments ?? []) as AssignmentRow[]).map((a) => [a.id, a]));
  const expiring = (details ?? []) as DetailRow[];

  // Urgency bucketing
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in14 = new Date(today);
  in14.setDate(in14.getDate() + 14);

  function urgencyOf(expiresOn: string): "error" | "warning" | "info" {
    const d = new Date(expiresOn);
    if (d <= in7) return "error";
    if (d <= in14) return "warning";
    return "info";
  }

  function urgencyLabel(urgency: "error" | "warning" | "info"): string {
    if (urgency === "error")
      return t("console.accreditation.expiring.urgency.critical", undefined, "≤ 7 days");
    if (urgency === "warning")
      return t("console.accreditation.expiring.urgency.warning", undefined, "8–14 days");
    return t("console.accreditation.expiring.urgency.info", undefined, "15–30 days");
  }

  function daysUntil(expiresOn: string): number {
    return Math.ceil((new Date(expiresOn).getTime() - today.getTime()) / 86400000);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.expiring.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.expiring.title", undefined, "Expiring Credentials")}
        subtitle={t(
          "console.accreditation.expiring.subtitle",
          undefined,
          "Credentials expiring within 30 days across all active projects.",
        )}
        breadcrumbs={[
          {
            label: t("console.accreditation.expiring.breadcrumbs.accreditation", undefined, "Accreditation"),
            href: "/console/accreditation",
          },
          { label: t("console.accreditation.expiring.title", undefined, "Expiring") },
        ]}
      />
      <div className="page-content space-y-4">
        {expiring.length === 0 ? (
          <div className="surface p-10 text-center">
            <p className="text-sm font-medium text-[var(--p-text-1)]">
              {t(
                "console.accreditation.expiring.empty.title",
                undefined,
                "No credentials expiring in the next 30 days",
              )}
            </p>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.accreditation.expiring.empty.body",
                undefined,
                "All crew credentials are valid through the next month.",
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--p-text-2)]">
              <span className="font-medium text-[var(--p-text-1)]">{expiring.length}</span>
              {t(
                "console.accreditation.expiring.count",
                { count: expiring.length },
                `credential${expiring.length !== 1 ? "s" : ""} expiring in the next 30 days`,
              )}
            </div>

            <div className="surface overflow-hidden">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>
                      {t("console.accreditation.expiring.cols.holder", undefined, "Holder")}
                    </th>
                    <th>
                      {t("console.accreditation.expiring.cols.credential", undefined, "Credential")}
                    </th>
                    <th>
                      {t("console.accreditation.expiring.cols.project", undefined, "Project")}
                    </th>
                    <th>
                      {t("console.accreditation.expiring.cols.expires", undefined, "Expires")}
                    </th>
                    <th>
                      {t("console.accreditation.expiring.cols.urgency", undefined, "Urgency")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiring.map((d) => {
                    const a = assignmentMap.get(d.assignment_id);
                    if (!a) return null;
                    const urgency = urgencyOf(d.expires_on);
                    const days = daysUntil(d.expires_on);
                    const holderName =
                      a.party_kind === "crew_member" && a.crew_member
                        ? a.crew_member.full_name
                        : a.party_kind === "user" && a.party_user_id
                          ? t(
                              "console.accreditation.expiring.platformUser",
                              undefined,
                              "Platform user",
                            )
                          : t("console.accreditation.expiring.unknownHolder", undefined, "Unknown");
                    return (
                      <tr key={d.assignment_id}>
                        <td>
                          {a.party_kind === "crew_member" && a.crew_member ? (
                            <Link
                              href={`/console/people/${a.crew_member.id}`}
                              className="font-medium hover:underline"
                            >
                              {holderName}
                            </Link>
                          ) : (
                            <span className="font-medium">{holderName}</span>
                          )}
                        </td>
                        <td>
                          <span className="text-[var(--p-text-1)]">
                            {a.catalog_item?.name ??
                              t(
                                "console.accreditation.expiring.unknownCredential",
                                undefined,
                                "Unknown credential",
                              )}
                          </span>
                          {d.access_level && (
                            <span className="ml-1.5 text-xs text-[var(--p-text-2)]">
                              ({d.access_level})
                            </span>
                          )}
                        </td>
                        <td>
                          {a.project ? (
                            <Link
                              href={`/console/projects/${a.project.id}/advancing`}
                              className="text-[var(--p-text-2)] hover:underline"
                            >
                              {a.project.name}
                            </Link>
                          ) : (
                            <span className="text-[var(--p-text-2)]">—</span>
                          )}
                        </td>
                        <td className="font-mono text-xs">
                          {d.expires_on}
                          <span className="ml-1.5 text-[var(--p-text-2)]">
                            ({t(
                              "console.accreditation.expiring.daysLeft",
                              { days },
                              `${days}d`,
                            )})
                          </span>
                        </td>
                        <td>
                          <Badge variant={urgency}>
                            {urgencyLabel(urgency)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
