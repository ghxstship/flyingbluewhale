import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Incidents — the org-wide safety/security/medical incident queue.
 *
 * Server component: reads `incidents` org-scoped, maps each row to the kit
 * incident concept (summary · severity · incident_state · occurred_at ·
 * photos). The "File Report" FAB routes to the kit `incident` FormScreen.
 */
type IncidentRow = {
  id: string;
  summary: string | null;
  severity: string | null;
  incident_state: string | null;
  occurred_at: string | null;
  location: string | null;
  photos: unknown;
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

/** Map a ps-badge tone → a CSS color token for the `.item .bar` accent. */
const TONE_VAR: Record<string, string> = {
  danger: "var(--p-danger)",
  warn: "var(--p-warning)",
  ok: "var(--p-success)",
  info: "var(--p-info)",
  neutral: "var(--p-border)",
};

function photoCount(photos: unknown): number {
  return Array.isArray(photos) ? photos.length : 0;
}

export default async function IncidentsPage() {
  const session = await requireSession();
  const rows = (await listOrgScoped("incidents", session.orgId)) as unknown as IncidentRow[];
  const { t } = await getRequestT();

  const incidents = rows
    .slice()
    .sort((a, b) => String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? "")));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.incidents.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.incidents.title", undefined, "Incidents")}
      </h1>

      {incidents.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} aria-hidden="true" />}
          title={t("m.incidents.emptyTitle", undefined, "All Clear")}
          description={t("m.incidents.emptyBody", undefined, "No incidents logged for this org yet.")}
        />
      ) : (
        incidents.map((r) => {
          const sevTone = SEV_TONE[r.severity ?? ""] ?? "neutral";
          const stTone = STATE_TONE[r.incident_state ?? ""] ?? "neutral";
          const pc = photoCount(r.photos);
          return (
            <div className="item" key={r.id}>
              <span className="bar" style={{ background: TONE_VAR[sevTone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.summary ?? t("m.incidents.untitled", undefined, "Untitled Incident")}</div>
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
                  {pc > 0 ? ` · ${pc} ${t("m.incidents.photos", undefined, "photos")}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flex: "none" }}>
                <span className={`ps-badge ps-badge--${sevTone}`}>{r.severity ?? "—"}</span>
                <span className={`ps-badge ps-badge--${stTone}`}>{r.incident_state ?? "—"}</span>
              </div>
            </div>
          );
        })
      )}

      <Link href="/m/incidents/new" className="fab" aria-label={t("m.incidents.file", undefined, "File Report")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
