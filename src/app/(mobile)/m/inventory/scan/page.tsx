import { InventoryScanner } from "./InventoryScanner";

export default function InventoryScanPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Inventory Scan</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Scan or type an asset tag to check in / out.</p>
      <div className="mt-6">
        <InventoryScanner />
      </div>
    </div>
  );
}
