import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ReviewControls } from "./ReviewControls";

/**
 * /studio/workforce/documents — the office half of the personal-documents
 * lifecycle. Every field upload (`/m/documents/new`) lands here in
 * `pending_review`; the manager band verifies or rejects, and expiry
 * (`valid_until`) surfaces the licenses and certs about to lapse before
 * they lapse on a show day.
 *
 * Lenses via ?state= (pending_review/verified/rejected/unverified) and
 * ?lens=expiring (≤30 days or past).
 */
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  label: string;
  doc_kind: string;
  valid_until: string | null;
  verification_state: "unverified" | "pending_review" | "verified" | "rejected";
  rejection_reason: string | null;
  uploaded_at: string;
};

const STATE_VARIANT: Record<Row["verification_state"], "muted" | "info" | "success" | "error"> = {
  unverified: "muted",
  pending_review: "info",
  verified: "success",
  rejected: "error",
};

export default async function WorkforceDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; lens?: string }>;
}) {
  const { state: stateFilter, lens } = await searchParams;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Documents" />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const manager = isManagerPlus(session);
  const supabase = await createClient();

  // Manager band reads org-wide (RLS policy personal_documents_manager_read);
  // a non-manager who lands here sees only their own rows, which is honest.
  const { data } = await supabase
    .from("personal_documents")
    .select("id, user_id, label, doc_kind, valid_until, verification_state, rejection_reason, uploaded_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .limit(500);
  const all = (data ?? []) as Row[];

  const userIds = [...new Set(all.map((r) => r.user_id))];
  const { data: userRows } =
    userIds.length > 0
      ? await supabase.from("users").select("id, name, email").in("id", userIds).is("deleted_at", null)
      : { data: [] as Array<{ id: string; name: string | null; email: string | null }> };
  const nameById = new Map<string, string>();
  for (const u of (userRows ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    nameById.set(u.id, u.name ?? u.email ?? u.id.slice(0, 8));
  }

  const todayMs = Date.now();
  const daysUntil = (d: string | null) =>
    d == null ? null : Math.floor((new Date(`${d}T00:00:00`).getTime() - todayMs) / 86_400_000);

  const pendingCount = all.filter((r) => r.verification_state === "pending_review").length;
  const expiringCount = all.filter((r) => {
    const days = daysUntil(r.valid_until);
    return days != null && days <= 30 && days >= 0;
  }).length;
  const expiredCount = all.filter((r) => {
    const days = daysUntil(r.valid_until);
    return days != null && days < 0;
  }).length;

  let rows = all;
  if (stateFilter && ["unverified", "pending_review", "verified", "rejected"].includes(stateFilter)) {
    rows = rows.filter((r) => r.verification_state === stateFilter);
  }
  if (lens === "expiring") {
    rows = rows.filter((r) => {
      const days = daysUntil(r.valid_until);
      return days != null && days <= 30;
    });
  }

  const lensLink = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={`ps-btn ps-btn--sm ${active ? "" : "ps-btn--tertiary"}`}>
      {label}
    </Link>
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Documents"
        subtitle="IDs, licenses, certs & contracts the crew carries · field uploads land here for review"
      />
      <div className="page-content space-y-4">
        <div className="metric-grid">
          <MetricCard label="Pending Review" value={String(pendingCount)} />
          <MetricCard label="Expiring In 30 Days" value={String(expiringCount)} />
          <MetricCard label="Expired" value={String(expiredCount)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {lensLink("/studio/workforce/documents", "All", !stateFilter && lens !== "expiring")}
          {lensLink("/studio/workforce/documents?state=pending_review", "Pending Review", stateFilter === "pending_review")}
          {lensLink("/studio/workforce/documents?lens=expiring", "Expiring", lens === "expiring")}
          {lensLink("/studio/workforce/documents?state=verified", "Verified", stateFilter === "verified")}
          {lensLink("/studio/workforce/documents?state=rejected", "Rejected", stateFilter === "rejected")}
        </div>

        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            No documents in this lens. Crew uploads from the field (COMPVSS · Documents) land in Pending Review.
          </div>
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Person</th>
                  <th>Kind</th>
                  <th>Valid Until</th>
                  <th>State</th>
                  {manager ? <th className="text-right">Review</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const days = daysUntil(r.valid_until);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="font-medium">{r.label}</div>
                        {r.rejection_reason && (
                          <div className="text-xs text-[var(--p-danger-text)]">{r.rejection_reason}</div>
                        )}
                      </td>
                      <td>{nameById.get(r.user_id) ?? "…"}</td>
                      <td>{toTitle(r.doc_kind)}</td>
                      <td>
                        {r.valid_until ?? "—"}
                        {days != null && days < 0 && (
                          <Badge variant="error" className="ml-2">
                            Expired
                          </Badge>
                        )}
                        {days != null && days >= 0 && days <= 30 && (
                          <Badge variant="warning" className="ml-2">
                            {days}d
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant={STATE_VARIANT[r.verification_state]}>{toTitle(r.verification_state)}</Badge>
                      </td>
                      {manager ? (
                        <td className="text-right">
                          <ReviewControls docId={r.id} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
