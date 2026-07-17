import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CapabilityDenied } from "@/components/CapabilityDenied";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { formatDateRange } from "@/lib/offer-letters/format";
import {
  CATALOG_KIND_LABEL_SINGULAR,
  deriveMealSummary,
  type CatalogKind,
  type FulfillmentState,
} from "@/lib/db/assignments";
import { approveAllAction, approveLineAction, markFulfilledAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /studio/projects/[projectId]/advancing/fulfillment — Kit 30 Fulfillment
 * Queue. Advance lines in flight, on the 3-chip mini-track that MAPS onto
 * fulfillment_state (submitted/in_review = Requested · approved = Approved ·
 * delivered/issued = Fulfilled — no parallel state machine). Approve All and
 * the per-line verbs all delegate to the existing FSM-enforcing transition
 * actions; Mark Fulfilled records manual provenance
 * (fulfilled_at / fulfilled_by / fulfilled_via='manual').
 */

const QUEUE_STATES = ["submitted", "in_review", "approved", "delivered", "issued"] as const;
const REQUESTED: readonly FulfillmentState[] = ["submitted", "in_review"];
const FULFILLED: readonly FulfillmentState[] = ["delivered", "issued"];

type QueueRow = {
  id: string;
  catalog_kind: CatalogKind;
  title: string | null;
  party_kind: "user" | "crew_member" | "external_holder";
  party_user_id: string | null;
  party_crew_id: string | null;
  party_external_id: string | null;
  fulfillment_state: FulfillmentState;
  data: { starts_on?: string | null; ends_on?: string | null } | null;
  notes: string | null;
  deadline: string | null;
  fulfilled_at: string | null;
};

function trackStage(state: FulfillmentState): 0 | 1 | 2 {
  if (FULFILLED.includes(state)) return 2;
  if (state === "approved") return 1;
  return 0;
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const { projectId } = await params;
  const session = await requireSession();

  if (!can(session, "advance:approve")) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.projects.advancing.fulfillment.eyebrow", undefined, "Advancing")}
          title={t("console.projects.advancing.fulfillment.title", undefined, "Fulfillment Queue")}
        />
        <CapabilityDenied
          capability="advance:approve"
          title={t("console.projects.advancing.fulfillment.deniedTitle", undefined, "No Access")}
          description={t(
            "console.projects.advancing.fulfillment.deniedDescription",
            undefined,
            "Approving and fulfilling advance lines requires the capability below. Role grants are managed in Settings · Capabilities.",
          )}
        />
      </>
    );
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, catalog_kind, title, party_kind, party_user_id, party_crew_id, party_external_id, fulfillment_state, data, notes, deadline, fulfilled_at",
    )
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .in("fulfillment_state", [...QUEUE_STATES])
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as unknown as QueueRow[];

  // Party names — same three-way hydration as the assignments list.
  const userIds = [...new Set(rows.filter((r) => r.party_user_id).map((r) => r.party_user_id!))];
  const crewIds = [...new Set(rows.filter((r) => r.party_crew_id).map((r) => r.party_crew_id!))];
  const extIds = [...new Set(rows.filter((r) => r.party_external_id).map((r) => r.party_external_id!))];
  const cateringIds = rows.filter((r) => r.catalog_kind === "catering").map((r) => r.id);
  const [userRes, crewRes, extRes, cateringRes] = await Promise.all([
    // soft-delete-exempt: display-name resolution — an in-flight line may reference an archived user.
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
    crewIds.length ? supabase.from("crew_members").select("id, name").in("id", crewIds) : Promise.resolve({ data: [] }),
    extIds.length
      ? supabase.from("assignment_external_holders").select("id, holder_name, holder_email").in("id", extIds)
      : Promise.resolve({ data: [] }),
    cateringIds.length
      ? supabase
          .from("catering_assignment_details")
          .select("assignment_id, meal_periods, starts_on, ends_on, every_contract_day, excluded_dates")
          .in("assignment_id", cateringIds)
      : Promise.resolve({ data: [] }),
  ]);
  const userMap = new Map(
    ((userRes.data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [u.id, u.name ?? u.email]),
  );
  const crewMap = new Map(((crewRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]));
  const extMap = new Map(
    ((extRes.data ?? []) as Array<{ id: string; holder_name: string | null; holder_email: string | null }>).map((e) => [
      e.id,
      e.holder_name ?? e.holder_email ?? t("console.projects.advancing.fulfillment.guest", undefined, "Guest"),
    ]),
  );
  const cateringMap = new Map(
    (
      (cateringRes.data ?? []) as Array<{
        assignment_id: string;
        meal_periods: string[];
        starts_on: string | null;
        ends_on: string | null;
        every_contract_day: boolean;
        excluded_dates: string[];
      }>
    ).map((c) => [c.assignment_id, c]),
  );

  function partyLabel(r: QueueRow): string {
    if (r.party_kind === "user" && r.party_user_id)
      return userMap.get(r.party_user_id) ?? t("console.projects.advancing.fulfillment.unknownUser", undefined, "Unknown User");
    if (r.party_kind === "crew_member" && r.party_crew_id)
      return crewMap.get(r.party_crew_id) ?? t("console.projects.advancing.fulfillment.unknownCrew", undefined, "Unknown Crew");
    if (r.party_kind === "external_holder" && r.party_external_id)
      return extMap.get(r.party_external_id) ?? t("console.projects.advancing.fulfillment.guest", undefined, "Guest");
    return t("console.projects.advancing.fulfillment.unassigned", undefined, "Unassigned");
  }

  function lineLabel(r: QueueRow): string {
    const kind = CATALOG_KIND_LABEL_SINGULAR[r.catalog_kind] ?? r.catalog_kind;
    return r.title ? `${kind} · ${r.title}` : kind;
  }

  function datesLabel(r: QueueRow): string {
    const catering = cateringMap.get(r.id);
    const start = catering?.starts_on ?? r.data?.starts_on ?? null;
    const end = catering?.ends_on ?? r.data?.ends_on ?? r.deadline;
    return formatDateRange(start, end ?? null);
  }

  function detailLabel(r: QueueRow): string {
    const catering = cateringMap.get(r.id);
    if (catering) return deriveMealSummary(catering).label;
    return r.notes ?? t("console.projects.advancing.fulfillment.qtyOne", undefined, "Qty 1");
  }

  const requestable = rows.filter((r) => REQUESTED.includes(r.fulfillment_state)).length;

  const TRACK_LABELS = [
    t("console.projects.advancing.fulfillment.track.requested", undefined, "Requested"),
    t("console.projects.advancing.fulfillment.track.approved", undefined, "Approved"),
    t("console.projects.advancing.fulfillment.track.fulfilled", undefined, "Fulfilled"),
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={(project as { name: string }).name}
        title={t("console.projects.advancing.fulfillment.title", undefined, "Fulfillment Queue")}
        subtitle={t(
          "console.projects.advancing.fulfillment.subtitle",
          { count: rows.length },
          `${rows.length} ${rows.length === 1 ? "Line" : "Lines"} In Flight · Requested → Approved → Fulfilled`,
        )}
        action={
          requestable > 0 ? (
            <form action={approveAllAction.bind(null, projectId)}>
              <Button type="submit" size="sm">
                {t(
                  "console.projects.advancing.fulfillment.approveAll",
                  { count: requestable },
                  `Approve All · ${requestable}`,
                )}
              </Button>
            </form>
          ) : (
            <Button href={`/studio/projects/${projectId}/advancing/cart`} variant="secondary" size="sm">
              {t("console.projects.advancing.fulfillment.openCart", undefined, "Open Advance Cart")}
            </Button>
          )
        }
      />
      <div className="page-content space-y-5">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.projects.advancing.fulfillment.emptyTitle", undefined, "Nothing To Fulfill")}
            description={t(
              "console.projects.advancing.fulfillment.emptyDescription",
              undefined,
              "Submitted advance lines land here for approval and fulfillment.",
            )}
            action={
              <Button href={`/studio/projects/${projectId}/advancing/cart`} size="sm">
                {t("console.projects.advancing.fulfillment.emptyCta", undefined, "Open Advance Cart")}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.projects.advancing.fulfillment.colLine", undefined, "Line")}</th>
                  <th>{t("console.projects.advancing.fulfillment.colPerson", undefined, "Person")}</th>
                  <th>{t("console.projects.advancing.fulfillment.colDates", undefined, "Dates")}</th>
                  <th>{t("console.projects.advancing.fulfillment.colDetail", undefined, "Detail")}</th>
                  <th>{t("console.projects.advancing.fulfillment.colTrack", undefined, "Status Track")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const stage = trackStage(r.fulfillment_state);
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">{lineLabel(r)}</td>
                      <td>{partyLabel(r)}</td>
                      <td className="whitespace-nowrap">{datesLabel(r)}</td>
                      <td className="text-[var(--p-text-2)]">{detailLabel(r)}</td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          {TRACK_LABELS.map((label, i) => (
                            <Badge key={label} variant={i < stage ? "success" : i === stage ? (stage === 2 ? "success" : "brand") : "muted"}>
                              {label}
                            </Badge>
                          ))}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-end">
                        {REQUESTED.includes(r.fulfillment_state) && (
                          <form action={approveLineAction.bind(null, projectId, r.id)} className="inline">
                            <Button type="submit" variant="secondary" size="sm">
                              {t("console.projects.advancing.fulfillment.approve", undefined, "Approve")}
                            </Button>
                          </form>
                        )}
                        {r.fulfillment_state === "approved" && (
                          <form action={markFulfilledAction.bind(null, projectId, r.id)} className="inline">
                            <Button type="submit" size="sm">
                              {t("console.projects.advancing.fulfillment.markFulfilled", undefined, "Mark Fulfilled")}
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.projects.advancing.fulfillment.note",
            undefined,
            "The mini-track rides fulfillment_state: submitted and in review read as Requested, approved as Approved, delivered and issued as Fulfilled. A POS scan can also flip a line to Fulfilled.",
          )}
        </p>
      </div>
    </>
  );
}
