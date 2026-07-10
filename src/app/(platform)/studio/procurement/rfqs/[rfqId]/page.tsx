import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";
import { AwardRfqForm } from "./AwardRfqForm";

export const dynamic = "force-dynamic";

type RfqRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_at: string | null;
  project: { name: string | null } | null;
  awarded_vendor: { name: string | null } | null;
  created_at: string;
  updated_at: string;
};

type ResponseRow = {
  id: string;
  response_state: string;
  total_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  awarded_at: string | null;
  vendor: { name: string | null } | null;
};

export default async function Page({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  const formatters = await getRequestFormatters();
  const { t } = await getRequestT();
  const fmtIntl = formatters;
  const fmt = (iso: string | null): string => (iso ? formatters.dateTime(iso) : "—");
  const fmtMoney = (cents: number | null): string => formatters.money(cents);
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.rfqs.detail.title", undefined, "RFQ")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.rfqs.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("rfqs")
    .select(
      "id, title, description, status:rfq_state, due_at, created_at, updated_at, " +
        "project:project_id(name), awarded_vendor:awarded_to_vendor_id(name)",
    )
    .eq("id", rfqId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const rfq = data as unknown as RfqRow | null;
  if (!rfq) notFound();

  const { data: respData } = await supabase
    .from("rfq_responses")
    .select("id, response_state, total_cents, notes, submitted_at, awarded_at, vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .order("submitted_at", { ascending: false })
    .limit(50);

  const responses = (respData ?? []) as unknown as ResponseRow[];
  const responded = responses.filter((r) => r.response_state === "responded" || r.response_state === "awarded").length;
  const lowestBid = responses
    .filter((r) => r.total_cents != null)
    .sort((a, b) => (a.total_cents ?? 0) - (b.total_cents ?? 0))[0];

  // "Award → Draft PO" (v7.8 record action) — manager+ only, and only
  // while the RFQ is in a non-terminal state.
  const awardable = isManagerPlus(session) && ["draft", "sent", "closed"].includes(rfq.status);
  let awardVendors: { id: string; name: string }[] = [];
  if (awardable) {
    const { data: vendorRows } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(200);
    awardVendors = (vendorRows ?? []) as { id: string; name: string }[];
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
        title={rfq.title}
        subtitle={
          <span className="font-mono text-xs">
            {rfq.project?.name ?? "—"} · {t("console.procurement.rfqs.detail.dueLabel", undefined, "due")}{" "}
            {fmt(rfq.due_at)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.procurement.eyebrow", undefined, "Procurement"), href: "/studio/procurement" },
          { label: t("console.procurement.rfqs.breadcrumb", undefined, "RFQs"), href: "/studio/procurement/rfqs" },
          { label: rfq.title },
        ]}
        action={<Badge variant={toneFor(rfq.status)}>{toTitle(rfq.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        {rfq.description && <p className="text-sm text-[var(--p-text-2)]">{rfq.description}</p>}

        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.rfqs.detail.metric.responses", undefined, "Responses")}
            value={fmtIntl.number(responses.length)}
          />
          <MetricCard
            label={t("console.procurement.rfqs.detail.metric.submitted", undefined, "Submitted")}
            value={fmtIntl.number(responded)}
          />
          <MetricCard
            label={t("console.procurement.rfqs.detail.metric.awardedVendor", undefined, "Awarded Vendor")}
            value={rfq.awarded_vendor?.name ?? "—"}
            accent={Boolean(rfq.awarded_vendor?.name)}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.procurement.rfqs.detail.bidSummary", undefined, "Bid Summary")}
          </h3>
          {responses.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.procurement.rfqs.detail.emptyResponses",
                undefined,
                "No responses yet. Invite vendors via the requisitions table to start collecting bids.",
              )}
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {lowestBid && (
                <div className="rounded bg-[var(--p-surface)] p-3 text-xs">
                  <div className="text-[var(--p-text-2)]">
                    {t("console.procurement.rfqs.detail.lowestBid", undefined, "Lowest bid")}
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {lowestBid.vendor?.name ?? "—"} · {fmtMoney(lowestBid.total_cents)}
                  </div>
                </div>
              )}
              <ul className="divide-y divide-[var(--p-border)]">
                {responses.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{r.vendor?.name ?? "—"}</div>
                      <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                        {r.submitted_at
                          ? fmt(r.submitted_at)
                          : t("console.procurement.rfqs.detail.pending", undefined, "Pending")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">{fmtMoney(r.total_cents)}</span>
                      <Badge variant={toneFor(r.response_state)}>{toTitle(r.response_state)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {awardable && awardVendors.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.procurement.rfqs.detail.awardTitle", undefined, "Award")}
            </h3>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.procurement.rfqs.detail.awardHint",
                undefined,
                "Awarding closes this RFQ and drafts a purchase order for the winning vendor.",
              )}
            </p>
            <div className="mt-3">
              <AwardRfqForm
                rfqId={rfq.id}
                vendors={awardVendors}
                defaultAmount={lowestBid?.total_cents != null ? (lowestBid.total_cents / 100).toFixed(2) : undefined}
              />
            </div>
          </section>
        )}

        <section className="surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.procurement.rfqs.detail.linkedRequisitions", undefined, "Linked Requisitions")}
            </h3>
            <Link href={`/studio/procurement/requisitions?rfqId=${rfq.id}`} className="text-xs text-[var(--p-accent)]">
              {t("console.procurement.rfqs.detail.viewLink", undefined, "View →")}
            </Link>
          </div>
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            {t(
              "console.procurement.rfqs.detail.linkedHint",
              undefined,
              "Award is captured on the linked requisitions; bidder line items roll up here.",
            )}
          </p>
        </section>
      </div>
    </>
  );
}
