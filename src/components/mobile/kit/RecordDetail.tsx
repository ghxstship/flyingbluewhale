"use client";

/* COMPVSS Field — generic record-level detail view. Read fields + sections,
   a CRUD/contextual action bar (RBAC-filtered by the caller), and an inline
   confirm for destructive actions. Ported from the prototype RecordDetail. */

import { useState } from "react";
import type { ReactNode } from "react";
import { KIcon } from "./icon";

// Map prototype Badge tone names → repo kit badge classes.
function badgeClass(tone?: string): string {
  switch (tone) {
    case "ok":
    case "success":
      return "ps-badge ps-badge--ok";
    case "warn":
    case "warning":
      return "ps-badge ps-badge--warn";
    case "info":
      return "ps-badge ps-badge--info";
    case "danger":
      return "ps-badge ps-badge--danger";
    case "accent":
      return "ps-badge ps-badge--accent";
    default:
      return "ps-badge ps-badge--neutral";
  }
}

function btnClass(a: RecordAction, primary: boolean): string {
  if (primary) {
    const v = a.variant || "cta";
    return `ps-btn ps-btn--${v} ps-btn--lg`;
  }
  return `ps-btn ${a.danger ? "ps-btn--danger" : "ps-btn--secondary"} ps-btn--lg`;
}

export type RecordStatus = { tone?: string; label: string };
export type RecordField = { k: ReactNode; v: ReactNode; full?: boolean };
export type RecordRow = { icon?: string; t: ReactNode; s?: ReactNode; right?: ReactNode; on?: () => void };
export type RecordTimelineEntry = { icon: string; txt: ReactNode; time: ReactNode };
export type RecordSection = {
  h: ReactNode;
  action?: { label: ReactNode; on?: () => void };
  text?: ReactNode;
  node?: ReactNode;
  rows?: RecordRow[];
  timeline?: RecordTimelineEntry[];
};
export type RecordAction = {
  label: ReactNode;
  icon?: string;
  primary?: boolean;
  danger?: boolean;
  variant?: string;
  confirmText?: ReactNode;
  on?: () => void;
};
export type RecordComment = {
  who: string;
  time: ReactNode;
  text: ReactNode;
  mentions?: string[];
};

export type RecordDetailProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  icon?: string;
  status?: RecordStatus;
  fields?: RecordField[];
  tags?: string[];
  sections?: RecordSection[];
  actions?: RecordAction[];
  comments?: RecordComment[];
  people?: string[];
  onComment?: (text: string, tagged: string[]) => void;
  onClose: () => void;
};

export function RecordDetail({
  eyebrow,
  title,
  icon,
  status,
  fields = [],
  tags,
  sections = [],
  actions = [],
  comments,
  people = [],
  onComment,
  onClose,
}: RecordDetailProps) {
  const [confirm, setConfirm] = useState<RecordAction | null>(null); // pending destructive action
  const [draft, setDraft] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [tagOpen, setTagOpen] = useState(false);
  const postComment = () => {
    if (!draft.trim()) return;
    onComment && onComment(draft.trim(), tagged);
    setDraft("");
    setTagged([]);
    setTagOpen(false);
  };

  const run = (a: RecordAction) => {
    if (a.danger) {
      setConfirm(a);
    } else {
      a.on && a.on();
    }
  };
  const primary = actions.filter((a) => a.primary);
  const secondary = actions.filter((a) => !a.primary);

  return (
    <div className="formscreen">
      <div className="form-top"><button type="button" className="backbtn" onClick={onClose}><KIcon name="ChevronLeft" size={17} /> Back</button></div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        {icon && <span className="form-ic"><KIcon name={icon} size={20} /></span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div className="scr-eye" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          <h1 className="scr-h" style={{ margin: 0 }}>{title}</h1>
        </div>
        {status && <span className={badgeClass(status.tone)}>{status.label}</span>}
      </div>

      {primary.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {primary.map((a, i) => (
            <button key={i} type="button" className={btnClass(a, true)} style={{ flex: 1, justifyContent: "center" }} onClick={() => run(a)}>{a.icon && <KIcon name={a.icon} size={16} />} {a.label}</button>
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <div className="rec-grid">
          {fields.map((f, i) => (
            <div className="rec-cell" key={i} style={f.full ? { gridColumn: "1 / -1" } : undefined}>
              <div className="rec-k">{f.k}</div>
              <div className="rec-v">{f.v}</div>
            </div>
          ))}
        </div>
      )}

      {tags && tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>{tags.map((t) => <span key={t} className="tag-chip">{t}</span>)}</div>
      )}

      {sections.map((s, i) => (
        <div key={i}>
          <div className="sech"><h2>{s.h}</h2>{s.action && <button type="button" className="sech-link" onClick={s.action.on}>{s.action.label}</button>}</div>
          {s.text && <p className="form-intro" style={{ marginBottom: 8 }}>{s.text}</p>}
          {s.node}
          {s.rows && s.rows.map((r, j) => (
            <div className="item" key={j} style={{ cursor: r.on ? "pointer" : "default" }} onClick={r.on}>
              {r.icon && <KIcon name={r.icon} size={18} style={{ color: "var(--p-text-2)" }} />}
              <div><div className="t">{r.t}</div>{r.s && <div className="s">{r.s}</div>}</div>
              {r.right && <><span className="sp" />{r.right}</>}
            </div>
          ))}
          {s.timeline && (
            <div className="tl">
              {s.timeline.map((a, j) => (
                <div className="tl-row" key={j}><span className="tdot"><KIcon name={a.icon} size={7} /></span><div><div className="ttxt">{a.txt}</div><div className="ttime">{a.time}</div></div></div>
              ))}
            </div>
          )}
        </div>
      ))}

      {onComment && (
        <div>
          <div className="sech"><h2>Comments</h2>{comments && comments.length ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{comments.length}</span> : null}</div>
          {(comments || []).map((c, j) => (
            <div className="item" key={j} style={{ alignItems: "flex-start" }}>
              <span className="avatar-sm" style={{ flex: "none" }}>{c.who.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}><div className="t" style={{ fontSize: 13 }}>{c.who}</div><span className="s" style={{ fontSize: 11 }}>{c.time}</span></div>
                <div className="s" style={{ color: "var(--p-text-2)", marginTop: 2 }}>{c.mentions && c.mentions.length ? c.mentions.map((m) => <span key={m} style={{ color: "var(--p-accent-text)", fontWeight: 600 }}>@{m} </span>) : null}{c.text}</div>
              </div>
            </div>
          ))}
          {tagged.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 6px" }}>{tagged.map((t) => <span key={t} className="tag-chip" onClick={() => setTagged((s) => s.filter((x) => x !== t))} style={{ cursor: "pointer" }}>@{t} <KIcon name="X" size={11} /></span>)}</div>}
          {tagOpen && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {people.filter((p) => !tagged.includes(p)).map((p) => <button key={p} type="button" className="ps-pill" onClick={() => setTagged((s) => [...s, p])} style={{ border: "1px solid var(--p-border)", background: "var(--p-surface)", borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{p}</button>)}
            </div>
          )}
          <div className="composer" style={{ position: "static", borderTop: "none", padding: 0, marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={() => setTagOpen((o) => !o)} aria-label="Tag people" style={{ flex: "none", width: 40, height: 40, borderRadius: 50, border: "1px solid var(--p-border)", background: tagOpen ? "var(--p-accent)" : "var(--p-surface)", color: tagOpen ? "#1f0e03" : "var(--p-text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><KIcon name="AtSign" size={17} /></button>
            <input className="box" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") postComment(); }} placeholder="Add a comment…" style={{ flex: 1, border: "1px solid var(--p-border)", borderRadius: 20, padding: "10px 15px", fontSize: 13.5, background: "var(--p-surface)" }} />
            <button type="button" onClick={postComment} aria-label="Post" style={{ flex: "none", border: "none", background: "var(--p-accent)", color: "#1f0e03", width: 40, height: 40, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><KIcon name="ArrowUp" size={18} /></button>
          </div>
        </div>
      )}

      {secondary.length > 0 && (
        <>
          <div className="sech"><h2>Manage</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {secondary.map((a, i) => (
              <button key={i} type="button" className={btnClass(a, false)} style={{ width: "100%", justifyContent: "center" }} onClick={() => run(a)}>{a.icon && <KIcon name={a.icon} size={15} />} {a.label}</button>
            ))}
          </div>
        </>
      )}

      {confirm && (
        <div className="sheet">
          <div className="sheet-bg" onClick={() => setConfirm(null)} />
          <div className="sheet-panel">
            <div className="sheet-grip" />
            <h2 style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 18, margin: "4px 0 8px" }}>{confirm.label}?</h2>
            <p className="form-intro">{confirm.confirmText || "This can't be undone."}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="ps-btn ps-btn--danger ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => { const a = confirm; setConfirm(null); a.on && a.on(); }}>{confirm.label}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
