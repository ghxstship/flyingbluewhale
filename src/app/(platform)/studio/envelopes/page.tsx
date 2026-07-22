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
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Provider = "docusign" | "adobe_sign" | "hellosign" | "pandadoc" | "manual";
type EnvelopeState =
  | "drafted"
  | "sent"
  | "delivered"
  | "partially_signed"
  | "signed"
  | "completed"
  | "declined"
  | "voided"
  | "expired";
type TargetType =
  | "proposal"
  | "offer_letter"
  | "msa"
  | "prime_contract"
  | "sub_contract"
  | "change_order"
  | "lien_waiver"
  | "nda"
  | "other";

type Row = {
  id: string;
  subject: string;
  provider: Provider;
  envelope_state: EnvelopeState;
  target_type: TargetType;
  target_id: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  project: { name: string | null } | null;
  signer_count: number;
  signed_count: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  const TARGET_LABEL: Record<TargetType, string> = {
    proposal: t("console.envelopes.target.proposal", undefined, "Proposal"),
    offer_letter: t("console.envelopes.target.offerLetter", undefined, "Offer Letter"),
    msa: t("console.envelopes.target.msa", undefined, "MSA"),
    prime_contract: t("console.envelopes.target.primeContract", undefined, "Prime Contract"),
    sub_contract: t("console.envelopes.target.subContract", undefined, "Sub Contract"),
    change_order: t("console.envelopes.target.changeOrder", undefined, "Change Order"),
    lien_waiver: t("console.envelopes.target.lienWaiver", undefined, "Lien Waiver"),
    nda: t("console.envelopes.target.nda", undefined, "NDA"),
    other: t("console.envelopes.target.other", undefined, "Other"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.envelopes.eyebrow", undefined, "Legal")}
          title={t("console.envelopes.title", undefined, "E-Sign Envelopes")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.envelopes.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data: env } = await supabase
    .from("contract_envelopes")
    .select(
      "id, subject, provider, envelope_state, target_type, target_id, sent_at, completed_at, expires_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const headers = (env ?? []) as unknown as Omit<Row, "signer_count" | "signed_count">[];
  const ids = headers.map((h) => h.id);

  const signerCounts: Record<string, { total: number; signed: number }> = {};
  if (ids.length > 0) {
    const { data: signers } = await supabase
      .from("contract_envelope_signers")
      .select("envelope_id, signer_state")
      .in("envelope_id", ids);
    for (const s of (signers ?? []) as { envelope_id: string; signer_state: string }[]) {
      const r = signerCounts[s.envelope_id] ?? { total: 0, signed: 0 };
      r.total += 1;
      if (s.signer_state === "signed") r.signed += 1;
      signerCounts[s.envelope_id] = r;
    }
  }

  const rows: Row[] = headers.map((h) => ({
    ...h,
    signer_count: signerCounts[h.id]?.total ?? 0,
    signed_count: signerCounts[h.id]?.signed ?? 0,
  }));

  const outstandingCount = rows.filter((r) =>
    ["drafted", "sent", "delivered", "partially_signed"].includes(r.envelope_state),
  ).length;
  const completedCount = rows.filter((r) => r.envelope_state === "completed" || r.envelope_state === "signed").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.envelopes.eyebrow", undefined, "Legal")}
        title={t("console.envelopes.title", undefined, "E-Sign Envelopes")}
        subtitle={t(
          "console.envelopes.subtitle",
          {
            count: rows.length,
            label: rows.length === 1 ? "envelope" : "envelopes",
            outstanding: outstandingCount,
            completed: completedCount,
          },
          `${rows.length} envelope${rows.length === 1 ? "" : "s"} · ${outstandingCount} outstanding · ${completedCount} completed`,
        )}
        action={
          <Button href="/studio/envelopes/new" size="sm">
            {t("console.envelopes.newEnvelope", undefined, "+ New Envelope")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.envelopes.metric.outstanding", undefined, "Outstanding")}
            value={fmt.number(outstandingCount)}
            accent
          />
          <MetricCard
            label={t("console.envelopes.metric.completed", undefined, "Completed")}
            value={fmt.number(completedCount)}
          />
          <MetricCard label={t("console.envelopes.metric.total", undefined, "Total")} value={fmt.number(rows.length)} />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/envelopes/${r.id}`}
          emptyLabel={t("console.envelopes.emptyLabel", undefined, "No e-sign envelopes yet")}
          emptyDescription={t(
            "console.envelopes.emptyDescription",
            undefined,
            "Polymorphic e-signature envelopes for offer letters, MSAs, prime/sub contracts, change orders, lien waivers, NDAs. Routes via DocuSign / Adobe Sign / HelloSign / PandaDoc.",
          )}
          emptyAction={
            <Button href="/studio/envelopes/new" size="sm">
              {t("console.envelopes.newEnvelope", undefined, "+ New Envelope")}
            </Button>
          }
          columns={[
            {
              key: "subject",
              header: t("console.envelopes.column.subject", undefined, "Subject"),
              render: (r) => r.subject,
              accessor: (r) => r.subject,
            },
            {
              key: "target",
              header: t("console.envelopes.column.target", undefined, "Target"),
              render: (r) => TARGET_LABEL[r.target_type],
              accessor: (r) => r.target_type,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "project",
              header: t("console.envelopes.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "provider",
              header: t("console.envelopes.column.provider", undefined, "Provider"),
              render: (r) => toTitle(r.provider.replace(/_/g, " ")),
              accessor: (r) => r.provider,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "signers",
              header: t("console.envelopes.column.signers", undefined, "Signers"),
              render: (r) => `${r.signed_count} / ${r.signer_count}`,
              accessor: (r) => r.signer_count,
              numeric: true,
            },
            {
              key: "sent",
              header: t("console.envelopes.column.sent", undefined, "Sent"),
              render: (r) =>
                r.sent_at ? fmt.dateParts(r.sent_at, { month: "short", day: "numeric", year: "2-digit" }) : "—",
              accessor: (r) => r.sent_at,
              mono: true,
            },
            {
              key: "state",
              header: t("console.envelopes.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.envelope_state)}>{toTitle(r.envelope_state)}</Badge>,
              accessor: (r) => r.envelope_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
