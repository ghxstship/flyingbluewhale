import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import { AdvancesView, type AdvanceRow } from "./AdvancesView";

export const dynamic = "force-dynamic";

/**
 * /m/advances — cross-project view of everything assigned to the caller.
 * Tickets, credentials, lodging, travel, catering, radios — one list.
 * The portal version (/p/[slug]/crew/advances) is scoped to a single
 * show; this is the "across every project I'm on" view.
 *
 * Server: reads `listMyAssignments` for the user, hydrates project
 * names, then hands plain rows to the surviving client `AdvancesView`.
 */
export default async function MobileAdvancesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.advances.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.advances.title", undefined, "Advances")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const assignments = await listMyAssignments(session.orgId, session.userId);

  const projectIds = Array.from(new Set(assignments.map((r) => r.project_id)));
  const projectMap = new Map<string, string>();
  if (projectIds.length) {
    const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
    for (const p of (projects ?? []) as Array<{ id: string; name: string }>) {
      projectMap.set(p.id, p.name);
    }
  }

  const rows: AdvanceRow[] = assignments.map((r) => ({
    id: r.id,
    title: r.title,
    catalogKind: r.catalog_kind,
    fulfillmentState: r.fulfillment_state,
    deadline: r.deadline,
    project: projectMap.get(r.project_id) ?? null,
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.advances.eyebrow", undefined, "Field")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.advances.title", undefined, "Advances")}
      </h1>
      <AdvancesView rows={rows} />
    </div>
  );
}
