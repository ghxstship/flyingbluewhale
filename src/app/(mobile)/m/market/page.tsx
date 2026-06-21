import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { MarketView } from "./MarketView";

export const dynamic = "force-dynamic";

/**
 * /m/market — crew Marketplace. There is no generic peer-to-peer listings table
 * in the schema (the prototype's LISTINGS is mock data), so we render an honest
 * EmptyState with a "List an item" CTA that opens the kit `listing` FormScreen.
 * Submitting is a client-side stub toast until a listings table lands — we never
 * fabricate a table.
 *
 * Design truth: prototype market tab (app.jsx 2284-2332) + LISTINGS (854-861).
 */

export default async function MarketPage() {
  const { t } = await getRequestT();
  // Guard the shell — this page renders no org data yet but stays authed.
  await requireSession();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.market.eyebrow", undefined, "Marketplace")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{t("m.market.title", undefined, "Marketplace")}</h1>
      <MarketView />
    </div>
  );
}
