import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteVolunteer, separateVolunteer, reinstateVolunteer } from "./edit/actions";

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
  // Deskless staff now live in crew_members (the person SSOT) — see ADR-0015
  // Addendum 2. getOrgScoped selects "*", so alias on the way out to keep this
  // surface's field names unchanged.
  const dbRow = await getOrgScoped("crew_members", session.orgId, p.volunteerId);
  if (!dbRow) notFound();
  const { name, workforce_kind, ...restRow } = dbRow;
  const row = { ...restRow, full_name: name, kind: workforce_kind };
  const title = (row as Record<string, unknown>)["full_name"] as string | undefined;
  const engagementState = (row as Record<string, unknown>)["engagement_state"] as string | undefined;
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
            {/* Separation is the offboarding mirror of onboarding — it PRESERVES
                the record (with the date + reason) so history survives and
                re-engagement is a state flip. Delete stays for genuine mistakes,
                and is refused by the database for anyone who has any. */}
            {engagementState === "separated" ? (
              <form action={reinstateVolunteer.bind(null, p.volunteerId)}>
                <Button type="submit" size="sm" variant="secondary">
                  Reinstate
                </Button>
              </form>
            ) : (
              <DeleteForm
                action={separateVolunteer.bind(null, p.volunteerId, undefined)}
                label="Separate"
                confirm="Separate this person? Their record and history are kept; they can be reinstated later."
              />
            )}
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
