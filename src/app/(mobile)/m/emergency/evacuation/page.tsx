import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { getEmergencyContext } from "../data";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Evacuation Routes (kit 31 `emgevac`, live-test resolution #9).
 * Every route and the assembly point come from the project event guide's
 * `evacuation` section (the viewer's active-assignment project) — the same
 * data the Emergency Card musters from. No routes published → honest empty
 * state pointing at the guide, never an invented map.
 */
export default async function EmergencyEvacuationPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const ctx = await getEmergencyContext(session);

  const assembly = ctx.evac?.assemblyPoint ?? null;
  const routes = ctx.evac?.routes ?? [];

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.emergency.back", undefined, "Home"), href: "/m" },
          { label: t("m.emergency.title", undefined, "Emergency Card"), href: "/m/emergency" },
          { label: t("m.emergency.evacCrumb", undefined, "Evacuation") },
        ]}
      />
      <div className="scr-eye">{t("m.emergency.refEyebrow", undefined, "Emergency · Reference")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.evacTitle", undefined, "Evacuation Routes")}
      </h1>

      <div className="import-note" style={{ marginBottom: 12 }}>
        <KIcon name="LogOut" size={15} style={{ color: "var(--p-info)" }} />
        <span>
          {t(
            "m.emergency.evacIntro",
            undefined,
            "On an evacuation code, move people along your assigned egress lane to the assembly point.",
          )}
        </span>
      </div>

      {assembly && (
        <div className="emerg-station" style={{ marginBottom: 10 }}>
          <div className="es-grid">
            <div>
              <div className="es-k">{t("m.emergency.assembly", undefined, "Assembly Point")}</div>
              <div className="es-v">{assembly}</div>
            </div>
            {ctx.projectName && (
              <div>
                <div className="es-k">{t("m.emergency.project", undefined, "Project")}</div>
                <div className="es-v">{ctx.projectName}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sech" style={{ marginTop: 0 }}>
        <h2>{t("m.emergency.evacRoutes", undefined, "Routes To Muster")}</h2>
      </div>
      {routes.length > 0 ? (
        routes.map((r, i) => (
          <div className="item" key={i}>
            <KIcon name="Footprints" size={18} style={{ color: "var(--p-text-2)" }} />
            <div>
              <div className="t">
                {r.from} → {r.to}
              </div>
              {r.via && <div className="s">{t("m.emergency.evacVia", { via: r.via }, `Via ${r.via}`)}</div>}
            </div>
          </div>
        ))
      ) : (
        <div className="item">
          <div className="s">
            {t(
              "m.emergency.evacNoRoutes",
              undefined,
              "No evacuation routes published for your project yet. Ops adds them to the event guide's evacuation section.",
            )}
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
          href="/m/guide#guide-evacuation"
          className={`ps-btn ${assembly ? "ps-btn--secondary" : "ps-btn--cta"} ps-btn--lg`}
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="Navigation" size={16} /> {t("m.emergency.openGuide", undefined, "Open Event Guide")}
        </Link>
      </div>
    </div>
  );
}
