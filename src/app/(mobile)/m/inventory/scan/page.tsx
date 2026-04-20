import { InventoryScanner } from "./InventoryScanner";

export default function InventoryScanPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Inventory scan</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Scan or type an asset tag to check in / out.
      </p>
      <div className="mt-6">
        <InventoryScanner />
      </div>
    </div>
  );
}
