import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · My Incidents — the incidents filed BY the current user (distinct
 * from `/m/incidents`, the org-wide Ops queue). Express quick-file lives at
 * `/m/incident/new`.
 */
type IncidentRow = {
  id: string;
  summary: string | null;
  severity: string | null;
  incident_state: string | null;
  occurred_at: string | null;
  location: string | null;
};

const SEV_TONE: Record<string, string> = {
  critical: "danger",
  major: "danger",
  minor: "warn",
  near_miss: "info",
};

const STATE_TONE: Record<string, string> = {
  open: "danger",
  investigating: "warn",
  resolved: "ok",
  closed: "neutral",
};

const TONE_VAR: Record<string, string> = {
  danger: "var(--p-danger)",
  warn: "var(--p-warning)",
  ok: "var(--p-success)",
  info: "var(--p-info)",
  neutral: "var(--p-border)",
};

export default async function MyIncidentPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, incident_state, occurred_at, location")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as IncidentRow[];
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.incident.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.incident.title", undefined, "My Incidents")}
      </h1>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} aria-hidden="true" />}
          title={t("m.incident.empty", undefined, "Nothing Filed")}
          description={t("m.incident.emptyBody", undefined, "You haven't filed any incident reports.")}
        />
      ) : (
        rows.map((r) => {
          const sevTone = SEV_TONE[r.severity ?? ""] ?? "neutral";
          const stTone = STATE_TONE[r.incident_state ?? ""] ?? "neutral";
          return (
            <div className="item" key={r.id}>
              <span className="bar" style={{ background: TONE_VAR[sevTone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.summary ?? t("m.incident.untitled", undefined, "Untitled Incident")}</div>
                <div className="s">
                  {r.location ? `${r.location} · ` : ""}
                  {r.occurred_at
                    ? new Date(r.occurred_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${stTone}`} style={{ flex: "none" }}>
                {r.incident_state ?? "—"}
              </span>
            </div>
          );
        })
      )}

      <Link href="/m/incident/new" className="fab" aria-label={t("m.incident.quickFile", undefined, "Quick File")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
