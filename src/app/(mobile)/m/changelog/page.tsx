import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-static";

/**
 * COMPVSS · What's New — a static changelog. Mirrors the prototype's CHANGELOG
 * + CL_META (forms.jsx app source): release blocks with per-note tone tags
 * (New / Improved / Fixed). No backing table — this is hand-curated copy.
 */
type NoteKind = "new" | "imp" | "fix";
type Release = { v: string; date: string; tag?: string; tone?: string; notes: [NoteKind, string][] };

const CHANGELOG: Release[] = [
  {
    v: "2.4.0",
    date: "Jun 18, 2026",
    tag: "Latest",
    tone: "ok",
    notes: [
      ["new", "Asset Catalog module — browse & request from the XPMS catalog"],
      ["new", "Advance requests now use a cart/checkout flow with item photos"],
      ["imp", "Bespoke report forms (Incident, Lost & Found, Maintenance)"],
      ["imp", "Severity tiers reordered most-urgent-first with color coding"],
    ],
  },
  {
    v: "2.3.0",
    date: "Jun 4, 2026",
    notes: [
      ["new", "Team Roster & Company Directory split into separate modules"],
      ["new", "Badges & kudos — tiered recognition on your profile"],
      ["imp", "Context-aware event detail pages (shift / meeting / training / run of show)"],
      ["fix", "NFC scan frame sizing on Access & POS modes"],
    ],
  },
  {
    v: "2.2.0",
    date: "May 21, 2026",
    notes: [
      ["new", "My Pass — universal credential with access, catering & shuttle linking"],
      ["new", "Offline sync mode with queued-change tracking"],
      ["imp", "Schedule calendar view with type filters"],
    ],
  },
  {
    v: "2.1.0",
    date: "May 7, 2026",
    notes: [
      ["new", "In-app Inbox with channels, DMs & swipe actions"],
      ["fix", "Clock-in geofence accuracy near gate perimeters"],
    ],
  },
];

const CL_META: Record<NoteKind, { label: string; bg: string }> = {
  new: { label: "New", bg: "var(--p-success)" },
  imp: { label: "Improved", bg: "var(--p-info)" },
  fix: { label: "Fixed", bg: "var(--p-text-3)" },
};

export default async function ChangelogPage() {
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.changelog.eyebrow", undefined, "COMPVSS Field")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.changelog.title", undefined, "What's New")}
      </h1>

      {CHANGELOG.map((rel) => (
        <div key={rel.v} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 18 }}>v{rel.v}</span>
            {rel.tag && <span className={`ps-badge ps-badge--${rel.tone ?? "neutral"}`}>{rel.tag}</span>}
            <span style={{ marginLeft: "auto", fontFamily: "var(--p-mono)", fontSize: 11, color: "var(--p-text-3)" }}>
              {rel.date}
            </span>
          </div>
          {rel.notes.map(([k, txt], j) => {
            const m = CL_META[k];
            return (
              <div key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "5px 0" }}>
                <span
                  style={{
                    fontFamily: "var(--p-mono)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--p-on-strong)",
                    background: m.bg,
                    padding: "2px 6px",
                    borderRadius: 5,
                    flex: "none",
                    marginTop: 1,
                    minWidth: 54,
                    textAlign: "center",
                  }}
                >
                  {m.label}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.45, color: "var(--p-text-2)" }}>{txt}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div className="hint" style={{ textAlign: "center", padding: "4px 0 8px" }}>
        {t("m.changelog.build", undefined, "COMPVSS Field · Build 2406.18")}
      </div>
    </div>
  );
}
