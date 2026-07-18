import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Fab, KIcon } from "@/components/mobile/kit";
import { IncidentsList, type IncidentItem } from "./IncidentsList";

/**
 * The ONE shared Incident Report surface (kit 29 §C route policy, directive
 * 2026-07-17). `/m/incidents` is the canonical route; `/m/incident` is an
 * alias rendering this same surface preset to the "My Reports" filter (the
 * two were divergent duplicates: singular = My Incidents, plural = org
 * queue — the personal view survives as a filter of the shared queue, not a
 * separate surface).
 *
 * Reads `incidents` org-scoped (soft-delete-aware), marks the caller's own
 * reports, and hands plain rows to the `IncidentsList` client leaf (kit
 * ActionBar: search + sort + severity/state/mine filters). The FAB routes to
 * the kit `incident` FormScreen; the express one-field quick-file stays a
 * live route at `/m/incident/new` (header action + /m/support entry).
 */
type IncidentRow = {
  id: string;
  summary: string | null;
  severity: string | null;
  incident_state: string | null;
  occurred_at: string | null;
  location: string | null;
  photos: unknown;
  reporter_id: string | null;
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

export async function IncidentSurface({ initialMine = false }: { initialMine?: boolean }) {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, incident_state, occurred_at, location, photos, reporter_id")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false });
  const rows = (data ?? []) as IncidentRow[];
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
      mine: r.reporter_id === session.userId,
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.incidents.eyebrow", undefined, "Safety")}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <h1 className="scr-h" style={{ marginBottom: 0, flex: 1, minWidth: 0 }}>
          {t("m.incidents.title", undefined, "Incidents")}
        </h1>
        <Link
          href="/m/incident/new"
          className="ps-btn ps-btn--tertiary ps-btn--sm"
          style={{ flex: "none", textDecoration: "none" }}
        >
          <KIcon name="Zap" size={14} /> {t("m.incident.quickFile", undefined, "Quick File")}
        </Link>
      </div>

      <IncidentsList items={items} initialMine={initialMine} />

      <Fab href="/m/incidents/new" label={t("m.incidents.file", undefined, "File Report")} />
    </div>
  );
}
