import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { urlFor } from "@/lib/urls";
import { SEVERITY_TONE, toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  location: string | null;
  summary: string;
  severity: string;
  incident_state: string;
};

export default async function MobileIncidentPage() {
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
  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60_000);
    if (min < 1) return t("common.justNow", undefined, "just now");
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("incidents")
    .select("id, occurred_at, location, summary, severity, incident_state")
    .eq("org_id", session.orgId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as IncidentRow[];

  const open = rows.filter((r) => !["resolved", "closed"].includes(r.incident_state)).length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.incidents.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.incidents.title", undefined, "Incident")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {rows.length === 0
          ? t("m.incidents.noneLast30", undefined, "No incidents logged in the last 30 days.")
          : `${t("m.incidents.summary", { count: rows.length, open }, `${rows.length} in last 30 days · ${open} open`)}${critical ? ` · ${t("m.incidents.criticalSuffix", { critical }, `${critical} critical`)}` : ""}`}
      </p>

      <Link href="/m/incidents/new" className="ps-btn mt-5 w-full">
        {t("m.incidents.reportCta", undefined, "+ Report incident")}
      </Link>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.incidents.empty.title", undefined, "All Quiet")}
              description={t(
                "m.incidents.empty.description",
                undefined,
                "Incidents reported here are routed to admin and EHS lead in real time.",
              )}
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link
                href={urlFor("platform", `/operations/incidents/${r.id}`)}
                className="surface flex items-start gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm leading-snug font-semibold">{r.summary}</div>
                    <span className="flex-none font-mono text-xs text-[var(--p-text-2)]">
                      {relativeTime(r.occurred_at)}
                    </span>
                  </div>
                  {r.location && <div className="mt-1 text-xs text-[var(--p-text-2)]">{r.location}</div>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={SEVERITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>
                    <Badge variant={toneFor(r.incident_state)}>{toTitle(r.incident_state)}</Badge>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
