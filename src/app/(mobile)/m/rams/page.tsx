import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";

/**
 * COMPVSS · RAMS — field method statements.
 *
 * The office authors risk assessments & method statements in the console
 * (`rams_assessments`, `rams_state` draft → submitted → approved → archived)
 * and could print them as documents, but the crew standing next to the hazard
 * had no surface at all: SOPs had Knowledge, briefings had sign-in, RAMS had
 * nothing. This is the read side of that loop — approved assessments only,
 * because a field worker acting on a draft method statement is the exact
 * failure mode a RAMS process exists to prevent.
 */
export const dynamic = "force-dynamic";

type RamsRow = {
  id: string;
  title: string;
  rev: string | null;
  assessor: string | null;
  assessed_on: string | null;
  project_id: string | null;
};

export default async function RamsListPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("rams_assessments")
    .select("id, title, rev, assessor, assessed_on, project_id")
    .eq("org_id", session.orgId)
    .eq("rams_state", "approved")
    .is("deleted_at", null)
    .order("assessed_on", { ascending: false, nullsFirst: false })
    .limit(200);

  const rows = (data ?? []) as RamsRow[];

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.rams.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.rams.title", undefined, "Method Statements")}
      </h1>

      {rows.length === 0 ? (
        <div className="hint" style={{ padding: "24px 0" }}>
          {t(
            "m.rams.empty",
            undefined,
            "No approved risk assessments yet. When the office approves one, it shows up here.",
          )}
        </div>
      ) : (
        <div>
          {rows.map((r) => (
            <Link key={r.id} href={`/m/rams/${r.id}`} className="item" style={{ textDecoration: "none" }}>
              <span className="perm-ic" style={{ borderColor: "var(--p-border)", color: "var(--p-text-2)" }}>
                <KIcon name="ShieldCheck" size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.title}</div>
                <div className="s">
                  {[r.rev ? `${t("m.rams.rev", undefined, "Rev")} ${r.rev}` : null, r.assessed_on, r.assessor]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span className="ps-badge ps-badge--ok">{t("m.rams.approved", undefined, "Approved")}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
