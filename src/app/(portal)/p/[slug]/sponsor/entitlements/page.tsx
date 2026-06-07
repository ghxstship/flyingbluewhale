import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EntitlementRow = {
  id: string;
  title: string;
  quantity: number;
  delivered: number;
  status: string;
  due_by: string | null;
  evidence_path: string | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success"> = {
  contracted: "muted",
  in_progress: "info",
  at_risk: "warning",
  delivered: "success",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.sponsor.entitlements.title", undefined, "Entitlements")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  }
  // RLS already narrows to the sponsor client linked to this user; we order
  // by due_by so things at risk surface first.
  const { data } = await supabase
    .from("sponsor_entitlements")
    .select("id, title, quantity, delivered, status, due_by, evidence_path")
    .eq("org_id", session.orgId)
    .order("due_by", { ascending: true, nullsFirst: false });

  const rows = ((data ?? []) as unknown as EntitlementRow[]) ?? [];
  const totalQty = rows.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const totalDelivered = rows.reduce((s, r) => s + (r.delivered ?? 0), 0);
  const pct = totalQty > 0 ? Math.round((totalDelivered / totalQty) * 100) : 0;
  const atRisk = rows.filter((r) => r.status === "at_risk").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
        title={t("p.sponsor.entitlements.title", undefined, "Entitlements")}
        subtitle={
          rows.length === 1
            ? t(
                "p.sponsor.entitlements.subtitle.one",
                { count: rows.length, pct },
                `${rows.length} contracted item · ${pct}% delivered`,
              )
            : t(
                "p.sponsor.entitlements.subtitle.other",
                { count: rows.length, pct },
                `${rows.length} contracted items · ${pct}% delivered`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.sponsor.breadcrumb.sponsor", undefined, "Sponsor"), href: `/p/${slug}/sponsor` },
          { label: t("p.sponsor.entitlements.breadcrumb", undefined, "Entitlements") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.sponsor.entitlements.metric.delivered", undefined, "Delivered")}
            value={`${fmt.number(totalDelivered)} / ${fmt.number(totalQty)}`}
            accent
          />
          <MetricCard
            label={t("p.sponsor.entitlements.metric.atRisk", undefined, "Items at Risk")}
            value={fmt.number(atRisk)}
          />
          <MetricCard
            label={t("p.sponsor.entitlements.metric.total", undefined, "Total Items")}
            value={fmt.number(rows.length)}
          />
        </div>

        {rows.length > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("p.sponsor.entitlements.overallDelivery", undefined, "Overall Delivery")}
              </h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />
          </section>
        )}

        <DataTable<EntitlementRow>
          rows={rows}
          emptyLabel={t("p.sponsor.entitlements.empty.label", undefined, "No entitlements on file")}
          emptyDescription={t(
            "p.sponsor.entitlements.empty.description",
            undefined,
            "Once your sponsorship contract is signed, the deliverables breakdown lands here with quantity and due dates.",
          )}
          columns={[
            {
              key: "title",
              header: t("p.sponsor.entitlements.col.entitlement", undefined, "Entitlement"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "qty",
              header: t("p.sponsor.entitlements.col.quantity", undefined, "Quantity"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.delivered}/{r.quantity}
                </span>
              ),
              accessor: (r) => Number(r.delivered ?? 0),
            },
            {
              key: "due",
              header: t("p.sponsor.entitlements.col.due", undefined, "Due"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_by)}</span>,
              accessor: (r) => r.due_by ?? null,
            },
            {
              key: "status",
              header: t("p.sponsor.entitlements.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
            {
              key: "evidence",
              header: t("p.sponsor.entitlements.col.evidence", undefined, "Evidence"),
              render: (r) =>
                r.evidence_path ? (
                  <span className="font-mono text-[10px] text-[var(--p-accent)]">
                    {t("p.sponsor.entitlements.attached", undefined, "attached")}
                  </span>
                ) : (
                  <span className="text-[var(--p-text-2)]">—</span>
                ),
              accessor: (r) => r.evidence_path ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.sponsor.entitlements.footnote",
            undefined,
            "Evidence — proof of delivery (photo, link, signed receipt) — is attached as items are fulfilled. Disputes should be raised within 30 days of the listed due date.",
          )}
        </p>
      </div>
    </>
  );
}
