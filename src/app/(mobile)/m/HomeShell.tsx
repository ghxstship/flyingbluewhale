"use client";

import { useState } from "react";
import Link from "next/link";

import { KIcon, RoseCard, SheetHead, TOOLS, ToolSheet } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";

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
  qaCustomize: string;
  qaCustomizeSoon: string;
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

/** Quick-action tile linking to a destination form/route. */
function QA({
  href,
  icon,
  tint,
  label,
  badge,
}: {
  href: string;
  icon: string;
  tint: string;
  label: string;
  badge?: number;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
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
    </Link>
  );
}

export function HomeShell({
  data,
  greeting,
  labels: L,
}: {
  data: HomeData;
  greeting: string;
  labels: HomeLabels;
}) {
  const [qaEdit, setQaEdit] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const t = useToast();
  // Adapt the canonical sonner toast to the kit ToolSheet's {tone,title,message} shape.
  const toolToast = ({ tone, title, message }: { tone: string; title: string; message?: string }) => {
    const opts = message ? { description: message } : undefined;
    if (tone === "ok" || tone === "success") t.success(title, opts);
    else if (tone === "warn" || tone === "warning") t.warning(title, opts);
    else if (tone === "danger" || tone === "error") t.error(title, opts);
    else t.info(title, opts);
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
        <QA href="/m/incidents/new" icon="TriangleAlert" tint="danger" label={L.qaReport} />
        <QA href="/m/check-in" icon="ScanLine" tint="accent" label={L.qaScan} />
        <QA href="/m/clock" icon="Timer" tint="info" label={L.qaClock} />
        <QA href="/m/advances" icon="ClipboardList" tint="warning" label={L.qaAdvance} />
        <QA href="/m/requests" icon="CheckCheck" tint="success" label={L.qaApprove} badge={data.openTasks || undefined} />
        {/* Swaps are decided on the Approvals queue — there is no /m/swaps
            route, and this tile 404'd for every role until it was repointed. */}
        <QA href="/m/requests" icon="ArrowLeftRight" tint="info" label={L.qaSwap} />
        <QA href="/m/expenses/new" icon="Receipt" tint="info" label={L.qaExpense} />
        <QA href="/m/lost-found" icon="Search" tint="warning" label={L.qaLostFound} />
        <QA href="/m/connections" icon="UserPlus" tint="accent" label={L.qaInvite} />
        {/* Customize — the kit's `.qa-add` tile (dashed icon well). Its CSS was
            ported and rendered by nothing, so the grid ended a tile short. */}
        <button type="button" className="qa-add" onClick={() => setQaEdit(true)}>
          <span className="qi">
            <KIcon name="Plus" size={18} />
          </span>
          <span className="ql">{L.qaCustomize}</span>
        </button>
      </div>

      {qaEdit && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={L.qaCustomize}>
          <div className="sheet-bg" onClick={() => setQaEdit(false)} />
          <div className="sheet-panel">
            <div className="sheet-grip" />
            {/* Kit 31 (live-test resolution #8): every sheet carries the
                canonical SheetHead — icon + title + explicit ✕ close. */}
            <SheetHead icon="LayoutGrid" title={L.qaCustomize} closeLabel={L.qaCustomizeClose} onClose={() => setQaEdit(false)} />
            {/* Honest placeholder: the kit lets a crew member pick which
                actions sit on their home. Persisting that needs a
                user_preferences key and a kit-sanctioned action registry —
                neither exists yet, so this says so rather than pretending. */}
            <p className="form-intro" style={{ margin: "0 0 12px" }}>
              {L.qaCustomizeSoon}
            </p>
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setQaEdit(false)}
            >
              {L.qaCustomizeClose}
            </button>
          </div>
        </div>
      )}

      {/* Toolbox — field utilities (unit/ops/OSHA/weather/radio/checklists) in a
          bottom sheet. Mirrors the kit reference's home Toolbox grid. */}
      <div className="sech">
        <h2>Toolbox</h2>
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
    </div>
  );
}
