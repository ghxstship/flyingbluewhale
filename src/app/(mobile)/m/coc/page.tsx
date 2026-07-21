import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { CocView, type CocEvent } from "./CocView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Chain of Custody — a custody timeline for assets, read from
 * `assignment_events` (scan + state_change kinds). Each event is one handoff,
 * scan, or status move on an assignment. Migrated onto the kit view engine
 * (see `CocView`): the newest-first `.tl` timeline is preserved, plus search,
 * the View Options / Share & Export drawers, and a catalog-kind context pill.
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

  // Flatten to the client view's shape — the client can't reach the DB, so
  // resolved asset titles + preformatted (UTC) dates are threaded in here.
  const items: CocEvent[] = events.map((e) => ({
    id: e.id,
    title: e.assignment?.title ?? t("m.coc.asset", undefined, "Asset"),
    event_kind: e.event_kind ?? "state_change",
    catalog_kind: e.assignment?.catalog_kind ?? null,
    result: e.result,
    from_state: e.from_state,
    to_state: e.to_state,
    body: e.body,
    dateLabel: e.at
      ? formatDateParts(
          new Date(e.at),
          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
          { timezone: "UTC" },
        )
      : "",
    iso: e.at ? e.at.slice(0, 10) : null,
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.coc.eyebrow", undefined, "Assets")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.coc.title", undefined, "Chain of Custody")}
      </h1>

      <CocView items={items} />
    </div>
  );
}
