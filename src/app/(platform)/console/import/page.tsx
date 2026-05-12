import { formatDateTime } from "@/lib/i18n/format";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listImportJobs } from "@/lib/db/import-jobs";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IMPORT_RESOURCE_LABEL, type ImportJob } from "@/lib/import/types";

/**
 * Import Center — Phase 6.4 of the SmartSuite parity roadmap.
 *
 * Unified observability surface that lists recent import jobs + state. The
 * upload + run flow lives at /console/settings/imports (the canonical CSV
 * importer wired to /api/v1/import/*). Polling auto-refresh on in-flight
 * jobs is a polish pass; for now this is server-rendered and the user
 * manually refreshes.
 */

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, "info" | "success" | "warning" | "error" | "muted"> = {
  pending: "muted",
  parsing: "info",
  inserting: "info",
  success: "success",
  failed: "error",
  cancelled: "warning",
};

export default async function ImportPage() {
  const session = await requireSession();
  if (!session.orgId) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <EmptyState title="No organization" description="Switch to an org to view import jobs." />
      </main>
    );
  }

  let jobs: ImportJob[];
  try {
    jobs = await listImportJobs({ orgId: session.orgId });
  } catch {
    jobs = [];
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Import</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">IMPORT CENTER</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Bulk-load crew, tasks, vendors, and projects from CSV. Async — close the tab and the import keeps running.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/console/settings/imports"
              className="hover-lift surface inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              New Import
            </Link>
          </div>
        </div>
      </header>

      {jobs.length === 0 ? (
        <EmptyState
          title="No imports yet"
          description="Click an import button above to get started. Each import runs async and you'll see it here with row-level progress."
        />
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => {
            const total = j.rowsTotal || 1;
            const pct = Math.round(((j.rowsSucceeded + j.rowsFailed) / total) * 100);
            return (
              <li key={j.id}>
                <Card>
                  <CardHeader
                    title={`${IMPORT_RESOURCE_LABEL[j.resource] ?? j.resource} · ${j.sourceLabel ?? j.source}`}
                    subtitle={formatDateTime(j.createdAt)}
                    action={<Badge variant={STATE_TONE[j.state] ?? "muted"}>{j.state.toUpperCase()}</Badge>}
                  />
                  <CardBody>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[var(--text-muted)]">Total</div>
                        <div className="text-lg font-semibold tabular-nums">{j.rowsTotal}</div>
                      </div>
                      <div>
                        <div className="text-[var(--text-muted)]">Succeeded</div>
                        <div className="text-lg font-semibold text-[var(--color-success)] tabular-nums">
                          {j.rowsSucceeded}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-muted)]">Failed</div>
                        <div className="text-lg font-semibold text-[var(--color-error)] tabular-nums">
                          {j.rowsFailed}
                        </div>
                      </div>
                    </div>
                    {(j.state === "parsing" || j.state === "inserting") && (
                      <div className="mt-3">
                        <ProgressBar value={pct} />
                      </div>
                    )}
                    {j.summary ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{j.summary}</p> : null}
                    {j.errors.length > 0 ? (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-[var(--text-muted)]">
                          {j.errors.length} error{j.errors.length === 1 ? "" : "s"} — show details
                        </summary>
                        <ul className="mt-2 space-y-1 font-mono text-[11px]">
                          {j.errors.slice(0, 20).map((e, i) => (
                            <li key={i}>
                              Row {e.row}: {e.message}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
