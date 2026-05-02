import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function MobileMedicPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

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
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Medic</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? "No encounters logged in the last 24h."
          : `${rows.length} in last 24h${open ? ` · ${open} open` : ""}`}
      </p>

      <Link href="/m/medic/new" className="btn btn-primary mt-5 w-full">
        + New Encounter
      </Link>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Encounters Yet"
              description="Encounters you log here are PHI-encrypted and visible only to medical staff."
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.patient_ref ?? "Anon patient"}</div>
                  {r.chief_complaint && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{r.chief_complaint}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.triage && <Badge variant={TRIAGE_TONE[r.triage.toLowerCase()] ?? "muted"}>{r.triage}</Badge>}
                    {r.disposition && <Badge variant="success">{r.disposition.replace(/_/g, " ")}</Badge>}
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
