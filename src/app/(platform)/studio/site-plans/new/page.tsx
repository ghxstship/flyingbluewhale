import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { SITEPLAN_SHEET_TYPES, SITEPLAN_SHELL_TYPES } from "@/lib/siteplan/types";
import { PRESETS } from "@/lib/siteplan/presets";
import { getRequestT } from "@/lib/i18n/request";
import { createSitePlanSheet } from "./actions";

export const dynamic = "force-dynamic";

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
          { label: t("console.sitePlans.breadcrumb", undefined, "Site Plans"), href: "/studio/site-plans" },
          { label: t("console.sitePlans.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={createSitePlanSheet}
          cancelHref="/studio/site-plans"
          submitLabel={t("console.sitePlans.new.submit", undefined, "Create Sheet")}
        >
          {/* ATOM-ID SEGMENTS */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.atomId", undefined, "Atom ID")}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <FormField label="ORG" required>
                <input
                  name="org_code"
                  required
                  maxLength={4}
                  className="ps-input font-mono tracking-wide uppercase"
                  placeholder="SC"
                />
              </FormField>
              <FormField label="EVT" required>
                <input
                  name="evt_code"
                  required
                  maxLength={5}
                  className="ps-input font-mono tracking-wide uppercase"
                  placeholder="EDCLV"
                />
              </FormField>
              <FormField label="YY">
                <input
                  name="year"
                  required
                  maxLength={4}
                  className="ps-input font-mono tracking-wide uppercase"
                  defaultValue={String(currentYear).padStart(2, "0")}
                />
              </FormField>
              <FormField label="VEN" required>
                <input
                  name="ven_code"
                  required
                  maxLength={5}
                  className="ps-input font-mono tracking-wide uppercase"
                  placeholder="LVMS"
                />
              </FormField>
              <FormField label="ZON" required>
                <input
                  name="zon_code"
                  required
                  maxLength={8}
                  className="ps-input font-mono tracking-wide uppercase"
                  placeholder="KITPRP"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label={t("console.sitePlans.new.label.seq", undefined, "SEQ")}>
                <input name="seq" type="number" min={1} max={999} defaultValue={1} className="ps-input" />
              </FormField>
              <FormField
                label={t("console.sitePlans.new.label.revision", undefined, "Revision")}
                className="col-span-2"
              >
                <input value="A" readOnly className="ps-input font-mono tracking-wide uppercase opacity-60" />
              </FormField>
            </div>
          </section>

          {/* STRUCTURAL */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.sheet", undefined, "Sheet")}
            </h3>
            <FormField label={t("console.sitePlans.new.label.title", undefined, "Title")} required>
              <input
                name="title"
                required
                maxLength={200}
                className="ps-input"
                placeholder={t(
                  "console.sitePlans.new.placeholder.title",
                  undefined,
                  "Salvage City · Kitchen Perp Tent",
                )}
              />
            </FormField>
            <FormField label={t("console.sitePlans.new.label.sheetCode", undefined, "Sheet Code")} required>
              <input name="code" required maxLength={40} className="ps-input" placeholder="K-101" />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label={t("console.sitePlans.new.label.sheetType", undefined, "Sheet Type")} required>
                <select name="sheet_type" required defaultValue="floor_plan" className="ps-input">
                  {SITEPLAN_SHEET_TYPES.map((sheetType) => (
                    <option key={sheetType} value={sheetType}>
                      {sheetType}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("console.sitePlans.new.label.xpmsClass", undefined, "XPMS Class")} required>
                <select name="primary_class" required defaultValue="8" className="ps-input">
                  {XPMS_CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("console.sitePlans.new.label.tier", undefined, "Tier")}>
                <select name="tier_primary" defaultValue="" className="ps-input">
                  <option value="">—</option>
                  {TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </section>

          {/* SHELL */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.shell", undefined, "Shell")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t("console.sitePlans.new.label.shellType", undefined, "Shell Type")}>
                <select name="shell_type" defaultValue="tent" className="ps-input">
                  <option value="">—</option>
                  {SITEPLAN_SHELL_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("console.sitePlans.new.label.orientation", undefined, "Orientation (° true-north)")}>
                <input name="orientation_deg" type="number" min={0} max={359} defaultValue={0} className="ps-input" />
              </FormField>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <FormField label={t("console.sitePlans.new.label.lengthIn", undefined, "Length (in)")}>
                <input name="shell_length_in" type="number" min={1} className="ps-input" placeholder="480" />
              </FormField>
              <FormField label={t("console.sitePlans.new.label.widthIn", undefined, "Width (in)")}>
                <input name="shell_width_in" type="number" min={1} className="ps-input" placeholder="120" />
              </FormField>
              <FormField label={t("console.sitePlans.new.label.heightIn", undefined, "Height (in)")}>
                <input name="shell_height_in" type="number" min={0} className="ps-input" placeholder="120" />
              </FormField>
              <FormField label={t("console.sitePlans.new.label.scale", undefined, "Scale")}>
                <input name="scale" maxLength={40} className="ps-input" placeholder={`1/4" = 1'-0"`} />
              </FormField>
            </div>
          </section>

          {/* PRESET */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.preset", undefined, "Preset")}
            </h3>
            <FormField label={t("console.sitePlans.new.label.preset", undefined, "Instantiate from Preset · Optional")}>
              <select name="preset_code" defaultValue="" className="ps-input">
                <option value="">{t("console.sitePlans.new.option.none", undefined, "None")}</option>
                {PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} · {p.label}
                  </option>
                ))}
              </select>
            </FormField>
          </section>

          {/* CONTEXT */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.new.section.context", undefined, "Context")}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label={t("console.sitePlans.new.label.project", undefined, "Project")}>
                <select name="project_id" defaultValue="" className="ps-input">
                  <option value="">—</option>
                  {(projects ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("console.sitePlans.new.label.event", undefined, "Event")}>
                <select name="event_id" defaultValue="" className="ps-input">
                  <option value="">—</option>
                  {(events ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("console.sitePlans.new.label.venue", undefined, "Venue")}>
                <select name="venue_id" defaultValue="" className="ps-input">
                  <option value="">—</option>
                  {(venues ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label={t("console.sitePlans.new.label.notes", undefined, "Notes")}>
              <textarea name="notes" rows={3} maxLength={2000} className="ps-input" />
            </FormField>
          </section>
        </FormShell>
      </div>
    </>
  );
}
