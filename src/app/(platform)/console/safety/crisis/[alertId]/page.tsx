import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteAlert } from "./edit/actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.safety.crisis.detail.title", undefined, "Crisis Alert")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.crisis.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("crisis_alerts", session.orgId, p.alertId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["title"] as string | undefined) ?? p.alertId;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.crisis.detail.eyebrow", undefined, "Safety · Crisis")}
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/safety/crisis" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/safety/crisis/${p.alertId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteAlert.bind(null, p.alertId)}
              confirm={t(
                "console.safety.crisis.detail.deleteConfirm",
                { title },
                `Delete crisis alert "${title}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{toTitle(k)}</dt>
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
