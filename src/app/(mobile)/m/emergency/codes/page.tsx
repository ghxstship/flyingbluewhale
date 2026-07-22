import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { getEmergencyCodes, chipBg, chipFg } from "../data";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Emergency Codes (kit 31 `emgcodes`, live-test resolution #9) —
 * the full universal venue code reference as a dedicated PAGE with
 * breadcrumbs and the Home tab highlight. Each code expands to its
 * department / team / individual plan (static industry reference — the
 * repo carries no fabricated project specifics; live station data is on
 * the Emergency Card).
 */
export default async function EmergencyCodesPage() {
  await requireSession();
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.emergency.back", undefined, "Home"), href: "/m" },
          { label: t("m.emergency.title", undefined, "Emergency Card"), href: "/m/emergency" },
          { label: t("m.emergency.codesCrumb", undefined, "Codes") },
        ]}
      />
      <div className="scr-eye">{t("m.emergency.refEyebrow", undefined, "Emergency · Reference")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.codes", undefined, "Emergency Codes")}
      </h1>
      <div className="hint" style={{ marginBottom: 10 }}>
        {t("m.emergency.codesHint", undefined, "Tap a code for the department, team and individual plan.")}
      </div>

      {getEmergencyCodes(t).map((e) => (
        <details className="item" key={e.key} id={`code-${e.key}`} style={{ display: "block" }}>
          <summary
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", listStyle: "none" }}
          >
            <span
              className="emerg-chip"
              style={{
                background: chipBg(e.tint),
                color: chipFg(e.tint, e.ink),
                border: e.tint === "neutral" ? "1px solid var(--p-border)" : "none",
              }}
            >
              {e.code}
            </span>
            <span className="emerg-trig" style={{ flex: 1 }}>
              {e.trigger}
            </span>
            <KIcon name="ChevronDown" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
          </summary>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {(
              [
                [t("m.emergency.planDept", undefined, "Department"), e.dept],
                [t("m.emergency.planTeam", undefined, "Team"), e.team],
                [t("m.emergency.planIndiv", undefined, "You"), e.indiv],
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div key={k}>
                <div className="es-k">{k}</div>
                <div className="s" style={{ marginTop: 2 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
