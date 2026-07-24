import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { KIcon } from "@/components/mobile/kit";

/**
 * COMPVSS · Site Plans — the drawing set, on site.
 *
 * The console has the full sheet register with PDF markup
 * (/studio/site-plans); the field shell had NO plan surface at all, which is
 * backwards — a drawing matters most in the hands of the person standing on
 * the site it describes. This is the read side: released sheets only
 * (approved / issued / as_built; never drafts or superseded revisions),
 * rendered on-device via PDF.js with the sheet's pins overlaid.
 */
export const dynamic = "force-dynamic";

const FIELD_VISIBLE_STATES = ["approved", "issued", "as_built"] as const;

type PlanRow = {
  id: string;
  code: string;
  title: string;
  discipline: string;
  sheet_type: string;
  revision_letter: string | null;
  document_state: string;
  storage_path: string | null;
  updated_at: string;
};

export default async function PlansListPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_plans")
    .select("id, code, title, discipline, sheet_type, revision_letter, document_state, storage_path, updated_at")
    .eq("org_id", session.orgId)
    .in("document_state", [...FIELD_VISIBLE_STATES])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = ((data ?? []) as PlanRow[]).filter((p) => p.storage_path != null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.plans.eyebrow", undefined, "Field")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.plans.title", undefined, "Site Plans")}
      </h1>

      {rows.length === 0 ? (
        <div className="hint" style={{ padding: "24px 0" }}>
          {t(
            "m.plans.empty",
            undefined,
            "No released drawings yet. When the office issues a sheet with a PDF, it shows up here.",
          )}
        </div>
      ) : (
        <div>
          {rows.map((p) => (
            <Link key={p.id} href={`/m/plans/${p.id}`} className="item" style={{ textDecoration: "none" }}>
              <span className="perm-ic" style={{ borderColor: "var(--p-border)", color: "var(--p-text-2)" }}>
                <KIcon name="Map" size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">
                  {p.code} · {p.title}
                </div>
                <div className="s">
                  {[toTitle(p.discipline), p.revision_letter ? `${t("m.plans.rev", undefined, "Rev")} ${p.revision_letter}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${p.document_state === "as_built" ? "info" : "ok"}`}>
                {toTitle(p.document_state)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
