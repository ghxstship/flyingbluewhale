import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listImportJobs } from "@/lib/db/import-jobs";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IMPORT_RESOURCE_LABEL, type ImportJob } from "@/lib/import/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { ImportJobsPoller } from "./JobsPoller";

/**
 * Import Center — Phase 6.4 of the SmartSuite parity roadmap.
 *
 * Unified observability surface that lists recent import jobs + state. The
 * upload + run flow lives at /studio/settings/imports (the canonical CSV
 * importer wired to /api/v1/import/*). While any job is in-flight the
 * <ImportJobsPoller> island auto-refreshes the page, so progress advances
 * without a manual reload. A failed job fetch renders an explicit error —
 * never the "no imports yet" empty state.
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
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!session.orgId) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <EmptyState
          title={t("console.import.noOrg.title", undefined, "No organization")}
          description={t("console.import.noOrg.description", undefined, "Switch to an org to view import jobs.")}
        />
      </main>
    );
  }

  let jobs: ImportJob[] = [];
  let loadFailed = false;
  try {
    jobs = await listImportJobs({ orgId: session.orgId });
  } catch {
    // Distinguish "couldn't load" from "no imports yet" — rendering a fetch
    // failure as the empty state hid outages behind onboarding copy.
    loadFailed = true;
  }
  const hasActiveJobs = jobs.some((j) => j.state === "pending" || j.state === "parsing" || j.state === "inserting");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
              {t("console.import.eyebrow", undefined, "Import")}
            </div>
            <h1 className="mt-2">{t("console.import.title", undefined, "IMPORT CENTER")}</h1>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t(
                "console.import.description",
                undefined,
                "Bulk-load crew, tasks, vendors, and projects from CSV. Async. Close the tab and the import keeps running.",
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/studio/settings/imports"
              className="hover-lift surface inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              {t("console.import.newImport", undefined, "New Import")}
            </Link>
          </div>
        </div>
      </header>

      {hasActiveJobs && <ImportJobsPoller />}

      {loadFailed ? (
        <Alert kind="error">
          {t(
            "console.import.loadFailed",
            undefined,
            "Could not load import jobs. This is a loading problem, not an empty history. Refresh the page to retry.",
          )}
        </Alert>
      ) : jobs.length === 0 ? (
        <EmptyState
          title={t("console.import.empty.title", undefined, "No imports yet")}
          description={t(
            "console.import.empty.description",
            undefined,
            "Click an import button above to get started. Each import runs async and you'll see it here with row-level progress.",
          )}
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
                    subtitle={fmt.dateTime(new Date(j.createdAt))}
                    action={<Badge variant={STATE_TONE[j.state] ?? "muted"}>{j.state.toUpperCase()}</Badge>}
                  />
                  <CardBody>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[var(--p-text-2)]">
                          {t("console.import.stats.total", undefined, "Total")}
                        </div>
                        <div className="text-lg font-semibold tabular-nums">{j.rowsTotal}</div>
                      </div>
                      <div>
                        <div className="text-[var(--p-text-2)]">
                          {t("console.import.stats.succeeded", undefined, "Succeeded")}
                        </div>
                        <div className="text-lg font-semibold text-[var(--p-success)] tabular-nums">
                          {j.rowsSucceeded}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--p-text-2)]">
                          {t("console.import.stats.failed", undefined, "Failed")}
                        </div>
                        <div className="text-lg font-semibold text-[var(--p-danger)] tabular-nums">{j.rowsFailed}</div>
                      </div>
                    </div>
                    {(j.state === "parsing" || j.state === "inserting") && (
                      <div className="mt-3">
                        <ProgressBar value={pct} />
                      </div>
                    )}
                    {j.summary ? <p className="mt-3 text-sm text-[var(--p-text-2)]">{j.summary}</p> : null}
                    {j.errors.length > 0 ? (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-[var(--p-text-2)]">
                          {j.errors.length === 1
                            ? t(
                                "console.import.errors.summaryOne",
                                { count: j.errors.length },
                                `${j.errors.length} error · show details`,
                              )
                            : t(
                                "console.import.errors.summaryOther",
                                { count: j.errors.length },
                                `${j.errors.length} errors · show details`,
                              )}
                        </summary>
                        <ul className="mt-2 space-y-1 font-mono text-[11px]">
                          {j.errors.slice(0, 20).map((e, i) => (
                            <li key={i}>
                              {t("console.import.errors.rowPrefix", { row: e.row }, `Row ${e.row}`)}: {e.message}
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
