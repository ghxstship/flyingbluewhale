import Link from "next/link";
import { Repeat } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { HANDOVER_MARKER } from "./shared";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Shift Handover — end-of-shift report passing status, open items and
 * assets to the next crew. No dedicated table: handovers are persisted as
 * marked notes on `daily_logs` (see actions.ts). This page lists prior
 * handovers parsed back out of those notes and links to the new-handover form.
 */
type LogRow = { id: string; log_date: string | null; notes: string | null };

type Handover = { key: string; date: string | null; line: string; body: string };

const STATUS_TONE: Record<string, string> = {
  "All Clear": "ok",
  "Watch Items": "warn",
  Issues: "danger",
};

const TONE_VAR: Record<string, string> = {
  ok: "var(--p-success)",
  warn: "var(--p-warning)",
  danger: "var(--p-danger)",
  neutral: "var(--p-border)",
};

/** Pull the marked handover blocks out of a daily_logs notes field. */
function parseHandovers(rows: LogRow[]): Handover[] {
  const out: Handover[] = [];
  for (const r of rows) {
    const notes = r.notes ?? "";
    if (!notes.includes(HANDOVER_MARKER)) continue;
    const blocks = notes.split("\n\n").filter((b) => b.includes(HANDOVER_MARKER));
    blocks.forEach((b, i) => {
      const linesArr = b.split("\n");
      const header = (linesArr[0] ?? "").replace(HANDOVER_MARKER, "").trim();
      out.push({ key: `${r.id}-${i}`, date: r.log_date, line: header, body: linesArr.slice(1).join("\n") });
    });
  }
  return out;
}

export default async function HandoverPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("id, log_date, notes")
    .eq("org_id", session.orgId)
    .order("log_date", { ascending: false })
    .limit(60);
  const handovers = parseHandovers((data ?? []) as LogRow[]);
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.handover.eyebrow", undefined, "Shift")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.handover.title", undefined, "Handover")}
      </h1>

      <Link
        href="/m/handover/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
      >
        <KIcon name="Repeat" size={16} /> {t("m.handover.new", undefined, "New Handover")}
      </Link>

      <div className="sech">
        <h2>{t("m.handover.prior", undefined, "Recent Handovers")}</h2>
      </div>
      {handovers.length === 0 ? (
        <EmptyState
          icon={<Repeat size={28} aria-hidden="true" />}
          title={t("m.handover.emptyTitle", undefined, "No Handovers")}
          description={t("m.handover.emptyBody", undefined, "Submit an end-of-shift handover to start the trail.")}
        />
      ) : (
        handovers.map((h) => {
          const statusKey = h.line.split(" —")[0] ?? "";
          const tone = STATUS_TONE[statusKey] ?? "neutral";
          return (
            <div className="item" key={h.key} style={{ alignItems: "flex-start" }}>
              <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{h.line || t("m.handover.untitled", undefined, "Handover")}</div>
                <div className="s" style={{ whiteSpace: "pre-wrap" }}>
                  {h.body}
                </div>
                <div className="hint">
                  {h.date
                    ? new Date(h.date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
                {statusKey || "—"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
