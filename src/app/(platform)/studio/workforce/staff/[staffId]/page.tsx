import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteStaffMember, separateStaffMember, reinstateStaffMember } from "./edit/actions";

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
  // Deskless staff now live in crew_members (the person SSOT) — see ADR-0015
  // Addendum 2. getOrgScoped selects "*", so alias on the way out to keep this
  // surface's field names unchanged.
  const dbRow = await getOrgScoped("crew_members", session.orgId, p.staffId);
  if (!dbRow) notFound();
  const { name, workforce_kind, ...restRow } = dbRow;
  const row = { ...restRow, full_name: name, kind: workforce_kind };
  const title = (row as Record<string, unknown>)["full_name"] as string | undefined;
  const engagementState = (row as Record<string, unknown>)["engagement_state"] as string | undefined;
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
            {/* Separation is the offboarding mirror of onboarding — it PRESERVES
                the record (with the date + reason) so history survives and
                re-engagement is a state flip. Delete stays for genuine mistakes. */}
            {engagementState === "separated" ? (
              <form action={reinstateStaffMember.bind(null, p.staffId)}>
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.workforce.staff.detail.reinstate", undefined, "Reinstate")}
                </Button>
              </form>
            ) : (
              <DeleteForm
                action={separateStaffMember.bind(null, p.staffId, undefined)}
                label={t("console.workforce.staff.detail.separate", undefined, "Separate")}
                confirm={t(
                  "console.workforce.staff.detail.separateConfirm",
                  undefined,
                  "Separate this person? Their record and history are kept; they can be reinstated later.",
                )}
              />
            )}
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
