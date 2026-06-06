import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createMeeting } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

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
        eyebrow={t("console.meetings.new.eyebrow", undefined, "Coordination")}
        title={t("console.meetings.new.title", undefined, "New Meeting")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createMeeting}
          cancelHref="/console/meetings"
          submitLabel={t("console.meetings.new.submit", undefined, "Schedule Meeting")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.meetings.new.fields.title", undefined, "Title")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder={t("console.meetings.new.placeholders.title", undefined, "OAC Weekly #14")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.meetings.new.fields.project", undefined, "Project")}</span>
              <select name="project_id" className={INPUT}>
                <option value="">—</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.meetings.new.fields.kind", undefined, "Kind")}</span>
              <select name="kind" className={INPUT} defaultValue="other">
                <option value="kickoff">{t("console.meetings.new.kinds.kickoff", undefined, "Kickoff")}</option>
                <option value="owner_architect_contractor">
                  {t("console.meetings.new.kinds.oac", undefined, "Owner-Architect-Contractor — OAC")}
                </option>
                <option value="sub_meeting">
                  {t("console.meetings.new.kinds.subMeeting", undefined, "Sub Meeting")}
                </option>
                <option value="safety">{t("console.meetings.new.kinds.safety", undefined, "Safety")}</option>
                <option value="punch_walk">{t("console.meetings.new.kinds.punchWalk", undefined, "Punch Walk")}</option>
                <option value="design_review">
                  {t("console.meetings.new.kinds.designReview", undefined, "Design Review")}
                </option>
                <option value="progress">{t("console.meetings.new.kinds.progress", undefined, "Progress")}</option>
                <option value="other">{t("console.meetings.new.kinds.other", undefined, "Other")}</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.meetings.new.fields.startsAt", undefined, "Starts at")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="datetime-local" name="starts_at" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.meetings.new.fields.endsAt", undefined, "Ends at")}</span>
              <input type="datetime-local" name="ends_at" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.meetings.new.fields.location", undefined, "Location")}</span>
              <input
                name="location_name"
                placeholder={t("console.meetings.new.placeholders.location", undefined, "Site office, Zoom, etc.")}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.meetings.new.fields.meetingUrl", undefined, "Meeting URL")}</span>
              <input name="meeting_url" placeholder="https://…" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.meetings.new.fields.agenda", undefined, "Agenda — Markdown")}</span>
            <textarea name="agenda_md" rows={5} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
