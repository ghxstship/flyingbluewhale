import { requireSession } from "@/lib/auth";
import { listMyAssignments, CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { BatchCheckIn, type BatchAsset } from "./BatchCheckIn";

export const dynamic = "force-dynamic";

/**
 * /m/check-in/batch — multi-select the caller's checked-out gear and return it
 * in one pass. Source = `listMyAssignments` filtered to returnable states.
 */
export default async function BatchCheckInPage() {
  const session = await requireSession();

  const mine = await listMyAssignments(session.orgId, session.userId);
  const returnable = mine.filter((a) =>
    ["issued", "transferred", "delivered"].includes(a.fulfillment_state),
  );

  const assets: BatchAsset[] = returnable.map((a) => {
    const cat = CATALOG_KIND_LABEL_SINGULAR[a.catalog_kind as CatalogKind] ?? a.catalog_kind;
    return {
      id: a.id,
      name: a.title ? `${cat} · ${a.title}` : cat,
      sub: `${a.fulfillment_state}`,
    };
  });

  return (
    <div className="screen screen-anim">
      <BatchCheckIn assets={assets} />
    </div>
  );
}
