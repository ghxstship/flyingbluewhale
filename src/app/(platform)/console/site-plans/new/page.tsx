import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { SITEPLAN_SHEET_TYPES, SITEPLAN_SHELL_TYPES } from "@/lib/siteplan/types";
import { PRESETS } from "@/lib/siteplan/presets";
import { getRequestT } from "@/lib/i18n/request";
import { createSitePlanSheet } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const MONO = `${INPUT} font-mono uppercase tracking-wide`;
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const XPMS_CLASSES = [
  { value: 0, label: "0 EXECUTIVE" },
  { value: 1, label: "1 CREATIVE" },
  { value: 2, label: "2 TALENT" },
  { value: 3, label: "3 MARKETING" },
  { value: 4, label: "4 BUILD" },
  { value: 5, label: "5 PRODUCTION" },
  { value: 6, label: "6 OPERATIONS" },
  { value: 7, label: "7 EXPERIENCE" },
  { value: 8, label: "8 HOSPITALITY" },
  { value: 9, label: "9 TECHNOLOGY" },
];

const TIERS = [
  { value: 1, label: "Tier 1 · Heroic" },
  { value: 2, label: "Tier 2 · Flagship" },
  { value: 3, label: "Tier 3 · Signature" },
  { value: 4, label: "Tier 4 · Standard" },
  { value: 5, label: "Tier 5 · Light" },
  { value: 6, label: "Tier 6 · Express" },
];

export default async function Page() {
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: projects }, { data: venues }, { data: events }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("events").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
  ]);

  const currentYear = new Date().getFullYear() % 100;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sitePlans.new.eyebrow", undefined, "Creative · Site Plans")}
        title={t("console.sitePlans.new.title", undefined, "New Sheet")}
        breadcrumbs={[
          { label: t("console.sitePlans.breadcrumb", undefined, "Site Plans"), href: "/console/site-plans" },
          { label: t("console.sitePlans.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={createSitePlanSheet}
          cancelHref="/console/site-plans"
          submitLabel={t("console.sitePlans.new.submit", undefined, "Create Sheet")}
        >
          {/* ATOM-ID SEGMENTS */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.atomId", undefined, "Atom ID")}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  ORG<span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <input name="org_code" required maxLength={4} className={MONO} placeholder="SC" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  EVT<span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <input name="evt_code" required maxLength={5} className={MONO} placeholder="EDCLV" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>YY</span>
                <input
                  name="year"
                  required
                  maxLength={4}
                  className={MONO}
                  defaultValue={String(currentYear).padStart(2, "0")}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  VEN<span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <input name="ven_code" required maxLength={5} className={MONO} placeholder="LVMS" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  ZON<span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <input name="zon_code" required maxLength={8} className={MONO} placeholder="KITPRP" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.seq", undefined, "SEQ")}</span>
                <input name="seq" type="number" min={1} max={999} defaultValue={1} className={INPUT} />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.revision", undefined, "Revision")}</span>
                <input value="A" readOnly className={`${MONO} opacity-60`} />
              </label>
            </div>
          </section>

          {/* STRUCTURAL */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.sheet", undefined, "Sheet")}
            </h3>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.sitePlans.new.label.title", undefined, "Title")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input
                name="title"
                required
                maxLength={200}
                className={INPUT}
                placeholder={t(
                  "console.sitePlans.new.placeholder.title",
                  undefined,
                  "Salvage City — Kitchen Perp Tent",
                )}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.sitePlans.new.label.sheetCode", undefined, "Sheet Code")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="code" required maxLength={40} className={INPUT} placeholder="K-101" />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.new.label.sheetType", undefined, "Sheet Type")}
                  <span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <select name="sheet_type" required defaultValue="floor_plan" className={INPUT}>
                  {SITEPLAN_SHEET_TYPES.map((sheetType) => (
                    <option key={sheetType} value={sheetType}>
                      {sheetType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.new.label.xpmsClass", undefined, "XPMS Class")}
                  <span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <select name="primary_class" required defaultValue="8" className={INPUT}>
                  {XPMS_CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.tier", undefined, "Tier")}</span>
                <select name="tier_primary" defaultValue="" className={INPUT}>
                  <option value="">—</option>
                  {TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* SHELL */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.shell", undefined, "Shell")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.shellType", undefined, "Shell Type")}</span>
                <select name="shell_type" defaultValue="tent" className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_SHELL_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.new.label.orientation", undefined, "Orientation (° true-north)")}
                </span>
                <input name="orientation_deg" type="number" min={0} max={359} defaultValue={0} className={INPUT} />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.lengthIn", undefined, "Length (in)")}</span>
                <input name="shell_length_in" type="number" min={1} className={INPUT} placeholder="480" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.widthIn", undefined, "Width (in)")}</span>
                <input name="shell_width_in" type="number" min={1} className={INPUT} placeholder="120" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.heightIn", undefined, "Height (in)")}</span>
                <input name="shell_height_in" type="number" min={0} className={INPUT} placeholder="120" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.scale", undefined, "Scale")}</span>
                <input name="scale" maxLength={40} className={INPUT} placeholder={`1/4" = 1'-0"`} />
              </label>
            </div>
          </section>

          {/* PRESET */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.preset", undefined, "Preset")}
            </h3>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.sitePlans.new.label.preset", undefined, "Instantiate from preset (optional)")}
              </span>
              <select name="preset_code" defaultValue="" className={INPUT}>
                <option value="">{t("console.sitePlans.new.option.none", undefined, "— None —")}</option>
                {PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} · {p.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* CONTEXT */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.context", undefined, "Context")}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.project", undefined, "Project")}</span>
                <select name="project_id" defaultValue="" className={INPUT}>
                  <option value="">—</option>
                  {(projects ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.event", undefined, "Event")}</span>
                <select name="event_id" defaultValue="" className={INPUT}>
                  <option value="">—</option>
                  {(events ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.new.label.venue", undefined, "Venue")}</span>
                <select name="venue_id" defaultValue="" className={INPUT}>
                  <option value="">—</option>
                  {(venues ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.sitePlans.new.label.notes", undefined, "Notes")}</span>
              <textarea name="notes" rows={3} maxLength={2000} className={INPUT} />
            </label>
          </section>
        </FormShell>
      </div>
    </>
  );
}
