import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import { CATALOG_KIND_LABEL } from "@/lib/db/assignments";
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

/** Kit tones: issued/held = info ("Out"), delivered/redeemed = ok, else neutral. */
function toneFor(state: string): { tone: AssetRow["tone"]; time: string } {
  switch (state) {
    case "issued":
    case "transferred":
      return { tone: "info", time: "Out" };
    case "delivered":
    case "redeemed":
    case "approved":
      return { tone: "ok", time: "✓" };
    case "returned":
      return { tone: "neutral", time: "In" };
    case "expired":
    case "voided":
      return { tone: "danger", time: "—" };
    default:
      return { tone: "neutral", time: "·" };
  }
}

export default async function AssetsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.assets.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const rows = await listMyAssignments(session.orgId, session.userId, { limit: 200 });

  const assets: AssetRow[] = rows.map((r) => {
    const kind = String(r.catalog_kind ?? "");
    // `title` is the assignment's own label (the catalog SKU name is
    // denormalised onto it at insert). Kit row = `Category · Type`.
    const name = r.title;
    const { tone, time } = toneFor(String(r.fulfillment_state ?? ""));
    return {
      id: r.id,
      cat: CATALOG_KIND_LABEL[kind as keyof typeof CATALOG_KIND_LABEL] ?? kind,
      title: titleFor(kind, name),
      // Kit sub-line: state + the thing the crew member actually needs, which
      // is when it goes back.
      sub: String(r.fulfillment_state ?? ""),
      tag: r.id.slice(0, 8).toUpperCase(),
      tone,
      time,
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
