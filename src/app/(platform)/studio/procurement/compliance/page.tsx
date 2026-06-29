import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocStatusRow } from "@/components/ui/DocStatusRow";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  DOC_KIND_LABELS,
  VERDICT_BADGE,
  VERDICT_LABELS,
  type DocStatus,
  type EligibilityVerdict,
} from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

type Verdict = { vendor_id: string; trade: string; verdict: EligibilityVerdict };
type DocRow = {
  vendor_id: string;
  doc_kind: string;
  expires_on: string | null;
  doc_status: DocStatus;
  remaining_pct: number | null;
};

export default async function CompliancePage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data: verdicts }, { data: docs }, { data: vendors }] = await Promise.all([
    supabase.from("v_sub_eligibility").select("vendor_id, trade, verdict").eq("org_id", session.orgId),
    supabase
      .from("v_compliance_doc_status")
      .select("vendor_id, doc_kind, expires_on, doc_status, remaining_pct")
      .eq("org_id", session.orgId),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).limit(500),
  ]);

  const vRows = (verdicts ?? []) as Verdict[];
  const dRows = (docs ?? []) as DocRow[];
  const nameById = new Map<string, string>(
    ((vendors ?? []) as { id: string; name: string | null }[]).map((v) => [v.id, v.name ?? "Vendor"]),
  );
  const docsByVendor = new Map<string, DocRow[]>();
  for (const d of dRows) {
    const list = docsByVendor.get(d.vendor_id) ?? [];
    list.push(d);
    docsByVendor.set(d.vendor_id, list);
  }

  const eligible = vRows.filter((v) => v.verdict === "eligible").length;
  const expiring = vRows.filter((v) => v.verdict === "expiring").length;
  const blocked = vRows.filter((v) => v.verdict === "blocked").length;

  // Group eligibility verdicts by vendor for the record list.
  const byVendor = new Map<string, Verdict[]>();
  for (const v of vRows) {
    const list = byVendor.get(v.vendor_id) ?? [];
    list.push(v);
    byVendor.set(v.vendor_id, list);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.compliance.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.compliance.title", undefined, "Compliance Vault")}
        subtitle={t(
          "console.procurement.compliance.subtitle",
          undefined,
          "Subcontractor insurance, licenses and certs — eligibility is derived from what's on file.",
        )}
      />

      <div className="metric-grid mb-6">
        <MetricCard label={t("console.procurement.compliance.eligible", undefined, "Eligible")} value={String(eligible)} />
        <MetricCard label={t("console.procurement.compliance.expiring", undefined, "Expiring")} value={String(expiring)} />
        <MetricCard label={t("console.procurement.compliance.blocked", undefined, "Blocked")} value={String(blocked)} />
      </div>

      {byVendor.size === 0 ? (
        <EmptyState
          title={t("console.procurement.compliance.empty.title", undefined, "No compliance records yet")}
          description={t(
            "console.procurement.compliance.empty.body",
            undefined,
            "Add subcontractor documents (COI, W-9, license) and define trade requirements to start tracking eligibility.",
          )}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {[...byVendor.entries()].map(([vendorId, verdictRows]) => (
            <section key={vendorId} className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--p-text-1)]">{nameById.get(vendorId) ?? "Vendor"}</h2>
                {verdictRows.map((v) => (
                  <Badge key={v.trade} variant={VERDICT_BADGE[v.verdict]}>
                    {v.trade}: {VERDICT_LABELS[v.verdict]}
                  </Badge>
                ))}
              </div>
              <div>
                {(docsByVendor.get(vendorId) ?? []).map((d, i) => (
                  <DocStatusRow
                    key={`${d.doc_kind}-${i}`}
                    name={DOC_KIND_LABELS[d.doc_kind] ?? d.doc_kind}
                    expiresOn={d.expires_on ?? undefined}
                    status={d.doc_status}
                    remainingPct={d.remaining_pct ?? undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
