import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function CatalogPage() {
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="Approved item catalog" subtitle="Shared SKU library for POs and requisitions" />
      <div className="page-content">
        <EmptyState
          title="Catalog seeding available"
          description="Import your SKU list via CSV or the API. The catalog powers quick-add on POs and requisitions."
          action={<Button variant="secondary" href="/console/settings/api">View API settings</Button>}
        />
      </div>
    </>
  );
}
