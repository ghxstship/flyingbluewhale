"use client";

import { useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { KIcon, RoseCard, Sheet, TOOLS } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { QUICK_ACTIONS, QUICK_ACTION_IDS, type QuickActionId } from "@/lib/mobile/quick-actions";
import { ApprovalsQuickSheet, type QuickApproval } from "./ApprovalsQuickSheet";

// The field toolbox (unit/ops/OSHA/weather/radio/checklists) carries a large
// block of static OSHA / ops-calc reference data. It only renders after the
// first Toolbox tap, so defer its chunk with next/dynamic instead of shipping
// it on the Home first paint.
const ToolSheet = dynamic(() => import("@/components/mobile/kit/ToolSheet").then((m) => m.ToolSheet));

export type HomeData = {
  openTasks: number;
  myAdvances: number;
  unread: number;
  nextShift: {
    id: string;
    name: string;
    time: string;
    day: string;
    sub: string;
  } | null;
  /** Rose hero card: the holder's name + credential line (kit shows
      J. GIBBS · ID 0731 — ours is the real user + their manning id). */
  rose: { holderName: string; credentialLabel: string | null };
  /** The viewer's emergency station — kit 28 home §"Emergency Card". */
  station: {
    manningId: string;
    assembly: string;
    emergencyRole: string;
  };
  /**
   * Manager band: the open approval instances for the Approve quick-action
   * drawer (kit 32 drawer canon v2.8). `null` for members — their tile stays
   * a link to /m/requests (read-only submissions view). The badge computes
   * from the LIVE decidable count, never a hardcoded number.
   */
  approvals: QuickApproval[] | null;
};

export type HomeLabels = {
  title: string;
  quickActions: string;
  upcoming: string;
  viewAll: string;
  noShift: string;
  noShiftBody: string;
  qaReport: string;
  qaScan: string;
  qaClock: string;
  qaAdvance: string;
  qaApprove: string;
  qaExpense: string;
  qaLostFound: string;
  qaSwap: string;
  qaInvite: string;
  qaInspect: string;
  qaTimeoff: string;
  qaPo: string;
  qaCapture: string;
  qaCustomize: string;
  qaCustomizeHint: string;
  qaAvailable: string;
  qaCustomizeClose: string;
  emergencyCard: string;
  esManning: string;
  esAssembly: string;
  esRole: string;
  esCodes: string;
  esFire: string;
  esEvacuate: string;
  esShelter: string;
};

/** Quick-action tile linking to a destination form/route — or, with
 *  `onClick`, opening a drawer in place (the Approve tile's action drawer). */
function QA({
  href,
  icon,
  tint,
  label,
  badge,
  onClick,
}: {
  href?: string;
  icon: string;
  tint: string;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        className="qi"
        style={{
          background: `color-mix(in oklab, var(--p-${tint}) ${tint === "accent" ? 20 : 14}%, transparent)`,
          color: tint === "accent" ? "var(--p-accent-text)" : `var(--p-${tint})`,
        }}
      >
        <KIcon name={icon} size={18} />
        {badge ? <span className="qa-badge">{badge}</span> : null}
      </span>
      <span className="ql">{label}</span>
    </>
  );
  if (onClick) {
    // No inline reset here: `.qa button` (kit-mobile.css) already paints the
    // tile chrome + flex-column layout the anchor tiles get; a background/
    // border/padding reset would strip exactly that and drop the tile out of
    // the grid's visual rhythm (the Approve-tile regression).
    return (
      <button type="button" onClick={onClick}>
        {body}
      </button>
    );
  }
  return (
    <Link href={href!} style={{ textDecoration: "none" }}>
      {body}
    </Link>
  );
}

/** Tinted icon chip for a quick action in the Customize sheet. */
function qaTintStyle(tint: string): CSSProperties {
  return {
    width: 30,
    height: 30,
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: `color-mix(in oklab, var(--p-${tint}) ${tint === "accent" ? 20 : 14}%, transparent)`,
    color: tint === "accent" ? "var(--p-accent-text)" : `var(--p-${tint})`,
  };
}
/** Square 32px icon button (reorder / remove / add) in the Customize sheet. */
function qaEditBtnStyle(disabled: boolean, accent?: string): CSSProperties {
  return {
    width: 32,
    height: 32,
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--p-border)",
    borderRadius: 8,
    background: "transparent",
    color: accent ?? "var(--p-text-2)",
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "default" : "pointer",
  };
}

export function HomeShell({
  data,
  greeting,
  labels: L,
  quickActions,
}: {
  data: HomeData;
  greeting: string;
  labels: HomeLabels;
  quickActions: QuickActionId[];
}) {
  const [qaEdit, setQaEdit] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  // Quick-action customization — the server-resolved set (page.tsx reads
  // ui_state.quick_actions) seeds the grid; the Customize sheet mutates this
  // local set and persists each change back to ui_state.quick_actions.
  const { setPrefs } = useUserPreferences();
  const [qaIds, setQaIds] = useState<QuickActionId[]>(quickActions);
  const QA_LABEL: Record<QuickActionId, string> = {
    report: L.qaReport,
    scan: L.qaScan,
    clock: L.qaClock,
    advance: L.qaAdvance,
    approve: L.qaApprove,
    swap: L.qaSwap,
    expense: L.qaExpense,
    "lost-found": L.qaLostFound,
    invite: L.qaInvite,
    inspect: L.qaInspect,
    timeoff: L.qaTimeoff,
    po: L.qaPo,
    capture: L.qaCapture,
  };
  const persistQa = (next: QuickActionId[]) => {
    setQaIds(next);
    void setPrefs({ quick_actions: next });
  };
  const qaMove = (id: QuickActionId, dir: -1 | 1) => {
    const i = qaIds.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= qaIds.length) return;
    const next = [...qaIds];
    [next[i], next[j]] = [next[j]!, next[i]!];
    persistQa(next);
  };
  const qaRemove = (id: QuickActionId) => {
    if (qaIds.length <= 1) return; // never leave an empty grid
    persistQa(qaIds.filter((x) => x !== id));
  };
  const qaAdd = (id: QuickActionId) => persistQa([...qaIds, id]);
  const qaAvailable = QUICK_ACTION_IDS.filter((id) => !qaIds.includes(id));
  // Live decidable count — the kit computes the Approve badge from the open
  // queue (v2.8: "was hardcoded 3"), never from an unrelated tally.
  const decidable = data.approvals?.filter((a) => a.stepId != null).length ?? 0;
  const t = useT();
  const toast = useToast();
  // Adapt the canonical sonner toast to the kit ToolSheet's {tone,title,message} shape.
  const toolToast = ({ tone, title, message }: { tone: string; title: string; message?: string }) => {
    const opts = message ? { description: message } : undefined;
    if (tone === "ok" || tone === "success") toast.success(title, opts);
    else if (tone === "warn" || tone === "warning") toast.warning(title, opts);
    else if (tone === "danger" || tone === "error") toast.error(title, opts);
    else toast.info(title, opts);
  };


  return (
    <div className="screen screen-anim" style={{ position: "relative" }}>
      <div className="scr-eye">{greeting}</div>
      <h1 className="scr-h">{L.title}</h1>

      {/* COMPVSS Rose — the hero card. No section heading: in the kit it sits
          directly under the page title as the first thing on the screen. */}
      <Link href="/m/pass" style={{ textDecoration: "none", display: "block" }}>
        <RoseCard compact holderName={data.rose.holderName} credentialLabel={data.rose.credentialLabel ?? undefined} />
      </Link>

      {/* Quick actions. */}
      <div className="sech" style={{ marginTop: 14 }}>
        <h2>{L.quickActions}</h2>
      </div>
      <div className="qa">
        {qaIds.map((id) => {
          const def = QUICK_ACTIONS[id];
          // Approve — kit 32 (drawer canon v2.8): the manager band gets the
          // inline APPROVALS decision drawer (same store as /m/requests) + a
          // live decidable badge; members keep the link to their submissions.
          if (id === "approve" && data.approvals) {
            return (
              <QA
                key={id}
                onClick={() => setApproveOpen(true)}
                icon={def.icon}
                tint={def.tint}
                label={QA_LABEL[id]}
                badge={decidable || undefined}
              />
            );
          }
          return <QA key={id} href={def.href} icon={def.icon} tint={def.tint} label={QA_LABEL[id]} />;
        })}
        {/* Customize — the kit's `.qa-add` tile (dashed icon well). Its CSS was
            ported and rendered by nothing, so the grid ended a tile short. */}
        <button type="button" className="qa-add" onClick={() => setQaEdit(true)}>
          <span className="qi">
            <KIcon name="Plus" size={18} />
          </span>
          <span className="ql">{L.qaCustomize}</span>
        </button>
      </div>

      {/* Kit 32 drawer canon: the kit Sheet shell carries the scrim, the
          SheetHead (icon + title + explicit ✕) and the ESC / focus-trap /
          focus-restore semantics via useDismissable. */}
      {qaEdit && (
        <Sheet icon="LayoutGrid" title={L.qaCustomize} closeLabel={L.qaCustomizeClose} onClose={() => setQaEdit(false)}>
            <p className="form-intro" style={{ margin: "0 0 12px" }}>{L.qaCustomizeHint}</p>

            {/* Active set — reorder (▲▼) + remove (−). Persists on every change. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "44vh", overflowY: "auto", marginBottom: 12 }}>
              {qaIds.map((id, i) => {
                const def = QUICK_ACTIONS[id];
                return (
                  <div key={id} className="item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                    <span style={qaTintStyle(def.tint)}>
                      <KIcon name={def.icon} size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{QA_LABEL[id]}</span>
                    <button
                      type="button"
                      aria-label={t("m.home.moveActionUp", { label: QA_LABEL[id] }, `Move ${QA_LABEL[id]} up`)}
                      disabled={i === 0}
                      onClick={() => qaMove(id, -1)}
                      style={qaEditBtnStyle(i === 0)}
                    >
                      <KIcon name="ChevronUp" size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("m.home.moveActionDown", { label: QA_LABEL[id] }, `Move ${QA_LABEL[id]} down`)}
                      disabled={i === qaIds.length - 1}
                      onClick={() => qaMove(id, 1)}
                      style={qaEditBtnStyle(i === qaIds.length - 1)}
                    >
                      <KIcon name="ChevronDown" size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("m.home.removeAction", { label: QA_LABEL[id] }, `Remove ${QA_LABEL[id]}`)}
                      disabled={qaIds.length <= 1}
                      onClick={() => qaRemove(id)}
                      style={qaEditBtnStyle(qaIds.length <= 1, "var(--p-danger)")}
                    >
                      <KIcon name="Minus" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Available pool = the registry minus the active set. */}
            {qaAvailable.length > 0 && (
              <>
                <div className="eyebrow" style={{ marginBottom: 6 }}>{L.qaAvailable}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {qaAvailable.map((id) => {
                    const def = QUICK_ACTIONS[id];
                    return (
                      <div key={id} className="item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                        <span style={qaTintStyle(def.tint)}>
                          <KIcon name={def.icon} size={16} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{QA_LABEL[id]}</span>
                        <button
                          type="button"
                          aria-label={t("m.home.addAction", { label: QA_LABEL[id] }, `Add ${QA_LABEL[id]}`)}
                          onClick={() => qaAdd(id)}
                          style={qaEditBtnStyle(false, "var(--p-success)")}
                        >
                          <KIcon name="Plus" size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setQaEdit(false)}
            >
              {L.qaCustomizeClose}
            </button>
        </Sheet>
      )}

      {/* Toolbox — field utilities (unit/ops/OSHA/weather/radio/checklists) in a
          bottom sheet. Mirrors the kit reference's home Toolbox grid. */}
      <div className="sech">
        <h2>{t("m.home.toolbox", undefined, "Toolbox")}</h2>
      </div>
      {/* `.toolgrid` / `.toolcard`, not `.qa`. The Toolbox is a two-up grid of
          bordered cards with the icon beside the label — the kit's own CSS for
          it was ported and then used by nothing, while this rendered as
          quick-action tiles (icon above a centred caption). Wrong primitive,
          wrong shape, wrong icon size. Kit: runtime/app.jsx home §Toolbox. */}
      <div className="toolgrid">
        {TOOLS.map((tool) => (
          <button key={tool.id} type="button" className="toolcard" onClick={() => setActiveTool(tool.id)}>
            <span
              className="tc-ic"
              style={{
                background: `color-mix(in oklab, var(--p-${tool.tint}) 16%, transparent)`,
                color: tool.tint === "accent" ? "var(--p-accent-text)" : `var(--p-${tool.tint})`,
              }}
            >
              <KIcon name={tool.icon} size={19} />
            </span>
            <span className="tc-body">
              <span className="tc-t">{tool.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Next upcoming event. */}
      <div className="sech">
        <h2>{L.upcoming}</h2>
      </div>
      {data.nextShift ? (
        <Link href="/m/schedule" className="item tap" style={{ textDecoration: "none" }}>
          <span className="bar" />
          <div>
            <div className="t">{data.nextShift.name}</div>
            <div className="s">{data.nextShift.sub}</div>
          </div>
          <span className="sp" />
          <div style={{ textAlign: "right" }}>
            <div className="time">{data.nextShift.time}</div>
            <div className="s">{data.nextShift.day}</div>
          </div>
        </Link>
      ) : (
        <div className="item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <div className="t">{L.noShift}</div>
          <div className="s">{L.noShiftBody}</div>
        </div>
      )}
      <Link href="/m/schedule" className="viewall">
        {L.viewAll} <KIcon name="ArrowRight" size={15} />
      </Link>

      {/* Emergency Card (kit 28 home §"Emergency Card"). The muster card the
          crew member carries: manning position, where to go, what they do when
          it happens. It belongs on Home and not one tap away — on the day it
          matters nobody is browsing a hub. Whole card opens /m/emergency. */}
      <div className="sech">
        <h2>{L.emergencyCard}</h2>
      </div>
      <Link href="/m/emergency" className="emerg-station tap" style={{ textDecoration: "none", display: "block" }}>
        <div className="es-manning">
          <div>
            <div className="es-k">{L.esManning}</div>
            <div className="es-id">{data.station.manningId}</div>
          </div>
          <KIcon name="ChevronRight" size={18} style={{ color: "var(--p-text-3)" }} />
        </div>
        <div className="es-grid">
          <div>
            <div className="es-k">{L.esAssembly}</div>
            <div className="es-v">{data.station.assembly}</div>
          </div>
          <div>
            <div className="es-k">{L.esRole}</div>
            <div className="es-v">{data.station.emergencyRole}</div>
          </div>
        </div>
      </Link>
      <div className="qa" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <QA href="/m/emergency#codes" icon="Siren" tint="danger" label={L.esCodes} />
        <QA href="/m/emergency#fire" icon="Flame" tint="warning" label={L.esFire} />
        <QA href="/m/emergency#evacuate" icon="LogOut" tint="info" label={L.esEvacuate} />
        <QA href="/m/emergency#shelter" icon="Shield" tint="success" label={L.esShelter} />
      </div>

      {activeTool ? (
        <ToolSheet toolId={activeTool} onClose={() => setActiveTool(null)} toast={toolToast} />
      ) : null}

      {approveOpen && data.approvals ? (
        <ApprovalsQuickSheet cards={data.approvals} onClose={() => setApproveOpen(false)} />
      ) : null}
    </div>
  );
}
