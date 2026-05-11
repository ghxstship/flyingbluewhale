import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { RateCatalogView } from "./RateCatalogView";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Rate Card" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );

  const session = await requireSession();
  const items = await listOrgScoped("rate_card_items", session.orgId, {
    orderBy: "catalog",
    ascending: true,
    limit: 1000,
  });

  const activeItems = items.filter((i) => i.active !== false);

  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Rate Card"
        subtitle={`${activeItems.length} active rate${activeItems.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/ratecard/items/new" size="sm">
            + Add Rate
          </Button>
        }
      />
      <RateCatalogView items={activeItems} />
    </>
  );
}
