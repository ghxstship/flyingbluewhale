import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";

/**
 * COMPVSS · RAMS detail — one approved risk assessment & method statement,
 * rendered read-only for the crew on site: scope, the hazard register
 * (hazard / risk / control), and the method. Same shape the RAMS document
 * template prints (`rams` in the doc registry); this is the phone-sized read.
 */
export const dynamic = "force-dynamic";

type HazardEntry = { hazard?: string; risk?: string; control?: string; mitigation?: string };

export default async function RamsDetailPage({ params }: { params: Promise<{ ramsId: string }> }) {
  const { ramsId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("rams_assessments")
    .select("id, title, scope, rev, assessor, assessed_on, hazards, method")
    .eq("id", ramsId)
    .eq("org_id", session.orgId)
    .eq("rams_state", "approved")
    .is("deleted_at", null)
    .maybeSingle();
  if (!r) notFound();

  const hazards = (Array.isArray(r.hazards) ? r.hazards : []).filter(
    (h): h is HazardEntry => typeof h === "object" && h !== null,
  );

  return (
    <div className="screen screen-anim">
      <Link href="/m/rams" className="ps-btn ps-btn--tertiary ps-btn--sm" style={{ marginBottom: 10 }}>
        <KIcon name="ChevronLeft" size={14} /> {t("m.rams.back", undefined, "Method Statements")}
      </Link>
      <div className="scr-eye">
        {[r.rev ? `${t("m.rams.rev", undefined, "Rev")} ${r.rev}` : null, r.assessed_on].filter(Boolean).join(" · ") ||
          t("m.rams.eyebrow", undefined, "Safety")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {r.title}
      </h1>

      {r.assessor && (
        <div className="s" style={{ marginBottom: 12 }}>
          {t("m.rams.assessedBy", undefined, "Assessed by")} {r.assessor}
        </div>
      )}

      {r.scope && (
        <section style={{ marginBottom: 16 }}>
          <h2>{t("m.rams.scope", undefined, "Scope")}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{r.scope}</p>
        </section>
      )}

      {hazards.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2>{t("m.rams.hazards", undefined, "Hazards")}</h2>
          <div>
            {hazards.map((h, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--p-border)",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <div className="t" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <KIcon name="TriangleAlert" size={15} />
                  {h.hazard ?? t("m.rams.hazard", undefined, "Hazard")}
                </div>
                {h.risk && (
                  <div className="s" style={{ marginTop: 4 }}>
                    {t("m.rams.risk", undefined, "Risk")}: {h.risk}
                  </div>
                )}
                {(h.control ?? h.mitigation) && (
                  <div className="s" style={{ marginTop: 4 }}>
                    {t("m.rams.control", undefined, "Control")}: {h.control ?? h.mitigation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {r.method && (
        <section style={{ marginBottom: 16 }}>
          <h2>{t("m.rams.method", undefined, "Method")}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{r.method}</p>
        </section>
      )}
    </div>
  );
}
