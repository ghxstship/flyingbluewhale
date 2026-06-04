import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import {
  SITEPLAN_ACCESSIBILITY,
  SITEPLAN_SECURITY_LEVELS,
  SITEPLAN_SENSITIVITY,
  SITEPLAN_SHEET_TYPES,
  SITEPLAN_SHELL_TYPES,
  SITEPLAN_SUSTAINABILITY,
  SITEPLAN_WEATHER_EXPOSURE,
  type SitePlanSheet,
} from "@/lib/siteplan/types";
import { updateSitePlanSheet } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const DISCIPLINES = [
  "site",
  "rigging",
  "power",
  "audio",
  "video",
  "lighting",
  "comms",
  "evacuation",
  "hospitality",
  "accessibility",
  "sustainability",
  "other",
] as const;

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

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data }, { data: projects }, { data: venues }, { data: events }] = await Promise.all([
    supabase
      .from("site_plans")
      .select("*")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("events").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
  ]);

  const sp = data as unknown as SitePlanSheet | null;
  if (!sp) notFound();

  const dims = sp.shell_dimensions;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sitePlans.edit.eyebrow", undefined, "Creative · Site Plans")}
        title={t("console.sitePlans.edit.title", { ref: sp.atom_id ?? sp.code }, `Edit · ${sp.atom_id ?? sp.code}`)}
        subtitle={t("console.sitePlans.edit.subtitle", undefined, "Atom-ID segments are immutable once created.")}
        breadcrumbs={[
          {
            label: t("console.sitePlans.edit.breadcrumbs.sitePlans", undefined, "Site Plans"),
            href: "/console/site-plans",
          },
          { label: sp.atom_id ?? sp.code, href: `/console/site-plans/${sp.id}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={updateSitePlanSheet}
          cancelHref={`/console/site-plans/${sp.id}`}
          submitLabel={t("console.sitePlans.edit.submit", undefined, "Save Sheet")}
          dirtyGuard
        >
          <input type="hidden" name="_updated_at" defaultValue={sp.updated_at} />
          <input type="hidden" name="id" value={sp.id} />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.edit.section.sheet", undefined, "Sheet")}
            </h3>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.sitePlans.edit.field.title", undefined, "Title")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="title" required defaultValue={sp.title} maxLength={200} className={INPUT} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.edit.field.sheetCode", undefined, "Sheet Code")}
                  <span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <input name="code" required defaultValue={sp.code} maxLength={40} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.discipline", undefined, "Discipline")}</span>
                <select name="discipline" required defaultValue={sp.discipline} className={INPUT}>
                  {DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {toTitle(d)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.edit.field.sheetType", undefined, "Sheet Type")}
                  <span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <select name="sheet_type" required defaultValue={sp.sheet_type} className={INPUT}>
                  {SITEPLAN_SHEET_TYPES.map((sheetType) => (
                    <option key={sheetType} value={sheetType}>
                      {sheetType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.edit.field.xpmsClass", undefined, "XPMS Class")}
                  <span className="ms-0.5 text-[var(--color-error)]">*</span>
                </span>
                <select name="primary_class" required defaultValue={String(sp.primary_class ?? 8)} className={INPUT}>
                  {XPMS_CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.tier", undefined, "Tier")}</span>
                <select
                  name="tier_primary"
                  defaultValue={sp.tier_primary != null ? String(sp.tier_primary) : ""}
                  className={INPUT}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6].map((tier) => (
                    <option key={tier} value={tier}>
                      {t("console.sitePlans.edit.tierOption", { tier }, `Tier ${tier}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.edit.section.shell", undefined, "Shell")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.shellType", undefined, "Shell Type")}</span>
                <select name="shell_type" defaultValue={sp.shell_type ?? ""} className={INPUT}>
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
                  {t("console.sitePlans.edit.field.orientationDeg", undefined, "Orientation (°)")}
                </span>
                <input
                  name="orientation_deg"
                  type="number"
                  min={0}
                  max={359}
                  defaultValue={sp.orientation_deg ?? 0}
                  className={INPUT}
                />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.lengthIn", undefined, "Length (in)")}</span>
                <input
                  name="shell_length_in"
                  type="number"
                  min={0}
                  defaultValue={dims?.length_in ?? ""}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.widthIn", undefined, "Width (in)")}</span>
                <input
                  name="shell_width_in"
                  type="number"
                  min={0}
                  defaultValue={dims?.width_in ?? ""}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.heightIn", undefined, "Height (in)")}</span>
                <input
                  name="shell_height_in"
                  type="number"
                  min={0}
                  defaultValue={dims?.height_in ?? ""}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.scale", undefined, "Scale")}</span>
                <input name="scale" maxLength={40} defaultValue={sp.scale ?? ""} className={INPUT} />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.edit.section.crossCuttingTags", undefined, "Cross-Cutting Tags · §11")}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.edit.field.sustainability", undefined, "Sustainability")}
                </span>
                <select name="sustainability_tag" defaultValue={sp.sustainability_tag ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_SUSTAINABILITY.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("console.sitePlans.edit.field.accessibility", undefined, "Accessibility")}
                </span>
                <select name="accessibility_tag" defaultValue={sp.accessibility_tag ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_ACCESSIBILITY.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.weather", undefined, "Weather")}</span>
                <select name="weather_exposure" defaultValue={sp.weather_exposure ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_WEATHER_EXPOSURE.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.security", undefined, "Security")}</span>
                <select name="security_level" defaultValue={sp.security_level ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_SECURITY_LEVELS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.sensitivity", undefined, "Sensitivity")}</span>
                <select name="sensitivity" defaultValue={sp.sensitivity ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {SITEPLAN_SENSITIVITY.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.sitePlans.edit.section.context", undefined, "Context")}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.project", undefined, "Project")}</span>
                <select name="project_id" defaultValue={sp.project_id ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {(projects ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.event", undefined, "Event")}</span>
                <select name="event_id" defaultValue={sp.event_id ?? ""} className={INPUT}>
                  <option value="">—</option>
                  {(events ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>{t("console.sitePlans.edit.field.venue", undefined, "Venue")}</span>
                <select name="venue_id" defaultValue={sp.venue_id ?? ""} className={INPUT}>
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
              <span className={LBL}>{t("console.sitePlans.edit.field.notes", undefined, "Notes")}</span>
              <textarea name="notes" rows={4} defaultValue={sp.notes ?? ""} maxLength={2000} className={INPUT} />
            </label>
          </section>
        </FormShell>
      </div>
    </>
  );
}
