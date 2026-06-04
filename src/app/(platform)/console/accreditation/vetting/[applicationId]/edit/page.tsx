import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateVettingApp, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("accreditations", session.orgId, p.applicationId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateVettingApp.bind(null, p.applicationId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const personName = (row as Record<string, unknown>)["person_name"] as string | undefined;
  const titleText = personName
    ? t("console.accreditation.vetting.edit.titleWithName", { name: personName }, `Edit ${personName}`)
    : t("console.accreditation.vetting.edit.titleFallback", undefined, "Edit Vetting application");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.vetting.edit.eyebrow", undefined, "Vetting Application")}
        title={titleText}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/accreditation/vetting/${p.applicationId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.accreditation.vetting.edit.personName", undefined, "Person Name")}
            name="person_name"
            defaultValue={row.person_name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.accreditation.vetting.edit.email", undefined, "Email")}
            name="person_email"
            type="email"
            defaultValue={row.person_email ?? ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.accreditation.vetting.edit.vettingState", undefined, "Vetting state")}
            </span>
            <select name="vetting" defaultValue={row.vetting ?? ""} required className="input-base focus-ring w-full">
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="clear">clear</option>
              <option value="flagged">flagged</option>
              <option value="failed">failed</option>
            </select>
          </label>
          <Input
            label={t("console.accreditation.vetting.edit.validFrom", undefined, "Valid From")}
            name="valid_from"
            type="date"
            defaultValue={dateOnly(row.valid_from)}
          />
          <Input
            label={t("console.accreditation.vetting.edit.validTo", undefined, "Valid To")}
            name="valid_to"
            type="date"
            defaultValue={dateOnly(row.valid_to)}
          />
        </FormShell>
      </div>
    </>
  );
}
