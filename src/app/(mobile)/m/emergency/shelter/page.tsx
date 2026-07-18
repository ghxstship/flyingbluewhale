import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { getEmergencyContext } from "../data";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Shelter In Place (kit 31 `emgshelter`, live-test resolution #9).
 * The guidance line is universal safety reference. Shelter locations are
 * REAL where published: the event guide has no dedicated shelter section, so
 * this surfaces `resources` entries that name a shelter/muster/refuge, plus
 * the evacuation assembly point — and states plainly when nothing is
 * published, instead of inventing hardened structures.
 */
export default async function EmergencyShelterPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const ctx = await getEmergencyContext(session);

  const shelterEntries = (ctx.resources?.entries ?? []).filter((e) =>
    /shelter|muster|refuge|safe room|storm/i.test(`${e.name} ${e.details ?? ""}`),
  );
  const assembly = ctx.evac?.assemblyPoint ?? null;

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.emergency.back", undefined, "Home"), href: "/m" },
          { label: t("m.emergency.title", undefined, "Emergency Card"), href: "/m/emergency" },
          { label: t("m.emergency.shelter", undefined, "Shelter") },
        ]}
      />
      <div className="scr-eye">{t("m.emergency.refEyebrow", undefined, "Emergency · Reference")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.shelterTitle", undefined, "Shelter In Place")}
      </h1>

      <div className="import-note" style={{ marginBottom: 12 }}>
        <KIcon name="Shield" size={15} style={{ color: "var(--p-success)" }} />
        <span>
          {t(
            "m.emergency.shelterIntro",
            undefined,
            "For weather holds or external threats, direct people to the nearest hardened structure and stay off the radio unless reporting.",
          )}
        </span>
      </div>

      <div className="sech" style={{ marginTop: 0 }}>
        <h2>{t("m.emergency.shelterLocations", undefined, "Shelter Locations")}</h2>
        {ctx.projectName && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{ctx.projectName}</span>
        )}
      </div>
      {shelterEntries.length > 0 ? (
        shelterEntries.map((e, i) => (
          <div className="item" key={`${e.name}-${i}`}>
            <KIcon name="Building2" size={18} style={{ color: "var(--p-text-2)" }} />
            <div>
              <div className="t">{e.name}</div>
              <div className="s">
                {e.location}
                {e.details ? ` · ${e.details}` : ""}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="item">
          <div className="s">
            {t(
              "m.emergency.shelterNoLocations",
              undefined,
              "No shelter locations published for your project yet. Ops adds them to the event guide's resources section.",
            )}
          </div>
        </div>
      )}

      {assembly && (
        <div className="emerg-station" style={{ marginTop: 10 }}>
          <div className="es-grid">
            <div>
              <div className="es-k">{t("m.emergency.assembly", undefined, "Assembly Point")}</div>
              <div className="es-v">{assembly}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {assembly && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(assembly)}`}
            target="_blank"
            rel="noreferrer"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
          >
            <KIcon name="Map" size={16} /> {t("m.emergency.mapView", undefined, "Map View")}
          </a>
        )}
        <Link
          href="/m/guide#guide-resources"
          className={`ps-btn ${assembly ? "ps-btn--secondary" : "ps-btn--cta"} ps-btn--lg`}
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="Navigation" size={16} /> {t("m.emergency.openGuide", undefined, "Open Event Guide")}
        </Link>
      </div>
    </div>
  );
}
