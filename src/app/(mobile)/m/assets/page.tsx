import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import { CATALOG_KIND_LABEL } from "@/lib/db/assignments";
import { fulfillmentStateLabels, prettyState } from "../advances/_shared";
import { AssetsView, type AssetRow } from "./AssetsView";

/**
 * COMPVSS · Assets — the 5th tab (kit 28, `TABS[4]`).
 *
 * "Your assigned gear", not the org's stock on hand. The tab used to point at
 * `/m/inventory`, which is a different surface answering a different question
 * (what does the org have?) — a crew member opening Assets wants to know what
 * *they* are holding and when it goes back.
 *
 * Backed by `assignments` (party = the caller), which is the advancing canon's
 * per-individual store. The kit's seed shows this exactly: Credential · AAA,
 * Radio · Motorola R7, Meal Voucher · Crew — one row per issued thing.
 */
export const dynamic = "force-dynamic";

/** Kit row shape: title is `Category · Type`, sub carries state + return time. */
function titleFor(kind: string, name: string | null): string {
  const cat = CATALOG_KIND_LABEL[kind as keyof typeof CATALOG_KIND_LABEL] ?? kind;
  return name ? `${cat} · ${name}` : cat;
}

/** Kit tones: issued/held = info ("Out"), delivered/redeemed = ok, else neutral.
 *  `out` is the data flag AssetsView keys the Check-In swipe off — the display
 *  string is translated by the caller, never compared. */
function toneFor(state: string): { tone: AssetRow["tone"]; timeKey: "out" | "ok" | "in" | "gone" | "dot"; out: boolean } {
  switch (state) {
    case "issued":
    case "transferred":
      return { tone: "info", timeKey: "out", out: true };
    case "delivered":
    case "redeemed":
    case "approved":
      return { tone: "ok", timeKey: "ok", out: false };
    case "returned":
      return { tone: "neutral", timeKey: "in", out: false };
    case "expired":
    case "voided":
      return { tone: "danger", timeKey: "gone", out: false };
    default:
      return { tone: "neutral", timeKey: "dot", out: false };
  }
}

export default async function AssetsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.assets.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const rows = await listMyAssignments(session.orgId, session.userId, { limit: 200 });

  const stateLabels = fulfillmentStateLabels(t);
  const timeLabel: Record<"out" | "ok" | "in" | "gone" | "dot", string> = {
    out: t("m.assets.badge.out", undefined, "Out"),
    ok: "✓",
    in: t("m.assets.badge.in", undefined, "In"),
    gone: "—",
    dot: "·",
  };

  const assets: AssetRow[] = rows.map((r) => {
    const kind = String(r.catalog_kind ?? "");
    // `title` is the assignment's own label (the catalog SKU name is
    // denormalised onto it at insert). Kit row = `Category · Type`.
    const name = r.title;
    const state = String(r.fulfillment_state ?? "");
    const { tone, timeKey, out } = toneFor(state);
    return {
      id: r.id,
      cat: CATALOG_KIND_LABEL[kind as keyof typeof CATALOG_KIND_LABEL] ?? kind,
      title: titleFor(kind, name),
      // Kit sub-line: state + the thing the crew member actually needs, which
      // is when it goes back.
      sub: stateLabels[state] ?? prettyState(state),
      tag: r.id.slice(0, 8).toUpperCase(),
      tone,
      time: timeLabel[timeKey],
      out,
    };
  });

  return (
    <AssetsView
      rows={assets}
      eyebrow={t("m.assets.eyebrow", { count: assets.length }, `${assets.length} Assigned`)}
      title={t("m.assets.title", undefined, "My Assets")}
    />
  );
}
