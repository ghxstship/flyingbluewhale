import { ScanLine } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Chain of Custody — a custody timeline for assets, read from
 * `assignment_events` (scan + state_change kinds). Each event is one handoff,
 * scan, or status move on an assignment; rendered newest-first as a `.tl`
 * timeline. Empty state when nothing's been scanned/transitioned yet.
 */
type EventRow = {
  id: string;
  event_kind: string | null;
  result: string | null;
  from_state: string | null;
  to_state: string | null;
  body: string | null;
  at: string | null;
  assignment: { title: string | null; catalog_kind: string | null } | null;
};

export default async function CocPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("assignment_events")
    .select(
      "id, event_kind, result, from_state, to_state, body, at, assignment:assignments(title, catalog_kind)",
    )
    .eq("org_id", session.orgId)
    .in("event_kind", ["scan", "state_change"])
    .order("at", { ascending: false })
    .limit(100);
  const events = (data ?? []) as unknown as EventRow[];

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.coc.eyebrow", undefined, "Assets")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.coc.title", undefined, "Chain of Custody")}
      </h1>

      {events.length === 0 ? (
        <EmptyState
          icon={<ScanLine size={28} aria-hidden="true" />}
          title={t("m.coc.emptyTitle", undefined, "No Custody Events")}
          description={t("m.coc.emptyBody", undefined, "Scans and asset handoffs will appear here as a timeline.")}
        />
      ) : (
        <div className="tl">
          {events.map((e) => {
            const isScan = e.event_kind === "scan";
            const title = e.assignment?.title ?? t("m.coc.asset", undefined, "Asset");
            const detail = isScan
              ? `${t("m.coc.scan", undefined, "Scan")} · ${e.result ?? "—"}`
              : `${e.from_state ?? "—"} → ${e.to_state ?? "—"}`;
            return (
              <div className="tl-row" key={e.id}>
                <span className="tdot" aria-hidden="true">
                  <KIcon name={isScan ? "ScanLine" : "ArrowRight"} size={9} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ttxt">{title}</div>
                  <div className="ttime">
                    {detail}
                    {e.assignment?.catalog_kind ? ` · ${e.assignment.catalog_kind}` : ""}
                  </div>
                  {e.body && <div className="hint">{e.body}</div>}
                  <div className="ttime">
                    {e.at
                      ? formatDateParts(
                          new Date(e.at),
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                          { timezone: "UTC" },
                        )
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
