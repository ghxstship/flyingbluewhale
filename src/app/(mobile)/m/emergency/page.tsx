import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Emergency Card — the field crew's manning-list emergency station,
 * like a cruise ship's muster card. Assigned by ops at the project level
 * (desktop admin) and read-only on mobile, so this surface is static reference
 * content (no backing table): the station card + assembly/role/report-to grid,
 * the quick-jump tiles, and the `.emerg-list` of emergency code triggers.
 *
 * The kit authors per-code hex chips; we map each code to a `--p-*` semantic
 * token (no literal colors per the kit token rule) while keeping the same
 * code → trigger pairing the prototype renders.
 */

const STATION = {
  manningId: "40137",
  assembly: "Gate 3 Assembly Point",
  emergencyRole: "Crowd Control & Egress",
  team: "Access Team B",
  reportTo: "Security Lead · Ch 2",
};

/** Code → semantic token tint + dark-ink flag, mapped off the kit colorway. */
const CODES: { code: string; trigger: string; tint: string; ink?: "dark" }[] = [
  { code: "Red", trigger: "Fire, Lightning Strike, High Winds or Weather", tint: "danger" },
  { code: "Orange", trigger: "Crowd Surge", tint: "warning" },
  { code: "Yellow", trigger: "Structural Damage or Severe Equipment Failure", tint: "warning", ink: "dark" },
  { code: "Green", trigger: "Burglary or Theft", tint: "success" },
  { code: "Blue", trigger: "Medical Emergency", tint: "info" },
  { code: "Purple", trigger: "Cultural Sensitivity Issue", tint: "accent" },
  { code: "Pink", trigger: "Drug or Illegal Substance Trafficking", tint: "danger", ink: "dark" },
  { code: "Indigo", trigger: "Missing Talent", tint: "info" },
  { code: "White", trigger: "ICE Raid or Government Agency Intervention", tint: "neutral", ink: "dark" },
  { code: "Black", trigger: "Acts of Terror, Active Shooter or Bomb Threat", tint: "text-1" },
];

export default async function EmergencyPage() {
  await requireSession();
  const { t } = await getRequestT();

  const chipBg = (tint: string) =>
    tint === "text-1"
      ? "var(--p-text-1)"
      : tint === "neutral"
        ? "var(--p-surface)"
        : `var(--p-${tint})`;
  const chipFg = (tint: string, ink?: "dark") =>
    tint === "neutral" ? "var(--p-text-1)" : ink ? "var(--p-bg)" : "var(--p-accent-contrast, #fff)";

  return (
    <div className="screen screen-anim">
      <Link href="/m" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.emergency.back", undefined, "Home")}
      </Link>
      <div className="scr-eye">
        {t("m.emergency.eyebrow", undefined, "Position")} {STATION.manningId}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.title", undefined, "Emergency Card")}
      </h1>

      {/* Station / manning card. */}
      <div className="emerg-station">
        <div className="es-grid">
          <div>
            <div className="es-k">{t("m.emergency.assembly", undefined, "Assembly Point")}</div>
            <div className="es-v">{STATION.assembly}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.role", undefined, "Emergency Role")}</div>
            <div className="es-v">{STATION.emergencyRole}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.team", undefined, "Team")}</div>
            <div className="es-v">{STATION.team}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.reportTo", undefined, "Report To")}</div>
            <div className="es-v">{STATION.reportTo}</div>
          </div>
        </div>
      </div>

      {/* Quick-jump tiles. */}
      <div className="qa" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 6 }}>
        <Link href="/m/guide" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-warning) 16%, transparent)", color: "var(--p-warning)" }}
          >
            <KIcon name="Flame" size={18} />
          </span>
          <span className="ql">{t("m.emergency.fire", undefined, "Fire Safety")}</span>
        </Link>
        <Link href="/m/guide" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-info) 14%, transparent)", color: "var(--p-info)" }}
          >
            <KIcon name="LogOut" size={18} />
          </span>
          <span className="ql">{t("m.emergency.evac", undefined, "Evacuate")}</span>
        </Link>
        <Link href="/m/guide" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-success) 14%, transparent)", color: "var(--p-success)" }}
          >
            <KIcon name="Shield" size={18} />
          </span>
          <span className="ql">{t("m.emergency.shelter", undefined, "Shelter")}</span>
        </Link>
      </div>

      {/* Emergency codes list (static reference data). */}
      <div className="sech">
        <h2>{t("m.emergency.codes", undefined, "Emergency Codes")}</h2>
      </div>
      <div className="emerg-list">
        {CODES.map((e) => (
          <div className="emerg-row" key={e.code}>
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
            <span className="emerg-trig">{e.trigger}</span>
            <KIcon name="ChevronRight" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
