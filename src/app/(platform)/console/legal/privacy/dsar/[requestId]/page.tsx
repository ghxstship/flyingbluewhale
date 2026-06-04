import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteDsarRequest } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.legal.privacy.dsar.detail.recordTitle", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.privacy.dsar.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("dsar_requests", session.orgId, p.requestId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["requester_email"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.dsar.detail.eyebrow", undefined, "Record")}
        title={title ?? p.requestId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/legal/privacy/dsar" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/legal/privacy/dsar/${p.requestId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteDsarRequest.bind(null, p.requestId)}
              confirm={t(
                "console.legal.privacy.dsar.detail.deleteConfirm",
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
