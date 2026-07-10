import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { IncidentsList, type IncidentItem } from "./IncidentsList";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Incidents — the org-wide safety/security/medical incident queue.
 *
 * Server component: reads `incidents` org-scoped, maps each row to the kit
 * incident concept (summary · severity · incident_state · occurred_at ·
 * photos) and hands plain rows to the `IncidentsList` client leaf (kit
 * ActionBar: search + sort + severity/state filters). The "File Report" FAB
 * routes to the kit `incident` FormScreen.
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
  const fmt = await getRequestFormatters();

  const items: IncidentItem[] = rows.map((r) => {
    const sevTone = SEV_TONE[r.severity ?? ""] ?? "neutral";
    const stTone = STATE_TONE[r.incident_state ?? ""] ?? "neutral";
    const pc = photoCount(r.photos);
    const when = r.occurred_at
      ? fmt.dateParts(new Date(r.occurred_at), {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
    return {
      id: r.id,
      title: r.summary ?? t("m.incidents.untitled", undefined, "Untitled Incident"),
      meta: `${r.location ? `${r.location} · ` : ""}${when}${pc > 0 ? ` · ${pc} ${t("m.incidents.photos", undefined, "photos")}` : ""}`,
      severity: r.severity ?? "—",
      state: r.incident_state ?? "—",
      sevTone,
      stTone,
      barColor: TONE_VAR[sevTone] ?? "var(--p-accent)",
      sortAt: r.occurred_at ?? "",
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.incidents.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.incidents.title", undefined, "Incidents")}
      </h1>

      <IncidentsList items={items} />

      <Link href="/m/incidents/new" className="fab" aria-label={t("m.incidents.file", undefined, "File Report")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
