import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Stakeholder audit trail — read-only ledger of privileged actions in the org,
 * newest first. Sourced from the org-scoped `audit_log` view; RLS decides what
 * the caller may see (empty state if their role grants no rows).
 */

type AuditRow = {
  id: string;
  action: string | null;
  target_table: string | null;
  actor_email: string | null;
  at: string | null;
  occurred_at: string | null;
};

export default async function StakeholderAudit({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("p.stakeholder.audit.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, target_table, actor_email, at, occurred_at")
    .eq("org_id", session.orgId)
    .order("at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as AuditRow[];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "stakeholder")} />
      <div className="flex-1 p-6">
        <h1>{t("p.stakeholder.audit.title", undefined, "Audit Trail")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.stakeholder.audit.subtitle", undefined, "Every privileged action, time-stamped. Read-only.")}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("p.stakeholder.audit.empty.title", undefined, "No Audit Entries")}
              description={t(
                "p.stakeholder.audit.empty.description",
                undefined,
                "Privileged actions you have visibility on will appear here as they happen.",
              )}
            />
          </div>
        ) : (
          <div className="surface mt-5 overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">{t("p.stakeholder.audit.col.when", undefined, "When")}</th>
                  <th className="px-3 py-2 text-left">{t("p.stakeholder.audit.col.action", undefined, "Action")}</th>
                  <th className="px-3 py-2 text-left">{t("p.stakeholder.audit.col.target", undefined, "Target")}</th>
                  <th className="px-3 py-2 text-left">{t("p.stakeholder.audit.col.actor", undefined, "Actor")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmt.date(r.occurred_at ?? r.at ?? new Date().toISOString())}
                    </td>
                    <td className="px-3 py-2">{r.action ?? "—"}</td>
                    <td className="px-3 py-2 text-[var(--p-text-2)]">{r.target_table ?? "—"}</td>
                    <td className="px-3 py-2 text-[var(--p-text-2)]">{r.actor_email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
