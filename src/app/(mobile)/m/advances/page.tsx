import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import type { DeliverableType } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /m/advances — cross-project view of catalog items assigned to the
 * caller. The portal version (/p/[slug]/crew/advances) is scoped to a
 * single show; this is the COMPVSS "across every project I'm on" view.
 * Same deliverables table + lifecycle, no project filter.
 */

type DeliverableRow = {
  id: string;
  project_id: string;
  type: string;
  title: string | null;
  deliverable_state: string;
  deadline: string | null;
};

const CATALOG_KINDS: DeliverableType[] = [
  "credential_assignment",
  "catering_assignment",
  "radio_assignment",
  "tool_assignment",
  "equipment_assignment",
  "uniform_assignment",
  "travel_assignment",
  "lodging_assignment",
  "vehicle_assignment",
];

const KIND_LABEL: Record<string, string> = {
  credential_assignment: "Credentials",
  catering_assignment: "Catering",
  radio_assignment: "Radios",
  tool_assignment: "Tools",
  equipment_assignment: "Equipment",
  uniform_assignment: "Uniforms",
  travel_assignment: "Travel",
  lodging_assignment: "Lodging",
  vehicle_assignment: "Vehicles",
};

const STATE_TONE: Record<string, "info" | "success" | "warning" | "error" | "muted"> = {
  briefed: "muted",
  draft: "muted",
  submitted: "info",
  in_review: "info",
  revision_requested: "warning",
  approved: "success",
  delivered: "success",
  rejected: "error",
};

export default async function MobileAdvancesPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("deliverables")
    .select("id, project_id, type, title, deliverable_state, deadline")
    .eq("org_id", session.orgId)
    .eq("assignee_id", session.userId)
    .in("type", CATALOG_KINDS)
    .is("deleted_at", null)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(200);
  const rows = (data ?? []) as unknown as DeliverableRow[];

  // Project name hydration so the "for which show?" question is
  // answerable at a glance.
  const projectIds = Array.from(new Set(rows.map((r) => r.project_id)));
  const projectMap = new Map<string, string>();
  if (projectIds.length) {
    const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
    for (const p of (projects ?? []) as Array<{ id: string; name: string }>) {
      projectMap.set(p.id, p.name);
    }
  }

  const byKind = new Map<string, DeliverableRow[]>();
  for (const r of rows) {
    const list = byKind.get(r.type) ?? [];
    list.push(r);
    byKind.set(r.type, list);
  }
  const openCount = rows.filter(
    (r) => r.deliverable_state !== "delivered" && r.deliverable_state !== "rejected",
  ).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">My Advancing</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {openCount} open of {rows.length} across every show you're on.
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
                  {KIND_LABEL[kind]} <span>· {items.length}</span>
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
                        <Badge variant={STATE_TONE[d.deliverable_state] ?? "muted"}>
                          {toTitle(d.deliverable_state)}
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
