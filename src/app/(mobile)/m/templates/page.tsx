import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { TemplatesList, type TemplateItem } from "./TemplatesList";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Templates (kit 31, live-test resolution #15) — the universal
 * org + project template library under More · Operations. One library for
 * everything repeatable: rosters, advances, checklists, contracts, task
 * lists, schedules, onboarding packs, budget code sets. Org templates apply
 * to every project; project templates can be promoted up a level.
 *
 * Design truth: runtime/app.jsx `tab === "templates"` (kit 31). Reads the
 * real `field_templates` store — no fabricated library.
 */

const CATEGORY_LABEL: Record<string, string> = {
  roster: "Roster",
  advance: "Advance",
  checklist: "Checklist",
  contract: "Contract",
  task_list: "Task List",
  schedule: "Schedule",
  onboarding: "Onboarding",
  budget: "Budget",
};

const CATEGORY_ICON: Record<string, string> = {
  roster: "Users",
  advance: "ClipboardList",
  checklist: "ClipboardCheck",
  contract: "FileSignature",
  task_list: "ListChecks",
  schedule: "CalendarDays",
  onboarding: "Building2",
  budget: "Banknote",
};

export default async function TemplatesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.templates.eyebrow", undefined, "Library")}</div>
        <h1 className="scr-h">{t("m.templates.title", undefined, "Templates")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: rows }, { data: projects }] = await Promise.all([
    supabase
      .from("field_templates")
      .select("id, project_id, name, category, summary, use_count, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).limit(200),
  ]);

  const projectName = new Map(((projects ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));

  const items: TemplateItem[] = (
    (rows ?? []) as Array<{
      id: string;
      project_id: string | null;
      name: string;
      category: string;
      summary: string | null;
      use_count: number;
      updated_at: string;
    }>
  ).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    categoryLabel: CATEGORY_LABEL[r.category] ?? r.category,
    icon: CATEGORY_ICON[r.category] ?? "LayoutTemplate",
    scope: r.project_id ? ("project" as const) : ("org" as const),
    projectName: r.project_id ? (projectName.get(r.project_id) ?? null) : null,
    summary: r.summary,
    uses: r.use_count,
    updated: fmt.date(r.updated_at),
    updatedAt: r.updated_at,
  }));

  return <TemplatesList items={items} canManage={isManagerPlus(session)} />;
}
