import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EncounterRow = {
  id: string;
  patient_ref: string | null;
  triage: string | null;
  chief_complaint: string | null;
  disposition: string | null;
  created_at: string;
  venue: { name: string | null } | null;
};

const TRIAGE_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  green: "muted",
  yellow: "warning",
  red: "error",
  black: "error",
  immediate: "error",
  delayed: "warning",
  minor: "muted",
};

export default async function MobileMedicPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
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
    if (min < 1) return t("common.relativeTime.justNow", undefined, "just now");
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  };
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("medical_encounters")
    .select("id, patient_ref, triage, chief_complaint, disposition, created_at, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .eq("clinician_id", session.userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = (data ?? []) as unknown as EncounterRow[];

  const open = rows.filter((r) => !r.disposition).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        {t("m.medic.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.medic.title", undefined, "Medic")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? t("m.medic.empty24h", undefined, "No encounters logged in the last 24h.")
          : `${t("m.medic.countIn24h", { count: rows.length }, `${rows.length} in last 24h`)}${open ? ` · ${t("m.medic.openCount", { count: open }, `${open} open`)}` : ""}`}
      </p>

      <Link href="/m/medic/new" className="btn btn-primary mt-5 w-full">
        {t("m.medic.newEncounter", undefined, "+ New Encounter")}
      </Link>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.medic.emptyState.title", undefined, "No Encounters Yet")}
              description={t(
                "m.medic.emptyState.description",
                undefined,
                "Encounters you log here are PHI-encrypted and visible only to medical staff.",
              )}
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {r.patient_ref ?? t("m.medic.anonPatient", undefined, "Anon patient")}
                  </div>
                  {r.chief_complaint && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{r.chief_complaint}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.triage && <Badge variant={TRIAGE_TONE[r.triage.toLowerCase()] ?? "muted"}>{r.triage}</Badge>}
                    {r.disposition && <Badge variant="success">{toTitle(r.disposition)}</Badge>}
                    {r.venue?.name && <Badge variant="muted">{r.venue.name}</Badge>}
                  </div>
                </div>
                <span className="flex-none font-mono text-xs text-[var(--text-muted)]">
                  {relativeTime(r.created_at)}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
