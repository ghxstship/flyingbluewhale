export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { GenerateRosButton } from "./GenerateRosButton";

type RosItem = {
  id: string;
  cue_number: string;
  label: string;
  notes: string | null;
  department: string | null;
  starts_at: string | null;
  duration_seconds: number | null;
  sort_order: number;
  source: "manual" | "ai_generated";
};

const DEPT_TONE: Record<string, "info" | "success" | "warning" | "error" | "muted"> = {
  foh: "info",
  boh: "muted",
  talent: "success",
  production: "warning",
  security: "error",
  medical: "error",
  logistics: "muted",
  media: "info",
  sponsor: "success",
  other: "muted",
};

function fmtDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Project" title="Run of show" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use this feature.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: project }, { data: rawItems }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("run_of_show_items")
      .select("id, cue_number, label, notes, department, starts_at, duration_seconds, sort_order, source")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true }),
  ]);

  const items = (rawItems ?? []) as RosItem[];
  const proj = project as { id?: string; name?: string } | null;

  return (
    <>
      <ModuleHeader
        eyebrow={proj?.name ?? "Project"}
        title="Run of show"
        subtitle="AI-generated production cue list. Regenerate at any time to sync with current tasks and events."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: proj?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Run of show" },
        ]}
        action={<GenerateRosButton projectId={projectId} />}
      />
      <div className="page-content">
        {items.length === 0 ? (
          <EmptyState
            title="No cues yet"
            description="Generate a run of show from your project tasks and events using AI, or add cues manually."
            action={<GenerateRosButton projectId={projectId} variant="primary" />}
          />
        ) : (
          <div className="surface overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Cue</th>
                  <th>Label</th>
                  <th className="w-24">Time</th>
                  <th className="w-20">Duration</th>
                  <th className="w-28">Dept</th>
                  <th className="w-24">Source</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-sm tabular-nums">{item.cue_number || "—"}</td>
                    <td>
                      <div className="font-medium">{item.label}</div>
                      {item.notes && (
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">{item.notes}</div>
                      )}
                    </td>
                    <td className="tabular-nums text-sm">{fmtTime(item.starts_at) || "—"}</td>
                    <td className="tabular-nums text-sm">{fmtDuration(item.duration_seconds) || "—"}</td>
                    <td>
                      {item.department ? (
                        <Badge tone={DEPT_TONE[item.department] ?? "muted"}>
                          {item.department.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      {item.source === "ai_generated" ? (
                        <Badge tone="info">AI</Badge>
                      ) : (
                        <Badge tone="muted">Manual</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
