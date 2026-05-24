import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { CATALOG_KINDS, CATALOG_KIND_LABEL, listMyAssignments, type CatalogKind } from "@/lib/db/assignments";

export const dynamic = "force-dynamic";

/**
 * /m/advances — cross-project view of everything assigned to the caller.
 * Tickets, credentials, lodging, travel, catering, radios — one list.
 * The portal version (/p/[slug]/crew/advances) is scoped to a single
 * show; this is the "across every project I'm on" view.
 */

const STATE_TONE: Record<string, "info" | "success" | "warning" | "error" | "muted"> = {
  briefed: "muted",
  draft: "muted",
  submitted: "info",
  in_review: "info",
  revision_requested: "warning",
  approved: "success",
  delivered: "success",
  rejected: "error",
  issued: "info",
  transferred: "info",
  redeemed: "success",
  expired: "warning",
  voided: "error",
  returned: "success",
};

export default async function MobileAdvancesPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const rows = await listMyAssignments(session.orgId, session.userId);

  const projectIds = Array.from(new Set(rows.map((r) => r.project_id)));
  const projectMap = new Map<string, string>();
  if (projectIds.length) {
    const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
    for (const p of (projects ?? []) as Array<{ id: string; name: string }>) {
      projectMap.set(p.id, p.name);
    }
  }

  const byKind = new Map<CatalogKind, typeof rows>();
  for (const r of rows) {
    const list = byKind.get(r.catalog_kind) ?? [];
    list.push(r);
    byKind.set(r.catalog_kind, list);
  }
  const openCount = rows.filter(
    (r) => !["delivered", "rejected", "redeemed", "voided", "expired"].includes(r.fulfillment_state),
  ).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">My Assignments</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {openCount} open of {rows.length} across every show you&apos;re on.
      </p>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            size="compact"
            title="Nothing Assigned Yet"
            description="When your production team pins something to you, it lands here."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {CATALOG_KINDS.filter((k) => byKind.has(k)).map((kind) => {
            const items = byKind.get(kind) ?? [];
            return (
              <section key={kind}>
                <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  {CATALOG_KIND_LABEL[kind]} <span>· {items.length}</span>
                </h2>
                <ul className="mt-2 space-y-2">
                  {items.map((d) => (
                    <li key={d.id} className="surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{d.title ?? "Untitled"}</div>
                          <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                            {projectMap.get(d.project_id) ?? "Project"}
                            {d.deadline ? ` · due ${fmt.date(d.deadline)}` : ""}
                          </div>
                        </div>
                        <Badge variant={STATE_TONE[d.fulfillment_state] ?? "muted"}>
                          {toTitle(d.fulfillment_state)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Working a single show?{" "}
        <Link className="underline" href="/m/shift">
          Open your shift
        </Link>{" "}
        to see today&apos;s call.
      </p>
    </div>
  );
}
