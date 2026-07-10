export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ImportForm } from "./ImportForm";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

/**
 * Import Centre — Opportunity #7 UI surface.
 * Three targets shipped: crew roster, vendors, project tasks.
 */

export default async function ImportsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.imports.eyebrow", undefined, "Settings")}
          title={t("console.settings.imports.title", undefined, "Imports")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.imports.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data: runs } = await supabase
    .from("import_runs")
    .select("id, kind, source, filename, rows_total, rows_imported, rows_failed, run_state, error, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.imports.eyebrow", undefined, "Settings")}
        title={t("console.settings.imports.workspaceSettings", undefined, "Workspace Settings")}
        subtitle={t("console.settings.imports.title", undefined, "Imports")}
        action={
          <Link
            href="/studio/import"
            className="hover-lift surface inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            {t("console.settings.imports.viewHistory", undefined, "View import history")}
          </Link>
        }
      />
      <div className="page-content max-w-4xl space-y-6">
        <section className="surface p-5">
          <ImportForm />
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
            {t("console.settings.imports.recentRuns", undefined, "Recent runs")}
          </h3>
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.imports.col.kind", undefined, "Kind")}</th>
                  <th>{t("console.settings.imports.col.source", undefined, "Source")}</th>
                  <th>{t("console.settings.imports.col.imported", undefined, "Imported")}</th>
                  <th>{t("console.settings.imports.col.failed", undefined, "Failed")}</th>
                  <th>{t("console.settings.imports.col.run_state", undefined, "Status")}</th>
                  <th>{t("console.settings.imports.col.started", undefined, "Started")}</th>
                </tr>
              </thead>
              <tbody>
                {(runs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[var(--p-text-2)]">
                      {t("console.settings.imports.empty", undefined, "No imports yet.")}
                    </td>
                  </tr>
                ) : (
                  (runs ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs">{toTitle(r.kind)}</td>
                      <td className="text-xs text-[var(--p-text-2)]">{r.filename ?? r.source}</td>
                      <td className="font-mono text-xs">{r.rows_imported}</td>
                      <td className="font-mono text-xs">{r.rows_failed}</td>
                      <td>
                        <Badge
                          variant={
                            r.run_state === "succeeded" ? "success" : r.run_state === "failed" ? "error" : "muted"
                          }
                        >
                          {r.run_state}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">{fmt.dateTime(r.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5 text-sm text-[var(--p-text-2)]">
          <h3 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.settings.imports.columnReference", undefined, "Column Reference")}
          </h3>
          <p>
            <strong>crew-members:</strong>{" "}
            {t(
              "console.settings.imports.ref.crewMembers",
              undefined,
              "name (required), role, phone, email, day_rate_cents, notes",
            )}
          </p>
          <p>
            <strong>tasks:</strong>{" "}
            {t(
              "console.settings.imports.ref.tasks",
              undefined,
              "title (required), description, status (todo|in_progress|review|blocked|done), priority (0-5), due_at (ISO)",
            )}
          </p>
          <p>
            <strong>vendors:</strong>{" "}
            {t(
              "console.settings.imports.ref.vendors",
              undefined,
              "name (required), contact_email, contact_phone, category, notes",
            )}
          </p>
        </section>
      </div>
    </>
  );
}
