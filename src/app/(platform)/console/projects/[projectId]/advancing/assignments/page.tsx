import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import type { DeliverableType } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * /console/projects/[projectId]/advancing/assignments — per-individual
 * catalog assignment admin. Operators assign credentials, catering,
 * radios, tools, equipment, uniforms, travel, lodging, and vehicles to
 * specific people on the project. The 9 catalog kinds use the same
 * `deliverables` table + `deliverable_state` lifecycle as project-
 * document deliverables (riders, plans, lists). Assignment is the new
 * `assignee_id` column from migration 0049.
 *
 * Per-individual rows show up in:
 *   - GVTEWAY portal: /p/[slug]/crew/advances (project-scoped)
 *   - COMPVSS field: /m/advances (cross-project)
 *
 * Authoring lives here; create form lives at ./new.
 */

type AssignmentRow = {
  id: string;
  type: string;
  title: string | null;
  deliverable_state: string;
  deadline: string | null;
  assignee_id: string | null;
  updated_at: string;
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

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Advancing" title="Individual Assignments" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const { data } = await supabase
    .from("deliverables")
    .select("id, type, title, deliverable_state, deadline, assignee_id, updated_at")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .in("type", CATALOG_KINDS)
    .is("deleted_at", null)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(500);
  const rows = (data ?? []) as AssignmentRow[];

  // Hydrate assignee names.
  const assigneeIds = Array.from(new Set(rows.map((r) => r.assignee_id).filter((u): u is string => !!u)));
  const userMap = new Map<string, string>();
  if (assigneeIds.length) {
    const { data: users } = await supabase.from("users").select("id, email, name").in("id", assigneeIds);
    for (const u of (users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>) {
      userMap.set(u.id, u.name ?? u.email);
    }
  }

  // Group by kind so admins see the catalog laid out like the field
  // worker will see it.
  const byKind = new Map<string, AssignmentRow[]>();
  for (const r of rows) {
    const list = byKind.get(r.type) ?? [];
    list.push(r);
    byKind.set(r.type, list);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={project.name as string}
        title="Individual Assignments"
        subtitle={`${rows.length} catalog assignment${rows.length === 1 ? "" : "s"} on this project`}
        action={
          <Button href={`/console/projects/${projectId}/advancing/assignments/new`} size="sm">
            + New Assignment
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No Assignments Yet"
            description="Assign catalog items to people on the project — they show up on the assignee's portal and mobile views immediately."
          />
        ) : (
          <div className="space-y-6">
            {CATALOG_KINDS.filter((k) => byKind.has(k)).map((kind) => {
              const items = byKind.get(kind) ?? [];
              return (
                <section key={kind} className="surface p-4">
                  <h2 className="text-sm font-semibold">
                    {KIND_LABEL[kind]} <span className="text-[var(--text-muted)]">· {items.length}</span>
                  </h2>
                  <table className="data-table mt-3 w-full text-sm">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assignee</th>
                        <th>State</th>
                        <th>Due</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <a
                              className="underline-offset-2 hover:underline"
                              href={`/console/projects/${projectId}/advancing/assignments/${r.id}`}
                            >
                              {r.title ?? "Untitled"}
                            </a>
                          </td>
                          <td>
                            {r.assignee_id ? (
                              (userMap.get(r.assignee_id) ?? "Unknown")
                            ) : (
                              <Badge variant="warning">Unassigned</Badge>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={r.deliverable_state} />
                          </td>
                          <td className="font-mono text-xs">{r.deadline ? fmt.date(r.deadline) : "—"}</td>
                          <td className="font-mono text-xs text-[var(--text-muted)]">{fmt.date(r.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
