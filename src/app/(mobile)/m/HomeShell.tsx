"use client";

import { useState } from "react";
import Link from "next/link";
import { KIcon, RoseCard, TOOLS, ToolSheet } from "@/components/mobile/kit";
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
};

export type HomeLabels = {
  title: string;
  clockTitle: string;
  clockSub: string;
  copilotTitle: string;
  copilotSub: string;
  widgets: string;
  wTasks: string;
  wTasksSub: string;
  wAdvances: string;
  wAdvancesSub: string;
  wUnread: string;
  wUnreadSub: string;
  quickActions: string;
  upcoming: string;
  viewAll: string;
  noShift: string;
  noShiftBody: string;
  newSheet: string;
  newSheetBody: string;
  qaReport: string;
  qaScan: string;
  qaClock: string;
  qaAdvance: string;
  qaApprove: string;
  qaExpense: string;
  qaSwap: string;
  qaInvite: string;
};

/** A single tinted-icon count widget (`.w`). */
function Widget({
  href,
  icon,
  tint,
  label,
  value,
  sub,
}: {
  href: string;
  icon: string;
  tint: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Link className="w tap" href={href} style={{ display: "block", textDecoration: "none" }}>
      <div className="wtop">
        <span
          className="wic"
          style={{
            background: `color-mix(in oklab, var(--p-${tint}) 16%, transparent)`,
            color: tint === "accent" ? "var(--p-accent-text)" : `var(--p-${tint})`,
          }}
        >
          <KIcon name={icon} size={19} />
        </span>
        <KIcon name="ChevronRight" size={16} className="wnav" />
      </div>
      <div className="wl">{label}</div>
      <div className="wv">{value}</div>
      <div className="wsub">{sub}</div>
    </Link>
  );
}

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
  const [newOpen, setNewOpen] = useState(false);
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

  const newLinks: { href: string; icon: string; label: string }[] = [
    { href: "/m/incidents/new", icon: "TriangleAlert", label: L.qaReport },
    { href: "/m/advances", icon: "ClipboardList", label: L.qaAdvance },
    { href: "/m/clock", icon: "Timer", label: L.qaClock },
    { href: "/m/time-off", icon: "CalendarOff", label: "Time Off" },
    { href: "/m/handover", icon: "ArrowLeftRight", label: "Handover" },
    { href: "/m/daily-log", icon: "StickyNote", label: "Daily Log" },
  ];

  return (
    <div className="screen screen-anim" style={{ position: "relative" }}>
      <div className="scr-eye">{greeting}</div>
      <h1 className="scr-h">{L.title}</h1>

      {/* Clock widget — links to the punch surface. */}
      <Link href="/m/clock" className="te-clock tap" style={{ display: "block", textDecoration: "none" }}>
        <div
          className="wl"
          style={{
            justifyContent: "center",
            color: "rgba(255,255,255,.6)",
            fontFamily: "var(--p-mono)",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {L.clockTitle}
        </div>
        <div className="tcv">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
        <span className="ps-btn ps-btn--cta" style={{ pointerEvents: "none" }}>
          <KIcon name="Play" size={16} /> {L.clockSub}
        </span>
      </Link>

      {/* AI Copilot row — links to the assistant. */}
      <Link href="/m/inbox" className="copilot tap" style={{ textDecoration: "none" }}>
        <span
          className="qi"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            background: "color-mix(in oklab, var(--p-accent) 18%, transparent)",
            color: "var(--p-accent-text)",
          }}
        >
          <KIcon name="Sparkles" size={19} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="cop-t">{L.copilotTitle}</div>
          <div className="cop-s">{L.copilotSub}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </Link>

      {/* Count widgets. */}
      <div className="sech">
        <h2>{L.widgets}</h2>
      </div>
      <div className="widgets">
        <Widget
          href="/m/tasks"
          icon="ListChecks"
          tint="info"
          label={L.wTasks}
          value={data.openTasks}
          sub={L.wTasksSub}
        />
        <Widget
          href="/m/advances"
          icon="ClipboardList"
          tint="warning"
          label={L.wAdvances}
          value={data.myAdvances}
          sub={L.wAdvancesSub}
        />
        <Widget
          href="/m/inbox"
          icon="MessageSquare"
          tint="accent"
          label={L.wUnread}
          value={data.unread}
          sub={L.wUnreadSub}
        />
        <Widget
          href="/m/wallet"
          icon="Wallet"
          tint="success"
          label="Wallet"
          value={data.myAdvances}
          sub="Passes · Credentials"
        />
      </div>

      {/* COMPVSS Rose — links to the wallet. */}
      <div className="sech">
        <h2>Member Pass</h2>
      </div>
      <Link href="/m/wallet" style={{ textDecoration: "none", display: "block" }}>
        <RoseCard compact />
      </Link>

      {/* Quick actions. */}
      <div className="sech">
        <h2>{L.quickActions}</h2>
      </div>
      <div className="qa">
        <QA href="/m/incidents/new" icon="TriangleAlert" tint="danger" label={L.qaReport} />
        <QA href="/m/check-in" icon="ScanLine" tint="accent" label={L.qaScan} />
        <QA href="/m/clock" icon="Timer" tint="info" label={L.qaClock} />
        <QA href="/m/advances" icon="ClipboardList" tint="warning" label={L.qaAdvance} />
        <QA href="/m/requests" icon="CheckCheck" tint="success" label={L.qaApprove} badge={data.openTasks || undefined} />
        <QA href="/m/expenses" icon="Receipt" tint="info" label={L.qaExpense} />
        <QA href="/m/swaps" icon="ArrowLeftRight" tint="info" label={L.qaSwap} />
        <QA href="/m/connections" icon="UserPlus" tint="accent" label={L.qaInvite} />
      </div>

      {/* Toolbox — field utilities (unit/ops/OSHA/weather/radio/checklists) in a
          bottom sheet. Mirrors the kit reference's home Toolbox grid. */}
      <div className="sech">
        <h2>Toolbox</h2>
      </div>
      <div className="qa">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span
              className="qi"
              style={{
                background: `color-mix(in oklab, var(--p-${tool.tint}) ${tool.tint === "accent" ? 20 : 14}%, transparent)`,
                color: tool.tint === "accent" ? "var(--p-accent-text)" : `var(--p-${tool.tint})`,
              }}
            >
              <KIcon name={tool.icon} size={18} />
            </span>
            <span className="ql">{tool.label}</span>
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

      {/* FAB → "new" sheet. */}
      <button type="button" className="fab" onClick={() => setNewOpen(true)} aria-label={L.newSheet}>
        <KIcon name="Plus" size={24} />
      </button>

      {newOpen ? (
        <div
          onClick={() => setNewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "var(--p-surface)",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: "18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)",
              boxShadow: "var(--p-elev-2, var(--p-elev-1))",
            }}
          >
            <div className="scr-eye">{L.newSheetBody}</div>
            <h2 className="scr-h" style={{ fontSize: 22, margin: "8px 0 14px" }}>
              {L.newSheet}
            </h2>
            <div className="qa" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {newLinks.map((l) => (
                <Link key={l.href} href={l.href} style={{ textDecoration: "none" }} onClick={() => setNewOpen(false)}>
                  <span
                    className="qi"
                    style={{
                      background: "var(--p-bg)",
                      border: "1px solid var(--p-border)",
                      color: "var(--p-text-2)",
                    }}
                  >
                    <KIcon name={l.icon} size={18} />
                  </span>
                  <span className="ql">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTool ? (
        <ToolSheet toolId={activeTool} onClose={() => setActiveTool(null)} toast={toolToast} />
      ) : null}
    </div>
  );
}
