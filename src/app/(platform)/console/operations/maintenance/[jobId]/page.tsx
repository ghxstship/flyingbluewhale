import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { MaintenanceJob } from "@/lib/supabase/types";
import { completeJob } from "./actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
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
        eyebrow={t("console.operations.maintenance.job.eyebrow", undefined, "Maintenance · Job")}
        title={title}
        action={
          <Button href="/console/operations/maintenance" variant="ghost" size="sm">
            {t("common.back", undefined, "Back")}
          </Button>
        }
      />
      <div className="page-content max-w-2xl space-y-5">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <Badge variant={overdue ? "error" : job.completed_at ? "success" : "info"}>
              {job.completed_at
                ? job.outcome
                  ? t(
                      "console.operations.maintenance.job.status.completedWithOutcome",
                      { outcome: job.outcome },
                      `Completed (${job.outcome})`,
                    )
                  : t("console.operations.maintenance.job.status.completed", undefined, "Completed")
                : overdue
                  ? t("console.operations.maintenance.job.status.overdue", undefined, "Overdue")
                  : t("console.operations.maintenance.job.status.open", undefined, "Open")}
            </Badge>
            <span className="font-mono text-xs text-[var(--text-muted)]">{job.kind}</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {t(
                "console.operations.maintenance.job.targetLabel",
                { target: job.target_kind },
                `target: ${job.target_kind}`,
              )}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.operations.maintenance.job.fields.due", undefined, "Due")}
              </dt>
              <dd className="font-mono">{fmt.dateTime(job.due_at)}</dd>
            </div>
            {job.completed_at && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                  {t("console.operations.maintenance.job.fields.completed", undefined, "Completed")}
                </dt>
                <dd className="font-mono">{fmt.dateTime(job.completed_at)}</dd>
              </div>
            )}
            {job.schedule?.cadence_days && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                  {t("console.operations.maintenance.job.fields.cadence", undefined, "Cadence")}
                </dt>
                <dd className="font-mono">
                  {t(
                    "console.operations.maintenance.job.cadenceValue",
                    { days: job.schedule.cadence_days },
                    `every ${job.schedule.cadence_days}d`,
                  )}
                </dd>
              </div>
            )}
            {job.target_id && (
              <div>
                <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                  {t("console.operations.maintenance.job.fields.targetId", undefined, "Target id")}
                </dt>
                <dd className="font-mono break-all">{job.target_id}</dd>
              </div>
            )}
          </dl>
          {job.notes && (
            <div className="mt-4 text-sm">
              <div className="text-xs tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.operations.maintenance.job.fields.notes", undefined, "Notes")}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        {!job.completed_at && (
          <form action={completeJob.bind(null, jobId)} className="surface space-y-3 p-5">
            <h3 className="text-sm font-semibold">
              {t("console.operations.maintenance.job.complete.heading", undefined, "Complete")}
            </h3>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {t("console.operations.maintenance.job.complete.outcomeLabel", undefined, "Outcome")}
              </label>
              <select name="outcome" defaultValue="pass" className="input-base mt-1.5 w-full" required>
                <option value="pass">
                  {t("console.operations.maintenance.job.complete.outcome.pass", undefined, "Pass")}
                </option>
                <option value="partial">
                  {t(
                    "console.operations.maintenance.job.complete.outcome.partial",
                    undefined,
                    "Partial — follow-up needed",
                  )}
                </option>
                <option value="fail">
                  {t("console.operations.maintenance.job.complete.outcome.fail", undefined, "Fail — action required")}
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {t("console.operations.maintenance.job.complete.notesLabel", undefined, "Notes")}
              </label>
              <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                {t("console.operations.maintenance.job.complete.submit", undefined, "Mark Complete")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
