import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

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

const STATE_TONE: Record<EnvelopeState, "muted" | "info" | "warning" | "success" | "error"> = {
  drafted: "muted",
  sent: "info",
  delivered: "info",
  partially_signed: "warning",
  signed: "success",
  completed: "success",
  declined: "error",
  voided: "muted",
  expired: "muted",
};

const TARGET_LABEL: Record<TargetType, string> = {
  proposal: "Proposal",
  offer_letter: "Offer Letter",
  msa: "MSA",
  prime_contract: "Prime Contract",
  sub_contract: "Sub Contract",
  change_order: "Change Order",
  lien_waiver: "Lien Waiver",
  nda: "NDA",
  other: "Other",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Legal" title="E-Sign Envelopes" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Legal"
        title="E-Sign Envelopes"
        subtitle={`${rows.length} envelope${rows.length === 1 ? "" : "s"} · ${outstandingCount} outstanding · ${completedCount} completed`}
        action={
          <Button href="/console/envelopes/new" size="sm">
            + New Envelope
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Outstanding" value={fmt.number(outstandingCount)} accent />
          <MetricCard label="Completed" value={fmt.number(completedCount)} />
          <MetricCard label="Total" value={fmt.number(rows.length)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/envelopes/${r.id}`}
          emptyLabel="No e-sign envelopes yet"
          emptyDescription="Polymorphic e-signature envelopes for offer letters, MSAs, prime/sub contracts, change orders, lien waivers, NDAs. Routes via DocuSign / Adobe Sign / HelloSign / PandaDoc."
          emptyAction={
            <Button href="/console/envelopes/new" size="sm">
              + New Envelope
            </Button>
          }
          columns={[
            { key: "subject", header: "Subject", render: (r) => r.subject, accessor: (r) => r.subject },
            {
              key: "target",
              header: "Target",
              render: (r) => TARGET_LABEL[r.target_type],
              accessor: (r) => r.target_type,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "provider",
              header: "Provider",
              render: (r) => toTitle(r.provider.replace(/_/g, " ")),
              accessor: (r) => r.provider,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "signers",
              header: "Signers",
              render: (r) => `${r.signed_count} / ${r.signer_count}`,
              accessor: (r) => r.signer_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "sent",
              header: "Sent",
              render: (r) =>
                r.sent_at ? fmt.dateParts(r.sent_at, { month: "short", day: "numeric", year: "2-digit" }) : "—",
              accessor: (r) => r.sent_at,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.envelope_state]}>{toTitle(r.envelope_state)}</Badge>,
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
