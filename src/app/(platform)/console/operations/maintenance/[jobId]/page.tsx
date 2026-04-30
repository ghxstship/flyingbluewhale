import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { MaintenanceJob } from "@/lib/supabase/types";
import { completeJob } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("maintenance_jobs")
    .select(
      "id, kind, target_kind, target_id, due_at, completed_at, outcome, notes, schedule:schedule_id(name, cadence_days)",
    )
    .eq("org_id", session.orgId)
    .eq("id", jobId)
    .maybeSingle();
  if (!row) notFound();
  type RowShape = Pick<
    MaintenanceJob,
    "id" | "kind" | "target_kind" | "target_id" | "due_at" | "completed_at" | "outcome" | "notes"
  > & {
    schedule: { name: string | null; cadence_days: number | null } | null;
  };
  const job = row as unknown as RowShape;
  const overdue = !job.completed_at && new Date(job.due_at) < new Date();
  const title = job.schedule?.name ?? `${job.kind} (${job.target_kind})`;

  return (
    <>
      <ModuleHeader
        eyebrow="Maintenance · Job"
        title={title}
        action={
          <Button href="/console/operations/maintenance" variant="ghost" size="sm">
            Back
          </Button>
        }
      />
      <div className="page-content max-w-2xl space-y-5">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <Badge variant={overdue ? "error" : job.completed_at ? "success" : "info"}>
              {job.completed_at ? `Completed${job.outcome ? ` (${job.outcome})` : ""}` : overdue ? "Overdue" : "Open"}
            </Badge>
            <span className="font-mono text-xs text-[var(--text-muted)]">{job.kind}</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">target: {job.target_kind}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">Due</dt>
              <dd className="font-mono">{new Date(job.due_at).toLocaleString()}</dd>
            </div>
            {job.completed_at && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">Completed</dt>
                <dd className="font-mono">{new Date(job.completed_at).toLocaleString()}</dd>
              </div>
            )}
            {job.schedule?.cadence_days && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">Cadence</dt>
                <dd className="font-mono">every {job.schedule.cadence_days}d</dd>
              </div>
            )}
            {job.target_id && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">Target id</dt>
                <dd className="font-mono break-all">{job.target_id}</dd>
              </div>
            )}
          </dl>
          {job.notes && (
            <div className="mt-4 text-sm">
              <div className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Notes</div>
              <p className="mt-1 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        {!job.completed_at && (
          <form action={completeJob.bind(null, jobId)} className="surface space-y-3 p-5">
            <h3 className="text-sm font-semibold">Complete</h3>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Outcome</label>
              <select name="outcome" defaultValue="pass" className="input-base mt-1.5 w-full" required>
                <option value="pass">Pass</option>
                <option value="partial">Partial — follow-up needed</option>
                <option value="fail">Fail — action required</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
              <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Mark complete</Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
