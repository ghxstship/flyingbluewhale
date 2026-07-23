import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import type { FulfillmentState } from "@/lib/db/assignments";

export const dynamic = "force-dynamic";

type DeliverableRow = {
  id: string;
  title: string;
  type: string;
  fulfillment_state: FulfillmentState;
  deadline: string | null;
  project: { id: string; name: string | null } | null;
  reviewTally?: { approved: number; total: number; changes: boolean };
};

type AssignmentRow = {
  id: string;
  catalog_kind: string;
  fulfillment_state: FulfillmentState;
  created_at: string;
  project: { id: string; name: string | null } | null;
  catalog_item: { name: string | null } | null;
};

const OPEN_STATES: FulfillmentState[] = ["briefed", "draft", "submitted", "in_review", "revision_requested"];

/**
 * Advancing hub (kit 20 Procurement · Source rail) — the org-wide window
 * into the unified advancing domain: document deliverables (riders, plots,
 * lists) and per-party catalog assignments (gear, travel, credentials).
 * Per-project authoring stays at /studio/projects/[id]/advancing; the
 * One Front Door "Gear & Advance" intake resolves via /studio/advancing/request.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.advancing.eyebrow", undefined, "Procurement · Source")}
          title={t("console.advancing.title", undefined, "Advancing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.advancing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: deliverables }, { data: assignments }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, title, type, fulfillment_state, deadline, project:project_id(id, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .from("assignments")
      .select(
        "id, catalog_kind, fulfillment_state, created_at, project:project_id(id, name), catalog_item:catalog_item_id(name)",
      )
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const docRows = (deliverables ?? []) as unknown as DeliverableRow[];
  const asgRows = (assignments ?? []) as unknown as AssignmentRow[];

  // Reviewer tally (kit 21 W2, Frame.io) — one batched query folds every
  // deliverable's reviewers to an approved/total count + a changes flag.
  if (docRows.length > 0) {
    const { data: revs } = await supabase
      .from("deliverable_reviewers")
      .select("deliverable_id, review_state")
      .eq("org_id", session.orgId)
      .in(
        "deliverable_id",
        docRows.map((d) => d.id),
      );
    const tally = new Map<string, { approved: number; total: number; changes: boolean }>();
    for (const r of (revs ?? []) as Array<{ deliverable_id: string; review_state: string }>) {
      const cur = tally.get(r.deliverable_id) ?? { approved: 0, total: 0, changes: false };
      cur.total += 1;
      if (r.review_state === "approved") cur.approved += 1;
      if (r.review_state === "changes_requested") cur.changes = true;
      tally.set(r.deliverable_id, cur);
    }
    for (const d of docRows) d.reviewTally = tally.get(d.id);
  }
  const openDocs = docRows.filter((d) => OPEN_STATES.includes(d.fulfillment_state)).length;
  const openAsg = asgRows.filter((a) => OPEN_STATES.includes(a.fulfillment_state)).length;
  const fulfilled = asgRows.filter((a) => ["delivered", "issued", "redeemed"].includes(a.fulfillment_state)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.advancing.eyebrow", undefined, "Procurement · Source")}
        title={t("console.advancing.title", undefined, "Advancing")}
        subtitle={t(
          "console.advancing.subtitle",
          undefined,
          "Catalog fulfillment per party plus the document deliverables that advance every show.",
        )}
        action={
          <Button href="/studio/advancing/request" size="sm">
            {t("console.advancing.newRequest", undefined, "+ Gear & Advance Request")}
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard
            label={t("console.advancing.metric.openDocs", undefined, "Open Deliverables")}
            value={fmt.number(openDocs)}
            accent
          />
          <MetricCard
            label={t("console.advancing.metric.openAsg", undefined, "Open Assignments")}
            value={fmt.number(openAsg)}
          />
          <MetricCard
            label={t("console.advancing.metric.fulfilled", undefined, "Fulfilled")}
            value={fmt.number(fulfilled)}
          />
          <MetricCard
            label={t("console.advancing.metric.total", undefined, "Total In Flight")}
            value={fmt.number(docRows.length + asgRows.length)}
          />
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            {t("console.advancing.deliverables", undefined, "Document Deliverables")}
          </h2>
          <DataView<DeliverableRow>
            rows={docRows}
            rowHref={(r) => `/studio/advancing/deliverables/${r.id}`}
            emptyLabel={t("console.advancing.docs.emptyLabel", undefined, "No deliverables yet")}
            emptyDescription={t(
              "console.advancing.docs.emptyDescription",
              undefined,
              "Riders, plots, lists, plans, and grids advance per project. Open a project to author its advance.",
            )}
            emptyAction={
              <Button href="/studio/projects" size="sm">
                {t("console.advancing.openProjects", undefined, "Open Projects")}
              </Button>
            }
            columns={[
              {
                key: "title",
                header: t("console.advancing.column.title", undefined, "Deliverable"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "type",
                header: t("console.advancing.column.type", undefined, "Type"),
                render: (r) => toTitle(r.type),
                accessor: (r) => r.type,
                filterable: true,
                groupable: true,
              },
              {
                key: "project",
                header: t("console.advancing.column.project", undefined, "Project"),
                render: (r) => r.project?.name ?? "—",
                accessor: (r) => r.project?.name ?? null,
                filterable: true,
              },
              {
                key: "state",
                header: t("console.advancing.column.state", undefined, "Status"),
                render: (r) => <StatusBadge status={r.fulfillment_state} />,
                accessor: (r) => r.fulfillment_state,
                filterable: true,
                groupable: true,
              },
              {
                key: "reviewers",
                header: t("console.advancing.column.reviewers", undefined, "Reviewers"),
                render: (r) =>
                  r.reviewTally ? (
                    <Badge variant={r.reviewTally.changes ? "warning" : r.reviewTally.approved === r.reviewTally.total ? "success" : "muted"}>
                      {r.reviewTally.changes
                        ? t("console.advancing.column.changesRequested", undefined, "Changes Requested")
                        : t(
                            "console.advancing.column.approvedTally",
                            { approved: r.reviewTally.approved, total: r.reviewTally.total },
                            `${r.reviewTally.approved} Of ${r.reviewTally.total} Approved`,
                          )}
                    </Badge>
                  ) : (
                    <span className="text-[var(--p-text-3)]">—</span>
                  ),
                accessor: (r) => (r.reviewTally ? r.reviewTally.approved : -1),
              },
              {
                key: "deadline",
                header: t("console.advancing.column.deadline", undefined, "Deadline"),
                render: (r) => (r.deadline ? fmt.dateParts(r.deadline, { month: "short", day: "numeric" }) : "—"),
                mono: true,
                accessor: (r) => r.deadline,
              },
            ]}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {t("console.advancing.assignments", undefined, "Catalog Assignments")}
            </h2>
            <Link
              href="/studio/people/credentials/asset-linker"
              className="text-xs font-medium text-[var(--p-accent)] hover:underline"
            >
              {t("console.advancing.scanCodes", undefined, "Bind Scan Codes")}
            </Link>
          </div>
          <DataView<AssignmentRow>
            rows={asgRows}
            rowHref={(r) =>
              r.project ? `/studio/projects/${r.project.id}/advancing/assignments/${r.id}` : "/studio/projects"
            }
            emptyLabel={t("console.advancing.asg.emptyLabel", undefined, "No assignments yet")}
            emptyDescription={t(
              "console.advancing.asg.emptyDescription",
              undefined,
              "Everything assignable from the master catalog to a party lands here: tickets, credentials, radios, travel, lodging.",
            )}
            emptyAction={
              <Button href="/studio/advancing/request" size="sm">
                {t("console.advancing.newRequest", undefined, "+ Gear & Advance Request")}
              </Button>
            }
            columns={[
              {
                key: "item",
                header: t("console.advancing.column.item", undefined, "Catalog Item"),
                render: (r) => r.catalog_item?.name ?? "—",
                accessor: (r) => r.catalog_item?.name ?? null,
              },
              {
                key: "kind",
                header: t("console.advancing.column.kind", undefined, "Kind"),
                render: (r) => toTitle(r.catalog_kind),
                accessor: (r) => r.catalog_kind,
                filterable: true,
                groupable: true,
              },
              {
                key: "project",
                header: t("console.advancing.column.project", undefined, "Project"),
                render: (r) => r.project?.name ?? "—",
                accessor: (r) => r.project?.name ?? null,
                filterable: true,
              },
              {
                key: "state",
                header: t("console.advancing.column.state", undefined, "Status"),
                render: (r) => <StatusBadge status={r.fulfillment_state} />,
                accessor: (r) => r.fulfillment_state,
                filterable: true,
                groupable: true,
              },
              {
                key: "created",
                header: t("console.advancing.column.created", undefined, "Created"),
                render: (r) => fmt.dateParts(r.created_at, { month: "short", day: "numeric" }),
                mono: true,
                accessor: (r) => r.created_at,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
