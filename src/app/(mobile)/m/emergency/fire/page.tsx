import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { getEmergencyContext } from "../data";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Fire Safety (kit 31 `emgfire`, live-test resolution #9).
 * Extinguisher classes + PASS are universal safety reference (static, like
 * the OSHA list). On-site equipment locations are REAL: the project event
 * guide's `fire_safety` section, resolved from the viewer's active
 * assignment — honest empty state when the guide has none.
 */

const EXTINGUISHER_TYPES: Array<{ t: string; s: string; tint: string }> = [
  { t: "ABC Dry Chemical", s: "Most fires — wood, liquids, electrical", tint: "danger" },
  { t: "CO₂", s: "Electrical & equipment — leaves no residue", tint: "info" },
  { t: "Class K", s: "Kitchen / catering grease fires", tint: "warning" },
  { t: "Water Mist", s: "Ordinary combustibles only", tint: "info" },
];

export default async function EmergencyFirePage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const ctx = await getEmergencyContext(session);

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.emergency.back", undefined, "Home"), href: "/m" },
          { label: t("m.emergency.title", undefined, "Emergency Card"), href: "/m/emergency" },
          { label: t("m.emergency.fire", undefined, "Fire Safety") },
        ]}
      />
      <div className="scr-eye">{t("m.emergency.refEyebrow", undefined, "Emergency · Reference")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.fire", undefined, "Fire Safety")}
      </h1>

      <div className="import-note" style={{ marginBottom: 12 }}>
        <KIcon name="Flame" size={15} style={{ color: "var(--p-warning)" }} />
        <span>
          {t(
            "m.emergency.fireIntro",
            undefined,
            "Know your nearest extinguisher and how to use it. PASS: Pull, Aim, Squeeze, Sweep.",
          )}
        </span>
      </div>

      <div className="sech" style={{ marginTop: 0 }}>
        <h2>{t("m.emergency.fireTypes", undefined, "Extinguisher Types")}</h2>
      </div>
      {EXTINGUISHER_TYPES.map((x) => (
        <div className="item" key={x.t}>
          <span className="perm-ic" style={{ borderColor: `var(--p-${x.tint})`, color: `var(--p-${x.tint})` }}>
            <KIcon name="Flame" size={17} />
          </span>
          <div>
            <div className="t">{x.t}</div>
            <div className="s">{x.s}</div>
          </div>
        </div>
      ))}

      <div className="sech">
        <h2>{t("m.emergency.fireLocations", undefined, "On-Site Locations")}</h2>
        {ctx.projectName && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{ctx.projectName}</span>
        )}
      </div>
      {ctx.fire && ctx.fire.entries.length > 0 ? (
        ctx.fire.entries.map((e, i) => (
          <div className="item" key={`${e.item}-${i}`}>
            <KIcon name="MapPin" size={18} style={{ color: "var(--p-text-2)" }} />
            <div>
              <div className="t">{e.item}</div>
              <div className="s">
                {e.location}
                {e.note ? ` · ${e.note}` : ""}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="item">
          <div className="s">
            {t(
              "m.emergency.fireNoLocations",
              undefined,
              "No equipment locations published for your project yet. Ops adds them to the event guide's fire safety section.",
            )}
          </div>
        </div>
      )}

      <Link
        href="/m/guide#guide-fire_safety"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 10, textDecoration: "none" }}
      >
        <KIcon name="Map" size={16} /> {t("m.emergency.openGuide", undefined, "Open Event Guide")}
      </Link>
    </div>
  );
}
