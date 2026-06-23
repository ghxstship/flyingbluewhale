import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

// Per-row detail (workflow audit F-F). The list previously linked rows to a
// detail route that didn't exist (the SEA TRIAL de-linked them to avoid 404s);
// this restores the drill-in with a read view of the vetting record.
type Detail = {
  id: string;
  prequalification_state: string;
  score: number | null;
  expires_at: string | null;
  created_at: string | null;
  vendor: { name: string | null } | null;
  questionnaire: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  in_progress: "info",
  submitted: "info",
  approved: "success",
  approved_conditional: "warning",
  rejected: "error",
  expired: "muted",
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

export default async function Page({ params }: { params: Promise<{ prequalId: string }> }) {
  if (!hasSupabase) return null;
  const { prequalId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("vendor_prequalifications")
    .select(
      "id, prequalification_state, score, expires_at, created_at, vendor:vendor_id(name), questionnaire:questionnaire_id(name)",
    )
    .eq("id", prequalId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const rec = data as unknown as Detail | null;
  if (!rec) notFound();

  const vendorName = rec.vendor?.name ?? "—";
  const fields: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: t("console.procurement.prequalification.col.status", undefined, "Status"),
      value: (
        <Badge variant={STATUS_TONE[rec.prequalification_state] ?? "muted"}>
          {toTitle(rec.prequalification_state)}
        </Badge>
      ),
    },
    { label: t("console.procurement.prequalification.col.vendor", undefined, "Vendor"), value: vendorName },
    {
      label: t("console.procurement.prequalification.col.questionnaire", undefined, "Questionnaire"),
      value: rec.questionnaire?.name ?? "—",
    },
    {
      label: t("console.procurement.prequalification.col.score", undefined, "Score"),
      value: rec.score == null ? "—" : String(rec.score),
    },
    { label: t("console.procurement.prequalification.detail.expires", undefined, "Expires"), value: fmt(rec.expires_at) },
    { label: t("console.procurement.prequalification.detail.created", undefined, "Created"), value: fmt(rec.created_at) },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.prequalification.eyebrow", undefined, "Procurement")}
        title={`${vendorName} — ${t("console.procurement.prequalification.detail.suffix", undefined, "Prequalification")}`}
        subtitle={rec.questionnaire?.name ?? undefined}
      />
      <div className="page-content">
        <dl className="metric-grid">
          {fields.map((f) => (
            <div key={f.label} className="surface-raised rounded-lg p-4">
              <dt className="text-xs tracking-wider text-[var(--p-text-2)] uppercase">{f.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-[var(--p-text-1)]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
