import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type VenueRow = {
  id: string;
  name: string;
  cluster: string | null;
  capacity: number | null;
  handover_state:
    | "not_started"
    | "in_progress"
    | "ready_for_handover"
    | "handed_over"
    | "complete"
    | "closed_out"
    | string;
};

const HANDOVER_TONE: Record<string, "muted" | "info" | "warning" | "success"> = {
  not_started: "muted",
  in_progress: "info",
  ready_for_handover: "warning",
  handed_over: "success",
  complete: "success",
  closed_out: "success",
};

export default async function MobileHandoverPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const venues = (await listOrgScoped("venues", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 200,
  })) as VenueRow[];

  // Bucket: needs walk (not_started + in_progress + ready_for_handover) vs done
  const open = venues.filter((v) => !["handed_over", "complete", "closed_out"].includes(v.handover_state));
  const done = venues.filter((v) => ["handed_over", "complete", "closed_out"].includes(v.handover_state));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.handover.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.handover.title", undefined, "Handover")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.handover.description",
          undefined,
          "Commissioning walks per venue. Tap into a venue on the desktop to mark its handover state.",
        )}
      </p>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("m.handover.needsWalk", undefined, "Needs walk")} · {open.length}
        </h2>
        <ul className="mt-3 space-y-2">
          {open.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title={t("m.handover.empty.title", undefined, "All Venues Handed Over")}
                description={t("m.handover.empty.description", undefined, "Nothing pending today.")}
              />
            </li>
          ) : (
            open.map((v) => (
              <li key={v.id}>
                <Link href={`/console/venues/${v.id}`} className="surface flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{v.name}</div>
                    <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {v.cluster ?? "—"} · {t("m.handover.capAbbrev", undefined, "cap")}{" "}
                      {v.capacity != null ? fmt.number(v.capacity) : "—"}
                    </div>
                  </div>
                  <Badge variant={HANDOVER_TONE[v.handover_state] ?? "muted"}>{toTitle(v.handover_state)}</Badge>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("m.handover.handedOver", undefined, "Handed over")} · {done.length}
          </h2>
          <ul className="mt-3 space-y-2">
            {done.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/console/venues/${v.id}`}
                  className="surface flex items-center justify-between p-3 opacity-70"
                >
                  <div className="text-sm">
                    <div className="font-medium">{v.name}</div>
                  </div>
                  <Badge variant="success">{toTitle(v.handover_state)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
