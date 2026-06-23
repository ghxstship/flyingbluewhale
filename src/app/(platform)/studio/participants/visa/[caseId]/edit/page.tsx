import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateVisaCase, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("visa_cases", session.orgId, p.caseId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateVisaCase.bind(null, p.caseId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const personName =
    ((row as Record<string, unknown>)["person_name"] as string | undefined) ??
    t("console.participants.visa.edit.fallbackName", undefined, "Visa case");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.visa.edit.eyebrow", undefined, "Visa Case")}
        title={t("console.participants.visa.edit.title", { name: personName }, `Edit ${personName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/participants/visa/${p.caseId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.participants.visa.edit.personName", undefined, "Person Name")}
            name="person_name"
            defaultValue={row.person_name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.participants.visa.edit.nationality", undefined, "Nationality")}
            name="nationality"
            defaultValue={row.nationality ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.participants.visa.edit.passportNo", undefined, "Passport #")}
            name="passport_no"
            defaultValue={row.passport_no ?? ""}
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.participants.visa.edit.case_state", undefined, "Status")}
            </span>
            <select
              name="case_state"
              defaultValue={row.case_state ?? ""}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="pending">{t("console.participants.visa.edit.statusPending", undefined, "pending")}</option>
              <option value="submitted">
                {t("console.participants.visa.edit.statusSubmitted", undefined, "submitted")}
              </option>
              <option value="approved">
                {t("console.participants.visa.edit.statusApproved", undefined, "approved")}
              </option>
              <option value="denied">{t("console.participants.visa.edit.statusDenied", undefined, "denied")}</option>
              <option value="expedited">
                {t("console.participants.visa.edit.statusExpedited", undefined, "expedited")}
              </option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
