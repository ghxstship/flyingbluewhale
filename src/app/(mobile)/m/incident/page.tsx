import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { SEVERITY_TONE } from "@/lib/tones";

export const dynamic = "force-dynamic";

/**
 * /m/incident — singular "My Incidents" view. Shows only the incidents
 * the caller filed, with a prominent quick-file CTA pointing at
 * /m/incident/new (the express one-field form). Distinct from
 * /m/incidents which shows the org-wide queue.
 */

type IncidentRow = {
  id: string;
  summary: string;
  severity: string;
  incident_state: string;
  location: string | null;
  occurred_at: string;
};

export default async function MyIncidentsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, incident_state, location, occurred_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as IncidentRow[];
  const openCount = rows.filter((r) => r.incident_state === "open" || r.incident_state === "investigating").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.incident.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.incident.title", undefined, "My Incidents")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.incident.subtitle", { count: openCount }, "Reports you filed. {count} open. See the org-wide queue at")}{" "}
        <a className="underline" href="/m/incidents">
          /m/incidents
        </a>
        .
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/m/incident/new" className="ps-btn ps-btn--sm">
          {t("m.incident.quickFile", undefined, "Quick-file — One Field")}
        </Link>
        <Link href="/m/incidents/new" className="ps-btn ps-btn--ghost ps-btn--sm">
          {t("m.incident.fullReport", undefined, "Full report")}
        </Link>
      </div>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.incident.empty.title", undefined, "No Reports Yet")}
              description={t(
                "m.incident.empty.description",
                undefined,
                "Anything you file from this screen or /m/incidents/new appears here.",
              )}
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link href={`/m/incidents`} className="surface block p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={SEVERITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{fmt.date(r.occurred_at)}</span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-sm font-semibold">{r.summary}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--p-text-2)]">
                  <Badge variant={r.incident_state === "closed" ? "muted" : "info"}>{toTitle(r.incident_state)}</Badge>
                  {r.location && <span className="font-mono">{r.location}</span>}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
