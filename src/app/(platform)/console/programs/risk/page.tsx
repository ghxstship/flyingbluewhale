import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { RiskHeatmap, type RiskCell } from "./RiskHeatmap";
import type { Risk, RiskLikelihood, RiskImpact } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const LIKELIHOOD: RiskLikelihood[] = ["rare", "unlikely", "possible", "likely", "almost_certain"];
const IMPACT: RiskImpact[] = ["insignificant", "minor", "moderate", "major", "severe"];

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.programs.risk.eyebrow", undefined, "Programs")}
          title={t("console.programs.risk.title", undefined, "Risk Register")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.risk.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("risks", session.orgId, {
    orderBy: "inherent_score",
    ascending: false,
    limit: 500,
  })) as Risk[];

  // Build a 5×5 cell grid: rows = impact (severe at top), cols = likelihood.
  const cells: RiskCell[] = [];
  for (let i = IMPACT.length - 1; i >= 0; i--) {
    for (let l = 0; l < LIKELIHOOD.length; l++) {
      const impact = IMPACT[i]!;
      const likelihood = LIKELIHOOD[l]!;
      const matched = rows.filter((r) => r.impact === impact && r.likelihood === likelihood);
      cells.push({
        impact,
        likelihood,
        impactIndex: i,
        likelihoodIndex: l,
        risks: matched.map((r) => ({
          id: r.id,
          title: r.title,
          score: r.inherent_score,
          status: r.risk_state,
        })),
      });
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.risk.eyebrow", undefined, "Programs")}
        title={t("console.programs.risk.title", undefined, "Risk Register")}
        subtitle={
          rows.length === 1
            ? t("console.programs.risk.subtitle.one", { count: rows.length }, `${rows.length} Record`)
            : t("console.programs.risk.subtitle.other", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/console/programs/risk/new" size="sm">
            {t("console.programs.risk.newRisk", undefined, "+ New Risk")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <RiskHeatmap cells={cells} likelihood={LIKELIHOOD} impact={IMPACT} />

        <DataTable
          rows={rows as Array<Risk & { id: string }>}
          rowHref={(r) => `/console/programs/risk/${r.id}`}
          columns={[
            {
              key: "title",
              header: t("console.programs.risk.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "kind",
              header: t("console.programs.risk.columns.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "matrix",
              header: t("console.programs.risk.columns.matrix", undefined, "L × I"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.likelihood} × {r.impact}
                </span>
              ),
              accessor: (r) => Number(r.likelihood ?? 0) * Number(r.impact ?? 0),
            },
            {
              key: "inherent_score",
              header: t("console.programs.risk.columns.score", undefined, "Score"),
              render: (r) => (
                <span
                  className={`font-mono text-xs ${
                    r.inherent_score >= 20
                      ? "text-[var(--p-danger)]"
                      : r.inherent_score >= 12
                        ? "text-[var(--p-warning)]"
                        : "text-[var(--p-text-2)]"
                  }`}
                >
                  {r.inherent_score}
                </span>
              ),
              accessor: (r) => r.inherent_score ?? null,
            },
            {
              key: "risk_state",
              header: t("console.programs.risk.columns.risk_state", undefined, "Status"),
              render: (r) => <Badge variant="muted">{toTitle(r.risk_state)}</Badge>,
              accessor: (r) => r.risk_state ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "due_on",
              header: t("console.programs.risk.columns.due", undefined, "Due"),
              render: (r) => <span className="font-mono text-xs">{r.due_on ?? "—"}</span>,
              accessor: (r) => r.due_on ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
