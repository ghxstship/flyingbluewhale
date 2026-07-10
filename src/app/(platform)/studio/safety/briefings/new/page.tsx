import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createBriefing } from "./actions";

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
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.briefings.new.eyebrow", undefined, "Safety")}
        title={t("console.safety.briefings.new.title", undefined, "Schedule Briefing")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createBriefing}
          cancelHref="/studio/safety/briefings"
          submitLabel={t("console.safety.briefings.new.submit", undefined, "Schedule")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.safety.briefings.new.topic", undefined, "Topic")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="topic"
              required
              placeholder={t(
                "console.safety.briefings.new.topicPlaceholder",
                undefined,
                "Heat illness prevention · outdoor build days",
              )}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.safety.briefings.new.project", undefined, "Project")}</span>
            <select name="project_id" className={INPUT}>
              <option value="">—</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.safety.briefings.new.scheduledFor", undefined, "Scheduled for")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input type="datetime-local" name="scheduled_for" required className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.safety.briefings.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={4} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
