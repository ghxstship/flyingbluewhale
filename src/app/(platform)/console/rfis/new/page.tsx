import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { createRfi } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: projects }, { data: users }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.rfis.new.eyebrow", undefined, "Operations")}
        title={t("console.rfis.new.title", undefined, "New RFI")}
        subtitle={t("console.rfis.new.subtitle", undefined, "Ask the production team an official question.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createRfi}
          cancelHref="/console/rfis"
          submitLabel={t("console.rfis.new.submit", undefined, "Open RFI")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.rfis.new.subjectLabel", undefined, "Subject")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="subject"
              required
              placeholder={t(
                "console.rfis.new.subjectPlaceholder",
                undefined,
                "Confirm rigging point load capacity at downstage left",
              )}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.rfis.new.questionLabel", undefined, "Question")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <textarea name="question" rows={4} required className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.rfis.new.projectLabel", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectEllipsis", undefined, "Select…")}</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.new.categoryLabel", undefined, "Category")}</span>
              <input
                name="category"
                placeholder={t("console.rfis.new.categoryPlaceholder", undefined, "rigging / power / brand / catering")}
                className={INPUT}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.new.ballInCourtLabel", undefined, "Ball in court")}</span>
              <select name="ball_in_court_id" className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.new.priorityLabel", undefined, "Priority")}</span>
              <select name="priority" className={INPUT} defaultValue="normal">
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {toTitle(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.rfis.new.dueByLabel", undefined, "Due by")}</span>
            <input type="date" name="due_at" className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
