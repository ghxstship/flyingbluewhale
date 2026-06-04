import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { RunActions } from "./RunActions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  actual_depart: string | null;
  actual_arrive: string | null;
  manifest: unknown;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
};

type ManifestEntry = {
  name?: string;
  role?: string;
  phone?: string;
  pickup?: string;
  dropoff?: string;
  notes?: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_transit: "info",
  arrived: "success",
  delayed: "warning",
  cancelled: "error",
};

function parseManifest(raw: unknown): ManifestEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is ManifestEntry => typeof x === "object" && x !== null);
}

export default async function Page({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("m.driver.run.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.time(iso);
  };
  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status, scheduled_depart, scheduled_arrive, actual_depart, actual_arrive, manifest, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("id", runId)
    .eq("org_id", session.orgId)
    .eq("driver_id", session.userId)
    .maybeSingle();

  const run = data as unknown as RunRow | null;
  if (!run) notFound();

  const manifest = parseManifest(run.manifest);
  const tone = STATUS_TONE[run.status] ?? "muted";

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/driver" className="text-xs text-[var(--text-muted)]">
        {t("m.driver.run.backToToday", undefined, "← Today's runs")}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
            {t("m.driver.run.eyebrow", undefined, "Run")}
          </div>
          <h1 className="mt-1 text-xl leading-tight font-semibold">
            {run.origin?.name ?? "—"} → {run.destination?.name ?? "—"}
          </h1>
          <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            <span>{run.fleet}</span>
            {run.vehicle_ref && <span>· {run.vehicle_ref}</span>}
          </div>
        </div>
        <Badge variant={tone}>{toTitle(run.status)}</Badge>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-2">
        <div className="surface p-3">
          <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.driver.run.depart", undefined, "Depart")}
          </div>
          <div className="mt-1 font-mono text-base tabular-nums">{fmtTime(run.scheduled_depart)}</div>
          {run.actual_depart && (
            <div className="mt-0.5 font-mono text-[10px] text-[var(--color-success)]">
              {t(
                "m.driver.run.actualPrefix",
                { time: fmtTime(run.actual_depart) },
                `actual ${fmtTime(run.actual_depart)}`,
              )}
            </div>
          )}
        </div>
        <div className="surface p-3">
          <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.driver.run.arrive", undefined, "Arrive")}
          </div>
          <div className="mt-1 font-mono text-base tabular-nums">{fmtTime(run.scheduled_arrive)}</div>
          {run.actual_arrive && (
            <div className="mt-0.5 font-mono text-[10px] text-[var(--color-success)]">
              {t(
                "m.driver.run.actualPrefix",
                { time: fmtTime(run.actual_arrive) },
                `actual ${fmtTime(run.actual_arrive)}`,
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t("m.driver.run.manifestHeading", { count: manifest.length }, `Manifest · ${manifest.length}`)}
        </h2>
        {manifest.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t("m.driver.run.noPassengers", undefined, "No passengers listed.")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {manifest.map((m, i) => (
              <li key={i} className="surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {m.name ?? t("m.driver.run.passengerFallback", { index: i + 1 }, `Passenger ${i + 1}`)}
                    </div>
                    {m.role && <div className="text-xs text-[var(--text-muted)]">{m.role}</div>}
                  </div>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="font-mono text-xs text-[var(--org-primary)]">
                      {m.phone}
                    </a>
                  )}
                </div>
                {(m.pickup || m.dropoff) && (
                  <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
                    {m.pickup && (
                      <span>{t("m.driver.run.pickupPrefix", { location: m.pickup }, `pickup ${m.pickup}`)}</span>
                    )}
                    {m.pickup && m.dropoff && <span> · </span>}
                    {m.dropoff && (
                      <span>{t("m.driver.run.dropoffPrefix", { location: m.dropoff }, `dropoff ${m.dropoff}`)}</span>
                    )}
                  </div>
                )}
                {m.notes && <p className="mt-1 text-xs text-[var(--text-secondary)]">{m.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <RunActions runId={run.id} status={run.status} />
      </section>
    </div>
  );
}
