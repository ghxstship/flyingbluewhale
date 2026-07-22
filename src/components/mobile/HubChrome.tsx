"use client";

import Link from "next/link";
import { KIcon, MetricBar, type MetricBarItem } from "@/components/mobile/kit";
import { hubByKey } from "@/lib/nav";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Hub chrome — kit 34 v3.1/v3.2 (design_handoff_compvss_field: `HUBS` +
 * hub-member rendering). The fixed top of every Field-Operations hub screen:
 * `Back → Title → MetricBar → viewseg`. The repo routes hub members
 * individually (rather than swapping tab state), so the chrome renders in two
 * modes:
 *  - **home** (`active` omitted): the hub landing — MetricBar + a member
 *    launcher list.
 *  - **member** (`active` set): a compact `viewseg` of member tabs so the hub
 *    identity + navigation persists on each member screen.
 *
 * `managerOnly` members self-hide for crew/external; `pending` members (routes
 * not built yet) are omitted so no dead link ships. Back opens the nav drawer
 * (the `compvss:nav-open` event), matching the More tab.
 */
export function HubChrome({
  hubKey,
  active,
  canManage,
  metrics,
}: {
  hubKey: string;
  /** Member key currently shown → member (viewseg) mode; omit for home mode. */
  active?: string;
  canManage: boolean;
  metrics?: MetricBarItem[];
}) {
  const t = useT();
  const hub = hubByKey(hubKey);
  if (!hub) return null;
  const members = hub.members.filter((m) => !m.pending && (!m.managerOnly || canManage));
  const openNav = () => window.dispatchEvent(new CustomEvent("compvss:nav-open"));
  return (
    <>
      <button type="button" className="backbtn" onClick={openNav}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.more.title", undefined, "More")}
      </button>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {hub.label}
      </h1>
      {metrics && metrics.length > 0 && <MetricBar items={metrics} />}
      {active ? (
        members.length > 1 && (
          <div className="viewseg" style={{ marginBottom: 14 }}>
            {members.map((m) => (
              <Link key={m.key} href={m.href} className={active === m.key ? "on" : ""} aria-current={active === m.key ? "page" : undefined}>
                <KIcon name={m.icon} size={14} /> {m.label}
              </Link>
            ))}
          </div>
        )
      ) : (
        <div>
          {members.map((m) => (
            <Link key={m.key} href={m.href} className="item tap" style={{ textDecoration: "none" }}>
              <span className="more-ic">
                <KIcon name={m.icon} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{m.label}</div>
              </div>
              <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
