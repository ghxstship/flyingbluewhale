import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ItbPhase = "planning" | "inviting" | "bidding" | "leveling" | "awarded" | "cancelled";

type Row = {
  id: string;
  code: string | null;
  title: string | null;
  itb_phase: ItbPhase;
  itb_bid_due_at: string | null;
  itb_minimum_bidders: number | null;
  created_at: string;
  project: { name: string | null } | null;
  package_count: number;
  invitation_count: number;
  bid_count: number;
};

const STATE_TONE: Record<ItbPhase, "muted" | "info" | "warning" | "success" | "error"> = {
  planning: "muted",
  inviting: "info",
  bidding: "info",
  leveling: "warning",
  awarded: "success",
  cancelled: "muted",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.itb.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.itb.title", undefined, "Invitations to Bid")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.itb.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // RFQs with itb_phase set are formal ITBs; others are regular RFQs.
  const { data: itbs } = await supabase
    .from("rfqs")
    .select("id, code, title, itb_phase, itb_bid_due_at, itb_minimum_bidders, created_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .not("itb_phase", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const headers = (itbs ?? []) as unknown as Omit<Row, "package_count" | "invitation_count" | "bid_count">[];
  const ids = headers.map((h) => h.id);

  const packageCounts: Record<string, number> = {};
  const inviteCounts: Record<string, number> = {};
  const bidCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const [{ data: pkgs }, { data: invites }] = await Promise.all([
      supabase.from("itb_packages").select("rfq_id").in("rfq_id", ids),
      // Roll up invitations via their parent packages.
      supabase
        .from("itb_packages")
        .select("id, rfq_id, invitations:itb_invitations!itb_package_id(id, invite_state)")
        .in("rfq_id", ids),
    ]);
    for (const p of (pkgs ?? []) as { rfq_id: string }[]) {
      packageCounts[p.rfq_id] = (packageCounts[p.rfq_id] ?? 0) + 1;
    }
    type PkgRow = { id: string; rfq_id: string; invitations: { id: string; invite_state: string }[] | null };
    for (const p of (invites ?? []) as PkgRow[]) {
      const invs = p.invitations ?? [];
      inviteCounts[p.rfq_id] = (inviteCounts[p.rfq_id] ?? 0) + invs.length;
      bidCounts[p.rfq_id] = (bidCounts[p.rfq_id] ?? 0) + invs.filter((i) => i.invite_state === "bid_submitted").length;
    }
  }

  const rows: Row[] = headers.map((h) => ({
    ...h,
    package_count: packageCounts[h.id] ?? 0,
    invitation_count: inviteCounts[h.id] ?? 0,
    bid_count: bidCounts[h.id] ?? 0,
  }));

  const inFlightCount = rows.filter((r) =>
    ["planning", "inviting", "bidding", "leveling"].includes(r.itb_phase),
  ).length;
  const awardedCount = rows.filter((r) => r.itb_phase === "awarded").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.itb.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.itb.title", undefined, "Invitations to Bid")}
        subtitle={t(
          "console.procurement.itb.subtitle",
          {
            count: rows.length,
            itbLabel: rows.length === 1 ? "ITB" : "ITBs",
            inFlight: inFlightCount,
            awarded: awardedCount,
          },
          `${rows.length} ITB${rows.length === 1 ? "" : "s"} · ${inFlightCount} in flight · ${awardedCount} awarded`,
        )}
        action={
          <Button href="/studio/procurement/rfqs/new" size="sm">
            {t("console.procurement.itb.newItb", undefined, "+ New ITB")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.itb.metric.total", undefined, "Total")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.procurement.itb.metric.inFlight", undefined, "In Flight")}
            value={fmt.number(inFlightCount)}
          />
          <MetricCard
            label={t("console.procurement.itb.metric.awarded", undefined, "Awarded")}
            value={fmt.number(awardedCount)}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/procurement/rfqs/${r.id}`}
          emptyLabel={t("console.procurement.itb.empty.label", undefined, "No ITBs yet")}
          emptyDescription={t(
            "console.procurement.itb.empty.description",
            undefined,
            "Formal Invitations to Bid bundle trade packages (sheets + specs + scope) and dispatch to prequalified subs. Set the itb_phase on any RFQ to promote it.",
          )}
          columns={[
            {
              key: "code",
              header: t("console.procurement.itb.column.code", undefined, "Code"),
              render: (r) => r.code ?? "—",
              accessor: (r) => r.code,
              mono: true,
            },
            {
              key: "title",
              header: t("console.procurement.itb.column.title", undefined, "Title"),
              render: (r) => r.title ?? "—",
              accessor: (r) => r.title ?? null,
            },
            {
              key: "project",
              header: t("console.procurement.itb.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "phase",
              header: t("console.procurement.itb.column.phase", undefined, "Phase"),
              render: (r) => <Badge variant={STATE_TONE[r.itb_phase]}>{toTitle(r.itb_phase)}</Badge>,
              accessor: (r) => r.itb_phase,
              filterable: true,
              groupable: true,
            },
            {
              key: "packages",
              header: t("console.procurement.itb.column.packages", undefined, "Pkgs"),
              render: (r) => fmt.number(r.package_count),
              accessor: (r) => r.package_count,
              numeric: true,
            },
            {
              key: "invites",
              header: t("console.procurement.itb.column.invites", undefined, "Invites"),
              render: (r) => `${r.bid_count} / ${r.invitation_count}`,
              accessor: (r) => r.invitation_count,
              numeric: true,
            },
            {
              key: "due",
              header: t("console.procurement.itb.column.bidDue", undefined, "Bid Due"),
              render: (r) =>
                r.itb_bid_due_at
                  ? fmt.dateParts(r.itb_bid_due_at, { month: "short", day: "numeric", year: "2-digit" })
                  : "—",
              accessor: (r) => r.itb_bid_due_at,
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
