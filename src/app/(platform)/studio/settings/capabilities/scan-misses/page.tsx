import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { ResolveMissButton } from "./ResolveMissButton";

/**
 * Scan misses (backlog P1.3) — the queue of codes the field scanned that
 * resolved against nothing, ranked by how often they keep coming back.
 *
 * This is the measurement instrument for the P4 purchasing decision: whether
 * an external product database is worth licensing is answered by what
 * actually lands here, not by opinion. Codes that no database could ever
 * resolve (retailer RCNs, deli codes, ISBNs, coupons) are excluded at write
 * time so this number stays honest.
 *
 * Ranked read rides `scan_unknowns_org_open_idx` (org, seen_count DESC where
 * resolved_at IS NULL) — built for exactly this query.
 */
export const dynamic = "force-dynamic";

type MissRow = {
  id: string;
  code: string;
  format: string | null;
  mode: string | null;
  seen_count: number;
  first_seen: string;
  last_seen: string;
  last_actor_user_id: string | null;
  resolved_at: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.capabilities.scanMisses.eyebrow", undefined, "Settings · Capabilities")}
          title={t("console.settings.capabilities.scanMisses.title", undefined, "Scan Misses")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.capabilities.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const canResolve = isManagerPlus(session);
  const supabase = await createClient();

  const [openRes, resolvedRes, membersRes] = await Promise.all([
    supabase
      .from("scan_unknowns")
      .select("id, code, format, mode, seen_count, first_seen, last_seen, last_actor_user_id, resolved_at")
      .eq("org_id", session.orgId)
      .is("resolved_at", null)
      .order("seen_count", { ascending: false })
      .order("last_seen", { ascending: false })
      .limit(200),
    supabase
      .from("scan_unknowns")
      .select("id, code, format, mode, seen_count, first_seen, last_seen, last_actor_user_id, resolved_at")
      .eq("org_id", session.orgId)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(25),
    supabase
      .from("memberships")
      .select("user_id, users(email)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(500),
  ]);

  const emailByUser = new Map<string, string>();
  for (const m of (membersRes.data ?? []) as { user_id: string; users: { email?: string | null } | null }[]) {
    if (m.users?.email) emailByUser.set(m.user_id, m.users.email);
  }

  const open = (openRes.data ?? []) as MissRow[];
  const resolved = (resolvedRes.data ?? []) as MissRow[];
  const scansRepresented = open.reduce((sum, r) => sum + r.seen_count, 0);
  const repeat = open.filter((r) => r.seen_count > 1).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.capabilities.scanMisses.eyebrow", undefined, "Settings · Capabilities")}
        title={t("console.settings.capabilities.scanMisses.title", undefined, "Scan Misses")}
        subtitle={t(
          "console.settings.capabilities.scanMisses.subtitle",
          undefined,
          "Codes the field scanned that resolved against nothing, most-seen first. A code seen forty times is a work item; a one-off is noise.",
        )}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard
            label={t("console.settings.capabilities.scanMisses.open", undefined, "Open misses")}
            value={open.length}
          />
          <MetricCard
            label={t("console.settings.capabilities.scanMisses.scans", undefined, "Scans they represent")}
            value={scansRepresented}
          />
          <MetricCard
            label={t("console.settings.capabilities.scanMisses.repeat", undefined, "Seen more than once")}
            value={repeat}
          />
        </div>

        {open.length === 0 ? (
          <EmptyState
            title={t("console.settings.capabilities.scanMisses.empty.title", undefined, "No Open Misses")}
            description={t(
              "console.settings.capabilities.scanMisses.empty.body",
              undefined,
              "Everything the field scans is resolving. When a code misses, it lands here with a count so you can decide whether it is a catalog gap or noise.",
            )}
          />
        ) : (
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">
              {t("console.settings.capabilities.scanMisses.queue", undefined, "Miss Queue")}
            </h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.settings.capabilities.scanMisses.queueBody",
                undefined,
                "Resolve a miss after adding the item to the catalog, or when you have judged it noise. Misses are never deleted; the queue is the record of what the field actually scanned.",
              )}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">{t("console.settings.capabilities.scanMisses.code", undefined, "Code")}</th>
                    <th className="text-left">{t("console.settings.capabilities.scanMisses.format", undefined, "Format")}</th>
                    <th className="text-left">{t("console.settings.capabilities.scanMisses.mode", undefined, "Mode")}</th>
                    <th className="text-right">{t("console.settings.capabilities.scanMisses.seen", undefined, "Seen")}</th>
                    <th className="text-left">{t("console.settings.capabilities.scanMisses.lastSeen", undefined, "Last seen")}</th>
                    <th className="text-left">{t("console.settings.capabilities.scanMisses.lastBy", undefined, "Last by")}</th>
                    {canResolve && <th className="text-right"></th>}
                  </tr>
                </thead>
                <tbody>
                  {open.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <code className="ps-id font-mono text-xs">{r.code}</code>
                      </td>
                      <td className="text-xs text-[var(--p-text-2)]">{r.format ?? "—"}</td>
                      <td>{r.mode ? <Badge variant="muted">{r.mode}</Badge> : <span className="text-[var(--p-text-3)]">—</span>}</td>
                      <td className="text-right tabular-nums font-medium">{r.seen_count}</td>
                      <td className="text-xs text-[var(--p-text-2)]">{fmt.relative(r.last_seen)}</td>
                      <td className="text-xs text-[var(--p-text-2)]">
                        {r.last_actor_user_id ? (emailByUser.get(r.last_actor_user_id) ?? "—") : "—"}
                      </td>
                      {canResolve && (
                        <td className="text-right">
                          <ResolveMissButton id={r.id} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {resolved.length > 0 && (
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">
              {t("console.settings.capabilities.scanMisses.recentlyResolved", undefined, "Recently Resolved")}
            </h2>
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {resolved.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                  <code className="ps-id font-mono text-xs">{r.code}</code>
                  <span className="text-xs text-[var(--p-text-3)]">
                    {r.seen_count === 1 ? "seen once" : `seen ${r.seen_count} times`}
                  </span>
                  {r.resolved_at && (
                    <span className="ml-auto text-xs text-[var(--p-text-3)]">{fmt.relative(r.resolved_at)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-[var(--p-text-3)]">
          <Link href="/studio/settings/capabilities" className="underline">
            {t("console.settings.capabilities.backToCapabilities", undefined, "Back to Capabilities")}
          </Link>
        </p>
      </div>
    </>
  );
}
