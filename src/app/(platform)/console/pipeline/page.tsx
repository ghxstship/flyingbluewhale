import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type PipelineRow = {
  id: string;
  name: string;
  slug: string;
};

type StageRow = {
  id: string;
  name: string;
  stage_key: string;
  display_order: number;
  is_won: boolean;
  is_terminal: boolean;
  pipeline_id: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  current_stage_id: string;
  pipeline_id: string;
  estimated_value_minor: number | null;
  estimated_value_currency: string | null;
  probability: number | null;
  expected_close: string | null;
  source: string | null;
  updated_at: string;
  account: { party: { display_name: string } | null } | null;
};

function stageTone(stage: StageRow): "muted" | "info" | "success" | "error" {
  if (stage.is_won) return "success";
  if (stage.is_terminal) return "error";
  return "info";
}

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ pipeline?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.pipeline.eyebrow", undefined, "Sales")}
          title={t("console.pipeline.title", undefined, "Pipeline")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.pipeline.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const { pipeline: pipelineSlug } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: pipelinesData } = await supabase
    .from("pipeline_definitions")
    .select("id, name, slug")
    .eq("org_id", session.orgId)
    .eq("active", true)
    .order("name");
  const pipelines = (pipelinesData ?? []) as PipelineRow[];

  if (pipelines.length === 0) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.pipeline.eyebrow", undefined, "Sales")}
          title={t("console.pipeline.title", undefined, "Pipeline")}
          subtitle={t("console.pipeline.subtitleDefault", undefined, "CRM deal pipeline grouped by stage")}
        />
        <div className="page-content">
          <EmptyState
            title={t("console.pipeline.empty.title", undefined, "No Pipelines")}
            description={t(
              "console.pipeline.empty.description",
              undefined,
              "Pipelines are the named funnels deals move through (e.g. New Business, Renewals). Seed one in `pipeline_definitions` with at least one row in `pipeline_stages` to start tracking opportunities.",
            )}
          />
        </div>
      </>
    );
  }

  const active = pipelines.find((p) => p.slug === pipelineSlug) ?? pipelines[0];

  const { data: stagesData } = await supabase
    .from("pipeline_stages")
    .select("id, name, stage_key, display_order, is_won, is_terminal, pipeline_id")
    .eq("pipeline_id", active.id)
    .order("display_order");
  const stages = (stagesData ?? []) as StageRow[];

  const { data: oppData } = await supabase
    .from("opportunities")
    .select(
      "id, title, current_stage_id, pipeline_id, estimated_value_minor, estimated_value_currency, probability, expected_close, source, updated_at, account:account_id(party:party_id(display_name))",
    )
    .eq("org_id", session.orgId)
    .eq("pipeline_id", active.id)
    .is("closed_at", null)
    .order("updated_at", { ascending: false });
  const opportunities = (oppData ?? []) as unknown as OpportunityRow[];

  const totalValue = opportunities.reduce((sum, o) => sum + (o.estimated_value_minor ?? 0), 0);
  const weightedValue = opportunities.reduce(
    (sum, o) => sum + ((o.estimated_value_minor ?? 0) * (o.probability ?? 0)) / 100,
    0,
  );
  const wonStageIds = new Set(stages.filter((s) => s.is_won).map((s) => s.id));
  const wonValue = opportunities
    .filter((o) => wonStageIds.has(o.current_stage_id))
    .reduce((sum, o) => sum + (o.estimated_value_minor ?? 0), 0);

  const byStage = new Map<string, OpportunityRow[]>();
  for (const stage of stages) byStage.set(stage.id, []);
  for (const opp of opportunities) {
    const lane = byStage.get(opp.current_stage_id);
    if (lane) lane.push(opp);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.pipeline.eyebrow", undefined, "Sales")}
        title={t("console.pipeline.title", undefined, "Pipeline")}
        subtitle={t(
          opportunities.length === 1 ? "console.pipeline.subtitle.one" : "console.pipeline.subtitle.other",
          { count: opportunities.length, pipeline: active.name },
          `${opportunities.length} Open  deal${opportunities.length === 1 ? "" : "s"} in ${active.name}`,
        )}
        action={
          pipelines.length > 1 ? (
            <div className="flex items-center gap-1">
              {pipelines.map((p) => (
                <Link
                  key={p.id}
                  href={`/console/pipeline?pipeline=${p.slug}`}
                  className={
                    "rounded px-2 py-1 text-xs " +
                    (p.id === active.id ? "bg-[var(--org-primary)] text-white" : "surface hover-lift")
                  }
                >
                  {p.name}
                </Link>
              ))}
            </div>
          ) : null
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.pipeline.metrics.openValue", undefined, "Open Value")}
            value={formatMoney(totalValue)}
          />
          <MetricCard
            label={t("console.pipeline.metrics.weighted", undefined, "Weighted")}
            value={formatMoney(weightedValue)}
            accent
          />
          <MetricCard
            label={t("console.pipeline.metrics.wonOpen", undefined, "Won — Open")}
            value={formatMoney(wonValue)}
          />
        </div>

        {stages.length === 0 ? (
          <EmptyState
            title={t("console.pipeline.noStages.title", undefined, "No Stages")}
            description={t(
              "console.pipeline.noStages.description",
              { pipeline: active.name },
              `Pipeline "${active.name}" has no stages. Add rows to \`pipeline_stages\` with this pipeline_id to start placing deals.`,
            )}
          />
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => {
              const lane = byStage.get(stage.id) ?? [];
              const laneValue = lane.reduce((sum, o) => sum + (o.estimated_value_minor ?? 0), 0);
              return (
                <section key={stage.id} className="surface p-4">
                  <header className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={stageTone(stage)}>{stage.name}</Badge>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {t(
                          lane.length === 1 ? "console.pipeline.lane.deals.one" : "console.pipeline.lane.deals.other",
                          { count: lane.length },
                          `${lane.length} deal${lane.length === 1 ? "" : "s"}`,
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-xs">{formatMoney(laneValue)}</span>
                  </header>
                  {lane.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                      {t("console.pipeline.lane.empty", undefined, "No deals in this stage.")}
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-[var(--border-color)]">
                      {lane.map((o) => (
                        <li key={o.id}>
                          <Link
                            href={`/console/pipeline/${o.id}`}
                            className="hover-lift -mx-2 flex items-start justify-between gap-3 rounded px-2 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{o.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[var(--text-muted)]">
                                {o.account?.party?.display_name && <span>{o.account.party.display_name}</span>}
                                {o.expected_close && (
                                  <span>
                                    {t(
                                      "console.pipeline.opp.close",
                                      { date: o.expected_close },
                                      `· close ${o.expected_close}`,
                                    )}
                                  </span>
                                )}
                                {o.source && <span>· {o.source}</span>}
                                <span>
                                  {t(
                                    "console.pipeline.opp.updated",
                                    { time: timeAgo(o.updated_at) },
                                    `· updated ${timeAgo(o.updated_at)}`,
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm">
                                {formatMoney(o.estimated_value_minor, o.estimated_value_currency ?? undefined)}
                              </div>
                              {o.probability != null && (
                                <div className="font-mono text-[10px] text-[var(--text-muted)]">{o.probability}%</div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
