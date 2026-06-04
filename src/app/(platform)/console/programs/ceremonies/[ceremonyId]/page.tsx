import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteCeremony } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ ceremonyId: string }> }) {
  const p = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.programs.ceremonies.detail.title", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.ceremonies.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("events", session.orgId, p.ceremonyId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["name"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.ceremonies.detail.eyebrow", undefined, "Record")}
        title={title ?? p.ceremonyId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/programs/ceremonies" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/programs/ceremonies/${p.ceremonyId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteCeremony.bind(null, p.ceremonyId)}
              confirm={t(
                "console.programs.ceremonies.detail.deleteConfirm",
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
