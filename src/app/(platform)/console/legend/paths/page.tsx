import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Path = {
  id: string;
  name: string;
  description: string | null;
  target_role: string | null;
  estimated_hours: number | null;
  is_required: boolean;
  created_at: string;
  step_count: number;
  enrollment_count: number;
};

export default async function TrainingPathsPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Training Paths" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use Training Paths.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: paths } = await supabase
    .from("training_paths")
    .select("id, name, description, target_role, estimated_hours, is_required, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const pathList = (paths ?? []) as Array<{
    id: string;
    name: string;
    description: string | null;
    target_role: string | null;
    estimated_hours: number | null;
    is_required: boolean;
    created_at: string;
  }>;

  const pathIds = pathList.map((p) => p.id);
  const [{ data: steps }, { data: enrollments }] =
    pathIds.length > 0
      ? await Promise.all([
          supabase.from("training_path_steps").select("path_id").in("path_id", pathIds),
          supabase
            .from("training_path_enrollments")
            .select("path_id")
            .in("path_id", pathIds)
            .eq("org_id", session.orgId),
        ])
      : [{ data: [] }, { data: [] }];

  const stepCounts = new Map<string, number>();
  for (const s of steps ?? []) {
    const raw = s as { path_id: string };
    stepCounts.set(raw.path_id, (stepCounts.get(raw.path_id) ?? 0) + 1);
  }
  const enrollmentCounts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    const raw = e as { path_id: string };
    enrollmentCounts.set(raw.path_id, (enrollmentCounts.get(raw.path_id) ?? 0) + 1);
  }

  const rows: Path[] = pathList.map((p) => ({
    ...p,
    step_count: stepCounts.get(p.id) ?? 0,
    enrollment_count: enrollmentCounts.get(p.id) ?? 0,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Training Paths"
        subtitle={`${rows.length} path${rows.length === 1 ? "" : "s"} · structured learning sequences for your team`}
        action={
          <Button href="/console/legend/paths/new" size="sm">
            + New Path
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={32} />}
            title="No training paths yet"
            description="Create a training path to sequence courses, resources, and quizzes into a structured learning track."
            action={<Button href="/console/legend/paths/new">Create a training path</Button>}
          />
        ) : (
          <div className="section-grid">
            {rows.map((path) => (
              <Link key={path.id} href={`/console/legend/paths/${path.id}`} className="surface hover-lift block p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="ps-h text-base">{path.name}</div>
                  <div className="flex shrink-0 gap-1.5">
                    {path.is_required && <Badge variant="warning">Required</Badge>}
                    {path.target_role && <Badge variant="muted">{path.target_role}</Badge>}
                  </div>
                </div>
                {path.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--p-text-2)]">{path.description}</p>
                )}
                <div className="mt-3 flex gap-4 text-xs text-[var(--p-text-2)]">
                  <span>{path.step_count} step{path.step_count === 1 ? "" : "s"}</span>
                  <span>{path.enrollment_count} enrolled</span>
                  {path.estimated_hours != null && <span>{path.estimated_hours}h estimated</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
