import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTransmittal } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transmittals.new.eyebrow", undefined, "Operations")}
        title={t("console.transmittals.new.title", undefined, "New Transmittal")}
        subtitle={t(
          "console.transmittals.new.subtitle",
          undefined,
          "Audit-grade dispatch envelope. Add items + recipients after creation; send when ready to start the read-receipt clock.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createTransmittal}
          cancelHref="/studio/transmittals"
          submitLabel={t("console.transmittals.new.submit", undefined, "Create Transmittal")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.transmittals.new.subject", undefined, "Subject")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="subject"
              required
              placeholder={t(
                "console.transmittals.new.subjectPlaceholder",
                undefined,
                "Issue 100% CD set + spec book Rev 2",
              )}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.transmittals.new.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.transmittals.new.responseDue", undefined, "Response due")}</span>
              <input type="date" name="due_at" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.transmittals.new.bodyMarkdown", undefined, "Body — Markdown")}</span>
            <textarea
              name="body_md"
              rows={6}
              placeholder={t(
                "console.transmittals.new.bodyPlaceholder",
                undefined,
                "Issuing per RFI-0023 resolution and 100% CD milestone. Please acknowledge by close of business Friday.",
              )}
              className={`${INPUT} text-xs`}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
