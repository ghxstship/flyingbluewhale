import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteVolunteer } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ volunteerId: string }> }) {
  const p = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.workforce.volunteers.detail.title", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.volunteers.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("workforce_members", session.orgId, p.volunteerId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["full_name"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.volunteers.detail.eyebrow", undefined, "Record")}
        title={title ?? p.volunteerId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/workforce/volunteers" variant="ghost" size="sm">
              {t("console.workforce.volunteers.detail.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/workforce/volunteers/${p.volunteerId}/edit`} size="sm">
              {t("console.workforce.volunteers.detail.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteVolunteer.bind(null, p.volunteerId)}
              confirm={t(
                "console.workforce.volunteers.detail.deleteConfirm",
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
