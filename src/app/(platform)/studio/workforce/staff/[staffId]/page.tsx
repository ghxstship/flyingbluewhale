import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteStaffMember } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ staffId: string }> }) {
  const p = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.workforce.staff.detail.title", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.staff.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("workforce_members", session.orgId, p.staffId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["full_name"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.staff.detail.eyebrow", undefined, "Record")}
        title={title ?? p.staffId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/workforce/staff" variant="ghost" size="sm">
              {t("console.workforce.staff.detail.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/workforce/staff/${p.staffId}/edit`} size="sm">
              {t("console.workforce.staff.detail.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteStaffMember.bind(null, p.staffId)}
              confirm={t(
                "console.workforce.staff.detail.deleteConfirm",
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
