import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { PipelineKanban, type PipelineCard, type PipelineLane } from "./PipelineKanban";

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

function stageTone(stage: StageRow): PipelineLane["tone"] {
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

  // The empty-pipelines case already returned above.
  const active = pipelines.find((p) => p.slug === pipelineSlug) ?? pipelines[0]!;

  const { data: stagesData } = await supabase
    .from("pipeline_stages")
    .select("id, name, stage_key, display_order, is_won, is_terminal, pipeline_id")
    .eq("pipeline_id", active.id)
    .order("display_order");
  const stages = (stagesData ?? []) as StageRow[];

  // Deal lens over the merged CRM store (kind facet — ADR-0014 Phase A
  // amendment). Leads/RFPs have no pipeline stage until converted.
  const { data: oppData } = await supabase
    .from("opportunities")
    .select(
      "id, title, current_stage_id, pipeline_id, estimated_value_minor, estimated_value_currency, probability, expected_close, source, updated_at, account:account_id(party:party_id(display_name))",
    )
    .eq("org_id", session.orgId)
    .eq("kind", "deal")
    .eq("pipeline_id", active.id)
    .is("closed_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);
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

  // Display-ready cards for the client kanban island (audit A-23) — money,
  // relative time, and account names are formatted server-side so the
  // client never re-derives locale or currency.
  const stageIds = new Set(stages.map((s) => s.id));
  const lanes: PipelineLane[] = stages.map((s) => ({ id: s.id, title: s.name, tone: stageTone(s) }));
  const cards: PipelineCard[] = opportunities
    .filter((o) => stageIds.has(o.current_stage_id))
    .map((o) => ({
      id: o.id,
      title: o.title,
      stageId: o.current_stage_id,
      valueText: formatMoney(o.estimated_value_minor, o.estimated_value_currency ?? undefined),
      probability: o.probability,
      account: o.account?.party?.display_name ?? null,
      closeDate: o.expected_close,
      updatedText: t("console.pipeline.opp.updated", { time: timeAgo(o.updated_at) }, `· updated ${timeAgo(o.updated_at)}`),
    }));

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
                  href={`/studio/pipeline?pipeline=${p.slug}`}
                  className={
                    "rounded px-2 py-1 text-xs " +
                    (p.id === active.id ? "bg-[var(--p-accent)] text-white" : "surface hover-lift")
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
            label={t("console.pipeline.metrics.wonOpen", undefined, "Won (Open)")}
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
          <PipelineKanban cards={cards} lanes={lanes} />
        )}
      </div>
    </>
  );
}
