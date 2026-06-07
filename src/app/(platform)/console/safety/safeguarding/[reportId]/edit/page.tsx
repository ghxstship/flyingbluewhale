import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateSafeguardingReport, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ reportId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("safeguarding_reports", session.orgId, p.reportId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateSafeguardingReport.bind(null, p.reportId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const subjectRef =
    ((row as Record<string, unknown>)["subject_ref"] as string | undefined) ??
    t("console.safety.safeguarding.edit.fallbackSubject", undefined, "Safeguarding report");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.safeguarding.edit.eyebrow", undefined, "Safeguarding Report")}
        title={t("console.safety.safeguarding.edit.title", { subject: subjectRef }, `Edit ${subjectRef}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/safety/safeguarding/${p.reportId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.safeguarding.edit.narrative", undefined, "Narrative")}
            </span>
            <textarea
              name="narrative"
              defaultValue={row.narrative ?? ""}
              rows={8}
              required
              className="ps-input focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.safety.safeguarding.edit.subjectReference", undefined, "Subject Reference")}
            name="subject_ref"
            defaultValue={row.subject_ref ?? ""}
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.safeguarding.edit.status", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="ps-input focus-ring w-full">
              <option value="new">new</option>
              <option value="triage">triage</option>
              <option value="investigating">investigating</option>
              <option value="referred">referred</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
