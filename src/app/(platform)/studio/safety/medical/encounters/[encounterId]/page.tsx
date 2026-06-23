import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteEncounter } from "./edit/actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ encounterId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.safety.medical.encounters.detail.title", undefined, "Medical Encounter")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.medical.encounters.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("medical_encounters", session.orgId, p.encounterId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const triage = (fields["triage"] as string | undefined) ?? "encounter";
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.medical.encounters.detail.eyebrow", undefined, "Medical · Encounter")}
        title={triage}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/safety/medical/encounters" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/safety/medical/encounters/${p.encounterId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteEncounter.bind(null, p.encounterId)}
              confirm={t(
                "console.safety.medical.encounters.detail.deleteConfirm",
                undefined,
                "Delete this clinical encounter? This cannot be undone.",
              )}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">{toTitle(k)}</dt>
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
