export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Network, Search, UserRoundPlus } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { can, requireSession } from "@/lib/auth";
import { FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";
import { getRequestT } from "@/lib/i18n/request";
import { listOfferLetters, listOrgRoles, listRateCardItems } from "@/lib/offer-letters/queries";
import { createClient } from "@/lib/supabase/server";
import { AssignDrawer, type PersonOption, type RateOption, type RoleOption } from "./AssignDrawer";
import { CapabilityLock } from "./CapabilityLock";
import { CUSTOM_POSITION_SLUG, LETTER_STATE_LABEL, LETTER_STATE_VARIANT, displayRoleTitle } from "./letter-state";

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fulfillmentLabel(state: string): string {
  return state
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ q?: string; assign?: string }>;
}) {
  const { projectId } = await params;
  const { q = "", assign } = await searchParams;
  const session = await requireSession();
  const { t } = await getRequestT();
  const base = `/studio/projects/${projectId}/roster`;

  if (!can(session, "people:manage")) {
    return <CapabilityLock capability="people:manage" backHref={`/studio/projects/${projectId}`} />;
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, start_date, end_date")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const letters = await listOfferLetters(session.orgId, projectId);
  const letterIds = letters.map((l) => l.id);
  const crewIds = [...new Set(letters.map((l) => l.crew_member_id))];

  // Onboarding done-counts + advance rollups, batched (no N+1).
  const [stepsRes, assignmentsRes] = await Promise.all([
    letterIds.length
      ? supabase.from("onboarding_steps").select("offer_letter_id, step_state").in("offer_letter_id", letterIds)
      : Promise.resolve({ data: [] as Array<{ offer_letter_id: string; step_state: string }> }),
    crewIds.length
      ? supabase
          .from("assignments")
          .select("party_crew_id, fulfillment_state")
          .eq("org_id", session.orgId)
          .eq("project_id", projectId)
          .in("party_crew_id", crewIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as Array<{ party_crew_id: string | null; fulfillment_state: string }> }),
  ]);

  const stepsByLetter = new Map<string, { done: number; total: number }>();
  for (const s of (stepsRes.data ?? []) as Array<{ offer_letter_id: string; step_state: string }>) {
    const bucket = stepsByLetter.get(s.offer_letter_id) ?? { done: 0, total: 0 };
    bucket.total += 1;
    if (s.step_state === "done" || s.step_state === "waived") bucket.done += 1;
    stepsByLetter.set(s.offer_letter_id, bucket);
  }

  const advanceByCrew = new Map<string, { count: number; furthest: number }>();
  for (const a of (assignmentsRes.data ?? []) as Array<{ party_crew_id: string | null; fulfillment_state: string }>) {
    if (!a.party_crew_id) continue;
    const bucket = advanceByCrew.get(a.party_crew_id) ?? { count: 0, furthest: -1 };
    bucket.count += 1;
    bucket.furthest = Math.max(bucket.furthest, FULFILLMENT_STATES.indexOf(a.fulfillment_state as FulfillmentState));
    advanceByCrew.set(a.party_crew_id, bucket);
  }

  const query = q.trim().toLowerCase();
  const rows = letters.filter((l) => {
    if (!query) return true;
    const role = displayRoleTitle(l.role_slug, l.role_title, l.expectations_override);
    return `${l.recipient_name} ${role}`.toLowerCase().includes(query);
  });

  const offersOut = letters.filter((l) => l.status === "sent" || l.status === "viewed").length;
  const pendingOnboarding = letters.filter((l) => {
    const s = stepsByLetter.get(l.id);
    return !!s && s.total > 0 && s.done < s.total;
  }).length;

  // Drawer data — only fetched while the drawer is open.
  let drawer: ReactNode = null;
  if (assign === "1") {
    const [{ data: crew }, roles, rates] = await Promise.all([
      supabase
        .from("crew_members")
        .select("id, name, role")
        .eq("org_id", session.orgId)
        .neq("engagement_state", "separated")
        .order("name"),
      listOrgRoles(session.orgId),
      listRateCardItems(session.orgId),
    ]);
    drawer = (
      <AssignDrawer
        projectId={projectId}
        closeHref={base}
        people={((crew ?? []) as PersonOption[]).map((c) => ({ id: c.id, name: c.name, role: c.role }))}
        roles={roles.filter((r) => r.slug !== CUSTOM_POSITION_SLUG).map(
          (r): RoleOption => ({ id: r.id, label: r.label, department: r.department }),
        )}
        rates={rates.map((r): RateOption => ({ id: r.id, name: r.name, sku: r.sku, unit_price_cents: r.unit_price_cents }))}
        defaultStart={project.start_date}
        defaultEnd={project.end_date}
      />
    );
  }

  const assignCta = (
    <Button href={`${base}?assign=1`} variant="cta">
      <UserRoundPlus size={15} />
      {t("console.projects.roster.assignCta", undefined, "Assign Person")}
    </Button>
  );

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.roster.title", undefined, "Project Roster")}
        subtitle={t(
          "console.projects.roster.subtitle",
          { count: letters.length, pending: pendingOnboarding, offers: offersOut },
          `${letters.length} On Roster · ${pendingOnboarding} Pending Onboarding · ${offersOut} Offers Out`,
        )}
        action={assignCta}
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/studio/projects" },
          { label: project.name, href: `/studio/projects/${projectId}` },
          { label: t("console.projects.roster.title", undefined, "Project Roster") },
        ]}
      />
      <div className="page-content space-y-4">
        <div className="flex items-center gap-2">
          <form action={base} className="relative flex-1">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--p-text-3)]"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("console.projects.roster.searchPlaceholder", undefined, "Search Person, Role…")}
              aria-label={t("console.projects.roster.searchLabel", undefined, "Search The Roster")}
              className="ps-input w-full pl-9"
            />
          </form>
          <Button
            href={`${base}/reporting`}
            variant="secondary"
            size="icon"
            aria-label={t("console.projects.roster.reportingLink", undefined, "Reporting Structure")}
          >
            <Network size={16} />
          </Button>
        </div>

        {letters.length === 0 ? (
          <EmptyState
            title={t("console.projects.roster.emptyTitle", undefined, "No One On This Roster Yet")}
            description={t(
              "console.projects.roster.emptyDescription",
              undefined,
              "Assign people from the org directory with a role and contract dates.",
            )}
            action={assignCta}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.projects.roster.noMatchesTitle", undefined, "No Matches")}
            description={t(
              "console.projects.roster.noMatchesDescription",
              undefined,
              "No one on the roster matches that search.",
            )}
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.projects.roster.colPerson", undefined, "Person")}</th>
                  <th>{t("console.projects.roster.colRole", undefined, "Role")}</th>
                  <th>{t("console.projects.roster.colDates", undefined, "Contract Dates")}</th>
                  <th>{t("console.projects.roster.colOnboarding", undefined, "Onboarding")}</th>
                  <th>{t("console.projects.roster.colAdvance", undefined, "Advance")}</th>
                  <th>{t("console.projects.roster.colReportsTo", undefined, "Reports To")}</th>
                  <th>{t("console.projects.roster.colStatus", undefined, "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const steps = stepsByLetter.get(l.id);
                  const advance = advanceByCrew.get(l.crew_member_id);
                  const start = l.onsite_start_date ?? l.effective_onsite_start;
                  const end = l.onsite_end_date ?? l.effective_onsite_end;
                  return (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/studio/people/offer-letters/${l.id}`} className="font-medium hover:underline">
                          {l.recipient_name}
                        </Link>
                      </td>
                      <td>{displayRoleTitle(l.role_slug, l.role_title, l.expectations_override)}</td>
                      <td className="whitespace-nowrap">
                        {start && end ? `${fmtDate(start)} · ${fmtDate(end)}` : start ? fmtDate(start) : "—"}
                      </td>
                      <td>
                        {steps && steps.total > 0 ? (
                          <Badge variant={steps.done >= steps.total ? "success" : "warning"}>
                            {t(
                              "console.projects.roster.docsBadge",
                              { done: steps.done, total: steps.total },
                              `${steps.done}/${steps.total} Docs`,
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="muted">
                            {t("console.projects.roster.docsNotStarted", undefined, "Not Started")}
                          </Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {advance && advance.count > 0
                          ? `${advance.count} ${
                              advance.count === 1
                                ? t("console.projects.roster.advanceItemOne", undefined, "Item")
                                : t("console.projects.roster.advanceItemOther", undefined, "Items")
                            }${advance.furthest >= 0 ? ` · ${fulfillmentLabel(FULFILLMENT_STATES[advance.furthest] ?? "")}` : ""}`
                          : "—"}
                      </td>
                      <td>{l.reports_to_name ?? "—"}</td>
                      <td>
                        <Badge variant={LETTER_STATE_VARIANT[l.status] ?? "muted"}>
                          {LETTER_STATE_LABEL[l.status] ?? l.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {drawer}
    </>
  );
}
