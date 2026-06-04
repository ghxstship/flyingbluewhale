import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteDelegation } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ delegationId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.participants.delegations.detail.recordTitle", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.participants.delegations.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("delegations", session.orgId, p.delegationId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["name"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.delegations.detail.recordEyebrow", undefined, "Record")}
        title={title ?? p.delegationId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/participants/delegations" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/participants/delegations/${p.delegationId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteDelegation.bind(null, p.delegationId)}
              confirm={t(
                "console.participants.delegations.detail.deleteConfirm",
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
