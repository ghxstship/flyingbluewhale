import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { createSubmittal } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: projects }, { data: vendors }, { data: users }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.submittals.new.eyebrow", undefined, "Procurement")}
        title={t("console.submittals.new.title", undefined, "New Submittal")}
        subtitle={t("console.submittals.new.subtitle", undefined, "Create the register entry.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createSubmittal}
          cancelHref="/console/submittals"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.submittals.new.fields.title", undefined, "Title")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder={t(
                "console.submittals.new.fields.titlePlaceholder",
                undefined,
                "LED wall — vendor cut sheets",
              )}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.submittals.new.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.new.fields.specSection", undefined, "Spec Section")}</span>
              <select name="spec_section" className={INPUT}>
                <option value="">—</option>
                {[
                  "rigging",
                  "power",
                  "sfx",
                  "audio",
                  "video",
                  "lighting",
                  "staging",
                  "catering",
                  "networking",
                  "fabrication",
                  "other",
                ].map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.new.fields.vendor", undefined, "Vendor")}</span>
              <select name="vendor_id" className={INPUT}>
                <option value="">—</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.new.fields.ballInCourt", undefined, "Ball In Court")}</span>
              <select name="ball_in_court_id" className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.submittals.new.fields.dueBy", undefined, "Due By")}</span>
            <input type="date" name="due_at" className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
