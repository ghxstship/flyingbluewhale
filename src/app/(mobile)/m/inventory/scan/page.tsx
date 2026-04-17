import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function InventoryScan() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Inventory scan</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Scan equipment asset tags to check in/out</p>
      <div className="mt-6">
        <EmptyState
          title="Ready to scan"
          description="Point your camera at an asset tag barcode. Offline scans sync when you reconnect."
          action={<Button href="/console/production/equipment">View equipment →</Button>}
        />
      </div>
    </div>
  );
}
