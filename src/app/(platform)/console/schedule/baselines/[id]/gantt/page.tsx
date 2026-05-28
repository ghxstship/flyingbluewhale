import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import GanttClient from "../gantt-client";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { id } = await params;

  const { data: baseline } = await supabase
    .from("schedule_baselines")
    .select("id, name, baseline_state, project:project_id(id, name)")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!baseline) notFound();
  type Baseline = {
    id: string;
    name: string;
    baseline_state: string;
    project: { id: string; name: string | null } | null;
  };
  const b = baseline as unknown as Baseline;

  const [{ data: activities }, { data: deps }] = await Promise.all([
    supabase
      .from("schedule_activities")
      .select(
        "id, code, name, start_planned, finish_planned, duration_days, total_float_days, is_critical, percent_complete",
      )
      .eq("baseline_id", id)
      .eq("org_id", session.orgId)
      .order("start_planned", { ascending: true }),
    supabase
      .from("schedule_activity_dependencies")
      .select("predecessor_id, successor_id, dep_type, lag_days")
      .eq("baseline_id", id)
      .eq("org_id", session.orgId),
  ]);

  type Activity = {
    id: string;
    code: string;
    name: string;
    start_planned: string;
    finish_planned: string;
    duration_days: number;
    total_float_days: number | null;
    is_critical: boolean;
    percent_complete: number;
  };
  type Dependency = {
    predecessor_id: string;
    successor_id: string;
    dep_type: "fs" | "ss" | "ff" | "sf";
    lag_days: number;
  };
  const a = (activities ?? []) as unknown as Activity[];
  const d = (deps ?? []) as unknown as Dependency[];
  const criticalCount = a.filter((x) => x.is_critical).length;

  return (
    <>
      <ModuleHeader
        eyebrow={`Schedule · ${b.project?.name ?? "Project"}`}
        title={`${b.name} · Gantt`}
        subtitle={`${a.length} activities · ${criticalCount} on critical path · ${d.length} dependencies`}
        action={
          <Button href={`/console/schedule/baselines/${b.id}`} size="sm" variant="ghost">
            ← Back to Baseline
          </Button>
        }
      />
      <div className="page-content space-y-3">
        {a.length > 0 ? (
          <GanttClient activities={a} dependencies={d} />
        ) : (
          <EmptyState
            size="compact"
            title="No activities yet"
            description="Import a P6, MSP, or Asta file to populate the schedule."
          />
        )}
      </div>
    </>
  );
}
