import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type OpportunityRow = {
  id: string;
  title: string;
  source: string | null;
  probability: number | null;
  estimated_value_minor: number | null;
  estimated_value_currency: string | null;
  expected_close: string | null;
  closed_at: string | null;
  close_outcome: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  pipeline: { id: string; name: string; slug: string } | null;
  stage: {
    id: string;
    name: string;
    stage_key: string;
    is_won: boolean;
    is_terminal: boolean;
  } | null;
  account: {
    id: string;
    account_kind: string;
    party: { display_name: string } | null;
  } | null;
  party: { display_name: string; primary_email: string | null } | null;
};

type ActivityRow = {
  id: string;
  activity_kind: string;
  notes: string | null;
  outcome: string | null;
  occurred_at: string;
};

function stageTone(stage: NonNullable<OpportunityRow["stage"]>): "muted" | "info" | "success" | "error" {
  if (stage.is_won) return "success";
  if (stage.is_terminal) return "error";
  return "info";
}

export default async function DealDetail({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("opportunities")
    .select(
      "id, title, source, probability, estimated_value_minor, estimated_value_currency, expected_close, closed_at, close_outcome, metadata, created_at, updated_at, " +
        "pipeline:pipeline_id(id, name, slug), " +
        "stage:current_stage_id(id, name, stage_key, is_won, is_terminal), " +
        "account:account_id(id, account_kind, party:party_id(display_name)), " +
        "party:party_id(display_name, primary_email)",
    )
    .eq("id", dealId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const deal = data as unknown as OpportunityRow | null;
  if (!deal) notFound();

  const { data: actData } = await supabase
    .from("opportunity_activities")
    .select("id, activity_kind, notes, outcome, occurred_at")
    .eq("opportunity_id", dealId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const activities = (actData ?? []) as ActivityRow[];

  const accountName = deal.account?.party?.display_name ?? deal.party?.display_name ?? null;
  const pipelineHref = deal.pipeline ? `/console/pipeline?pipeline=${deal.pipeline.slug}` : "/console/pipeline";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.pipeline.deal.eyebrow", undefined, "Pipeline")}
        title={deal.title}
        subtitle={
          <span className="font-mono text-xs">
            {deal.pipeline?.name ?? "—"}
            {accountName ? ` · ${accountName}` : ""}
          </span>
        }
        breadcrumbs={[
          { label: t("console.pipeline.deal.breadcrumbs.sales", undefined, "Sales"), href: "/console/leads" },
          { label: t("console.pipeline.deal.breadcrumbs.pipeline", undefined, "Pipeline"), href: pipelineHref },
          { label: deal.title },
        ]}
        action={deal.stage ? <Badge variant={stageTone(deal.stage)}>{deal.stage.name}</Badge> : null}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.pipeline.deal.metrics.value", undefined, "Value")}>
            {formatMoney(deal.estimated_value_minor, deal.estimated_value_currency ?? undefined)}
          </Field>
          <Field label={t("console.pipeline.deal.metrics.probability", undefined, "Probability")}>
            {deal.probability != null ? `${deal.probability}%` : "—"}
          </Field>
          <Field label={t("console.pipeline.deal.metrics.expectedClose", undefined, "Expected Close")}>
            {deal.expected_close ?? "—"}
          </Field>
          <Field label={t("console.pipeline.deal.metrics.source", undefined, "Source")}>{deal.source ?? "—"}</Field>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.pipeline.deal.account.title", undefined, "Account")}</h3>
            {accountName ? (
              <div className="mt-2 space-y-1 text-sm">
                <div>{accountName}</div>
                {deal.account?.account_kind && (
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">{deal.account.account_kind}</div>
                )}
                {deal.party?.primary_email && (
                  <div className="font-mono text-xs text-[var(--text-secondary)]">{deal.party.primary_email}</div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {t("console.pipeline.deal.account.notLinked", undefined, "Not linked to an account.")}
              </p>
            )}
          </section>

          <section className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("console.pipeline.deal.lifecycle.title", undefined, "Lifecycle")}
            </h3>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">
                  {t("console.pipeline.deal.lifecycle.created", undefined, "Created")}
                </dt>
                <dd className="font-mono text-xs">{timeAgo(deal.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">
                  {t("console.pipeline.deal.lifecycle.updated", undefined, "Updated")}
                </dt>
                <dd className="font-mono text-xs">{timeAgo(deal.updated_at)}</dd>
              </div>
              {deal.closed_at && (
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">
                    {t("console.pipeline.deal.lifecycle.closed", undefined, "Closed")}
                  </dt>
                  <dd className="font-mono text-xs">
                    {timeAgo(deal.closed_at)}
                    {deal.close_outcome ? ` · ${deal.close_outcome}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("console.pipeline.deal.activity.title", undefined, "Activity")}</h3>
          {activities.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t(
                "console.pipeline.deal.activity.empty",
                undefined,
                "No logged activities yet. Calls, emails, and meetings recorded against this deal appear here.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {activities.map((a) => (
                <li key={a.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">{a.activity_kind}</Badge>
                      {a.outcome && <span className="font-mono text-[10px] text-[var(--text-muted)]">{a.outcome}</span>}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{timeAgo(a.occurred_at)}</span>
                  </div>
                  {a.notes && <p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">{a.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
