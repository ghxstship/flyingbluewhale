import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteSafeguardingReport } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ reportId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.safety.safeguarding.detail.title", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.safeguarding.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("safeguarding_reports", session.orgId, p.reportId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["status"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.safeguarding.detail.eyebrow", undefined, "Record")}
        title={title ?? p.reportId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/safety/safeguarding" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/safety/safeguarding/${p.reportId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteSafeguardingReport.bind(null, p.reportId)}
              confirm={t(
                "console.safety.safeguarding.detail.deleteConfirm",
                undefined,
                "Delete this record? This cannot be undone.",
              )}
            />
          </div>
        }
      />
      <div className="page-content">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(row as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">{k}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
