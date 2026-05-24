import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import type { DeliverableType } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Portal `/p/[slug]/crew/advances` — production advancing for the
 * caller as an individual on this project. "Advancing" means the
 * unified advancing → fulfillment → tracking lifecycle from the
 * master catalog assignable to a person: credentials, catering,
 * radios, tools, equipment, uniforms, travel, lodging, vehicles, plus
 * the rider-style deliverables when they're owned by an individual.
 * Never financial cash advances — that concept doesn't live on this
 * surface.
 *
 * Same `deliverables` table + `deliverable_state` lifecycle used by
 * project-document deliverables; per-individual rows are gated by the
 * `assignee_id` column (migration 0049). One source of truth, three
 * platforms (ATLVS console, GVTEWAY portal, COMPVSS field).
 */

type DeliverableRow = {
  id: string;
  type: string;
  title: string | null;
  deliverable_state: string;
  version: number;
  deadline: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
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

// Catalog kinds visible to an individual crew member. Project-document
// kinds (technical_rider, stage_plot, etc.) are intentionally excluded —
// those scope to the project, not a person, and live under the org-side
// advancing CMS.
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
  credential_assignment: "Credential",
  catering_assignment: "Catering",
  radio_assignment: "Radio",
  tool_assignment: "Tool",
  equipment_assignment: "Equipment",
  uniform_assignment: "Uniform",
  travel_assignment: "Travel",
  lodging_assignment: "Lodging",
  vehicle_assignment: "Vehicle",
};

export default async function CrewAdvancesPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Resolve project from the portal slug via the shared helper —
  // share_links + projects-by-slug fallback, plus consume-link auditing.
  const project = await projectIdFromSlug(slug);

  let rows: DeliverableRow[] = [];
  if (project) {
    const { data } = await supabase
      .from("deliverables")
      .select("id, type, title, deliverable_state, version, deadline, submitted_at, reviewed_at")
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .eq("assignee_id", session.userId)
      .in("type", CATALOG_KINDS)
      .is("deleted_at", null)
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(100);
    rows = (data ?? []) as unknown as DeliverableRow[];
  }

  // Group by kind so the field worker sees credentials together,
  // catering together, etc. — the catalog is the user's mental model.
  const byKind = new Map<string, DeliverableRow[]>();
  for (const r of rows) {
    const list = byKind.get(r.type) ?? [];
    list.push(r);
    byKind.set(r.type, list);
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Portal</div>
      <h1 className="mt-1 text-2xl font-semibold">My Advancing</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Your credentials, catering, radios, tools, uniforms, travel, lodging, and vehicles for this show.
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
                  {KIND_LABEL[kind]} <span className="text-[var(--text-muted)]">· {items.length}</span>
                </h2>
                <ul className="mt-2 space-y-2">
                  {items.map((d) => (
                    <li key={d.id} className="surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{d.title ?? "Untitled"}</div>
                          <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                            v{d.version}
                            {d.deadline ? ` · due ${fmt.date(d.deadline)}` : ""}
                            {d.submitted_at ? ` · submitted ${fmt.date(d.submitted_at)}` : ""}
                            {d.reviewed_at ? ` · reviewed ${fmt.date(d.reviewed_at)}` : ""}
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
        Issue with anything here? Reach your production coordinator via{" "}
        <Link className="underline" href={`/p/${slug}/crew`}>
          your call-sheet
        </Link>
        .
      </p>
    </div>
  );
}
