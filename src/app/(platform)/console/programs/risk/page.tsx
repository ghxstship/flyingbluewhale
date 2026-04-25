import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { RiskHeatmap, type RiskCell } from "./RiskHeatmap";
import type { Risk, RiskLikelihood, RiskImpact } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const LIKELIHOOD: RiskLikelihood[] = ["rare", "unlikely", "possible", "likely", "almost_certain"];
const IMPACT: RiskImpact[] = ["insignificant", "minor", "moderate", "major", "severe"];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Risk register" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      const impact = IMPACT[i];
      const likelihood = LIKELIHOOD[l];
      const matched = rows.filter(
        (r) => r.impact === impact && r.likelihood === likelihood,
      );
      cells.push({
        impact,
        likelihood,
        impactIndex: i,
        likelihoodIndex: l,
        risks: matched.map((r) => ({
          id: r.id,
          title: r.title,
          score: r.inherent_score,
          status: r.status,
        })),
      });
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Risk register"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/programs/risk/new" size="sm">+ New risk</Button>}
      />
      <div className="page-content space-y-5">
        <RiskHeatmap cells={cells} likelihood={LIKELIHOOD} impact={IMPACT} />

        <DataTable
          rows={rows as Array<Risk & { id: string }>}
          rowHref={(r) => `/console/programs/risk/${r.id}`}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "kind", header: "Kind", render: (r) => <Badge variant="muted">{r.kind}</Badge> },
            {
              key: "matrix",
              header: "L × I",
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.likelihood} × {r.impact}
                </span>
              ),
            },
            {
              key: "inherent_score",
              header: "Score",
              render: (r) => (
                <span
                  className={`font-mono text-xs ${
                    r.inherent_score >= 20
                      ? "text-[var(--color-error)]"
                      : r.inherent_score >= 12
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--text-secondary)]"
                  }`}
                >
                  {r.inherent_score}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant="muted">{r.status}</Badge>,
            },
            {
              key: "due_on",
              header: "Due",
              render: (r) => <span className="font-mono text-xs">{r.due_on ?? "—"}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
